-- Apply after 050. Preserve every prior period, payment, request, and event in place.
ALTER TABLE public.care_subscriptions ADD COLUMN generation integer NOT NULL DEFAULT 1 CHECK (generation > 0);
ALTER TABLE public.care_periods ADD COLUMN generation integer NOT NULL DEFAULT 1 CHECK (generation > 0);
ALTER TABLE public.care_requests ADD COLUMN generation integer NOT NULL DEFAULT 1 CHECK (generation > 0);
ALTER TABLE public.care_events ADD COLUMN generation integer NOT NULL DEFAULT 1 CHECK (generation > 0);

CREATE TABLE public.care_agreement_history (
 order_id uuid NOT NULL REFERENCES public.pedidos(id),
 generation integer NOT NULL CHECK (generation > 0),
 archived_at timestamptz NOT NULL DEFAULT now(),
 subscription jsonb NOT NULL,
 PRIMARY KEY (order_id, generation)
);
ALTER TABLE public.care_agreement_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.care_agreement_history FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.care_agreement_history TO service_role;

CREATE FUNCTION public.protect_archived_care_row() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
 IF EXISTS (SELECT 1 FROM public.care_subscriptions s WHERE s.order_id=OLD.order_id AND s.generation>OLD.generation) THEN
  RAISE EXCEPTION 'archived_care_immutable';
 END IF;
 IF TG_OP='UPDATE' THEN RETURN NEW; END IF;
 RETURN OLD;
END $$;
CREATE TRIGGER protect_archived_care_period BEFORE UPDATE OR DELETE ON public.care_periods
 FOR EACH ROW EXECUTE FUNCTION public.protect_archived_care_row();
CREATE TRIGGER protect_archived_care_request BEFORE UPDATE OR DELETE ON public.care_requests
 FOR EACH ROW EXECUTE FUNCTION public.protect_archived_care_row();
CREATE TRIGGER protect_archived_care_event BEFORE UPDATE OR DELETE ON public.care_events
 FOR EACH ROW EXECUTE FUNCTION public.protect_archived_care_row();
REVOKE ALL ON FUNCTION public.protect_archived_care_row() FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.require_current_care_generation() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE current_generation integer;
BEGIN
 SELECT s.generation INTO current_generation FROM public.care_subscriptions s WHERE s.order_id=NEW.order_id;
 IF current_generation IS NULL OR NEW.generation IS DISTINCT FROM current_generation THEN
  RAISE EXCEPTION 'invalid_care_generation';
 END IF;
 IF TG_OP='UPDATE' THEN
  IF NEW.generation IS DISTINCT FROM OLD.generation THEN RAISE EXCEPTION 'invalid_care_generation'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER current_care_period BEFORE INSERT OR UPDATE ON public.care_periods
 FOR EACH ROW EXECUTE FUNCTION public.require_current_care_generation();
CREATE TRIGGER current_care_request BEFORE INSERT OR UPDATE ON public.care_requests
 FOR EACH ROW EXECUTE FUNCTION public.require_current_care_generation();
CREATE TRIGGER current_care_event BEFORE INSERT OR UPDATE ON public.care_events
 FOR EACH ROW EXECUTE FUNCTION public.require_current_care_generation();
REVOKE ALL ON FUNCTION public.require_current_care_generation() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.read_order_care(p_order_id uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
 SELECT jsonb_build_object(
  'subscription', (SELECT to_jsonb(s) FROM public.care_subscriptions s WHERE s.order_id=p_order_id),
  'agreements', COALESCE((SELECT jsonb_agg(to_jsonb(h) ORDER BY h.generation) FROM public.care_agreement_history h WHERE h.order_id=p_order_id),'[]'::jsonb),
  'periods', COALESCE((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.ordinal) FROM public.care_periods p WHERE p.order_id=p_order_id),'[]'::jsonb),
  'requests', COALESCE((SELECT jsonb_agg(to_jsonb(r) ORDER BY r.created_at) FROM public.care_requests r WHERE r.order_id=p_order_id),'[]'::jsonb))
$$;

CREATE OR REPLACE FUNCTION public.transition_order_care(p_order_id uuid, p_actor text, p_request_id uuid, p_expected_version integer, p_command jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
 item public.pedidos%ROWTYPE; sub public.care_subscriptions%ROWTYPE;
 period public.care_periods%ROWTYPE; req public.care_requests%ROWTYPE; event public.care_events%ROWTYPE;
 action text := p_command->>'action'; offer jsonb; today date := (now() AT TIME ZONE 'UTC')::date;
 start_date date; end_date date; amount numeric; months integer; cap integer; minutes_cap integer;
 count_used integer; minutes_used integer; requested_minutes integer; resolution text; ordinal integer; cycle_index integer; cycle_generation integer;
BEGIN
 IF p_actor NOT IN ('admin','client') OR p_request_id IS NULL OR p_expected_version IS NULL OR action IS NULL THEN RAISE EXCEPTION 'invalid_command'; END IF;
 SELECT * INTO item FROM public.pedidos WHERE id=p_order_id FOR UPDATE;
 IF NOT FOUND OR item.lead_id IS NULL OR item.firmado_at IS NULL THEN RAISE EXCEPTION 'signed_project_required'; END IF;
 SELECT generation INTO cycle_generation FROM public.care_subscriptions WHERE order_id=p_order_id;
 SELECT * INTO event FROM public.care_events WHERE order_id=p_order_id AND request_id=p_request_id;
 IF FOUND THEN
  IF event.actor <> p_actor OR event.command <> p_command OR event.generation IS DISTINCT FROM cycle_generation THEN RAISE EXCEPTION 'idempotency_conflict'; END IF;
  RETURN public.read_order_care(p_order_id);
 END IF;
 SELECT * INTO sub FROM public.care_subscriptions WHERE order_id=p_order_id FOR UPDATE;
 IF COALESCE(sub.version,0) <> p_expected_version THEN RAISE EXCEPTION 'version_conflict'; END IF;
 IF (p_actor='client' AND action NOT IN ('accept','cancel','transfer','source','request'))
 OR (p_actor='admin' AND action NOT IN ('offer','activate','renew','pay','resolve','close','source_done')) THEN RAISE EXCEPTION 'forbidden_action'; END IF;
 IF action='offer' THEN
  IF sub.status IS NOT NULL AND sub.status NOT IN ('offered','accepted','closed','active') THEN RAISE EXCEPTION 'agreement_locked'; END IF;
  IF sub.status='active' THEN
   SELECT * INTO period FROM public.care_periods p WHERE p.order_id=p_order_id AND p.generation=sub.generation ORDER BY p.ordinal DESC LIMIT 1;
   IF period.id IS NULL OR period.ends_on>=today THEN RAISE EXCEPTION 'agreement_locked'; END IF;
  END IF;
  IF sub.status IN ('closed','active') AND EXISTS (
   SELECT 1 FROM public.care_requests r WHERE r.order_id=p_order_id AND r.generation=sub.generation AND r.status IN ('pending','included','warranty')
  ) THEN RAISE EXCEPTION 'open_requests_require_resolution'; END IF;
  IF sub.status IN ('closed','active') AND sub.source_requested_at IS NOT NULL AND sub.source_completed_at IS NULL
   THEN RAISE EXCEPTION 'source_request_pending'; END IF;
  offer := p_command->'offer';
  IF offer IS NULL OR jsonb_typeof(offer) <> 'object' OR offer->>'packageSlug' IS DISTINCT FROM item.paquete
   OR COALESCE(offer->>'revision','') !~ '^[a-f0-9]{64}$' OR COALESCE(offer->>'version','') = '' OR length(COALESCE(offer->>'inspectionNote',''))<8
   OR jsonb_typeof(offer->'terms'->'es') IS DISTINCT FROM 'array' OR jsonb_typeof(offer->'terms'->'en') IS DISTINCT FROM 'array'
  THEN RAISE EXCEPTION 'invalid_offer'; END IF;
  start_date := (offer->>'startsOn')::date;
  IF (offer->>'deliveredOn')::date > today OR start_date < today
   OR start_date < (offer->>'deliveredOn')::date + 30 THEN RAISE EXCEPTION 'invalid_start'; END IF;
  amount := (offer->>'amountUsd')::numeric; months := (offer->>'intervalMonths')::integer;
  cap := (offer->>'requests')::integer; minutes_cap := (offer->>'minutes')::integer;
  IF amount IS NULL OR months IS NULL OR cap IS NULL OR minutes_cap IS NULL OR start_date IS NULL OR offer->>'deliveredOn' IS NULL THEN RAISE EXCEPTION 'invalid_offer'; END IF;
  IF item.paquete='landing' THEN
   IF amount<>40 OR months<>3 OR cap<>1 OR minutes_cap<>30 THEN RAISE EXCEPTION 'invalid_plan'; END IF;
  ELSIF item.paquete IN ('catalogo-whatsapp','catalogo-cobro','web-cinco-secciones','una-automatizacion','tres-automatizaciones') THEN
   IF amount<>60 OR months<>1 OR cap<>1 OR minutes_cap<>60 THEN RAISE EXCEPTION 'invalid_plan'; END IF;
  ELSIF item.paquete='web-con-blog' THEN
   IF amount<>90 OR months<>1 OR cap<>2 OR minutes_cap<>90 THEN RAISE EXCEPTION 'invalid_plan'; END IF;
  ELSIF item.paquete='sistema' THEN
   IF amount<250 OR amount>100000 OR months<>1 OR cap<>1 OR minutes_cap<>180 OR length(COALESCE(offer->>'scope',''))<8 THEN RAISE EXCEPTION 'written_quote_required'; END IF;
  ELSE RAISE EXCEPTION 'supported_project_required'; END IF;
  IF sub.status IN ('closed','active') THEN
   INSERT INTO public.care_agreement_history(order_id,generation,subscription) VALUES(p_order_id,sub.generation,to_jsonb(sub));
   UPDATE public.care_subscriptions SET generation=sub.generation+1,status='offered',offer=p_command->'offer',
    accepted_at=NULL,activated_at=NULL,cancel_on=NULL,exit_note=NULL,
    source_requested_at=NULL,source_note=NULL,source_completed_at=NULL,version=sub.version+1
    WHERE order_id=p_order_id;
  ELSE
   INSERT INTO public.care_subscriptions(order_id,status,offer) VALUES(p_order_id,'offered',offer)
    ON CONFLICT(order_id) DO UPDATE SET status='offered',offer=EXCLUDED.offer,accepted_at=NULL,version=public.care_subscriptions.version+1;
  END IF;
 ELSE
  IF sub.order_id IS NULL THEN RAISE EXCEPTION 'offer_required'; END IF;
  offer := sub.offer; amount := (offer->>'amountUsd')::numeric; months := (offer->>'intervalMonths')::integer;
  cap := (offer->>'requests')::integer; minutes_cap := (offer->>'minutes')::integer;
  SELECT * INTO period FROM public.care_periods WHERE order_id=p_order_id AND generation=sub.generation ORDER BY public.care_periods.ordinal DESC LIMIT 1;
  IF action='accept' THEN
   IF sub.status<>'offered' OR offer->>'revision' IS DISTINCT FROM p_command->>'revision' THEN RAISE EXCEPTION 'offer_changed'; END IF;
   IF (offer->>'startsOn')::date < today THEN RAISE EXCEPTION 'offer_expired'; END IF;
   UPDATE public.care_subscriptions SET status='accepted',accepted_at=now() WHERE order_id=p_order_id;
  ELSIF action='activate' OR action='renew' THEN
   IF action='activate' THEN
    IF sub.status<>'accepted' OR sub.accepted_at IS NULL OR (offer->>'startsOn')::date<>today
      OR today < (offer->>'deliveredOn')::date+30 THEN RAISE EXCEPTION 'activation_not_due'; END IF;
    SELECT COALESCE(max(p.ordinal)+1,0) INTO ordinal FROM public.care_periods p WHERE p.order_id=p_order_id;
    cycle_index:=0;
   ELSE
    IF sub.status<>'active' OR sub.cancel_on IS NOT NULL OR period.id IS NULL OR (period.ends_on<>today OR period.paid_at IS NULL) THEN RAISE EXCEPTION 'renewal_not_due'; END IF;
    ordinal:=period.ordinal+1;
    SELECT count(*) INTO cycle_index FROM public.care_periods p WHERE p.order_id=p_order_id AND p.generation=sub.generation;
   END IF;
   start_date:=public.care_month_boundary((offer->>'startsOn')::date,cycle_index*months);
   end_date:=public.care_month_boundary((offer->>'startsOn')::date,(cycle_index+1)*months);
   INSERT INTO public.care_periods(order_id,generation,ordinal,starts_on,ends_on,amount_usd,offer_revision)
    VALUES(p_order_id,sub.generation,ordinal,start_date,end_date,amount,offer->>'revision');
   UPDATE public.care_subscriptions SET status='active',activated_at=COALESCE(activated_at,now()) WHERE order_id=p_order_id;
  ELSIF action='pay' THEN
   SELECT * INTO period FROM public.care_periods WHERE id=(p_command->>'periodId')::uuid AND order_id=p_order_id AND generation=sub.generation FOR UPDATE;
   IF NOT FOUND OR period.paid_at IS NOT NULL THEN RAISE EXCEPTION 'unpaid_period_required'; END IF;
   IF (p_command->>'amountUsd')::numeric IS DISTINCT FROM period.amount_usd OR length(trim(COALESCE(p_command->>'reference','')))<4
    OR (p_command->>'paidOn')::date IS NULL OR (p_command->>'paidOn')::date>today OR (p_command->>'paidOn')::date<(sub.accepted_at AT TIME ZONE 'UTC')::date THEN RAISE EXCEPTION 'invalid_payment'; END IF;
   UPDATE public.care_periods SET paid_at=now(),paid_on=(p_command->>'paidOn')::date,payment_reference=trim(p_command->>'reference') WHERE id=period.id;
  ELSIF action IN ('cancel','transfer') THEN
   IF sub.status='closed' THEN RAISE EXCEPTION 'already_closed'; END IF;
   UPDATE public.care_subscriptions SET status=CASE WHEN action='transfer' THEN 'transfer_requested' ELSE 'cancel_pending' END,
    cancel_on=COALESCE(cancel_on,GREATEST(today,period.ends_on)),exit_note=COALESCE(p_command->>'note','Cancel at period end; arrange transfer.') WHERE order_id=p_order_id;
  ELSIF action='close' THEN
   IF sub.status NOT IN ('cancel_pending','transfer_requested') OR sub.cancel_on>today OR length(COALESCE(p_command->>'note',''))<8 THEN RAISE EXCEPTION 'transfer_not_due'; END IF;
   UPDATE public.care_subscriptions SET status='closed',exit_note=p_command->>'note' WHERE order_id=p_order_id;
  ELSIF action='source' THEN
   IF sub.source_requested_at IS NOT NULL AND sub.source_completed_at IS NULL THEN RAISE EXCEPTION 'source_request_pending'; END IF;
   IF length(COALESCE(p_command->>'note',''))<8 THEN RAISE EXCEPTION 'invalid_request'; END IF;
   UPDATE public.care_subscriptions SET source_requested_at=now(),source_completed_at=NULL,source_note=p_command->>'note' WHERE order_id=p_order_id;
  ELSIF action='source_done' THEN
   IF sub.source_requested_at IS NULL OR sub.source_completed_at IS NOT NULL OR length(COALESCE(p_command->>'note',''))<8 THEN RAISE EXCEPTION 'source_request_required'; END IF;
   UPDATE public.care_subscriptions SET source_completed_at=now(),source_note=p_command->>'note' WHERE order_id=p_order_id;
  ELSIF action='request' THEN
   IF sub.status='closed' OR p_command->>'kind' NOT IN ('small','defect') OR length(COALESCE(p_command->>'description','')) NOT BETWEEN 8 AND 2000 THEN RAISE EXCEPTION 'invalid_request'; END IF;
   SELECT * INTO period FROM public.care_periods WHERE order_id=p_order_id AND generation=sub.generation AND starts_on<=today AND ends_on>today;
   resolution:='pending';
   IF p_command->>'kind'='small' THEN
    IF period.paid_at IS NULL THEN RAISE EXCEPTION 'paid_period_required'; END IF;
    IF period.id IS NULL THEN resolution:='quote_required';
    ELSE
     SELECT count(*) INTO count_used FROM public.care_requests WHERE period_id=period.id AND generation=sub.generation AND kind='small' AND status<>'quote_required';
     IF count_used>=cap THEN resolution:='quote_required'; END IF;
    END IF;
   END IF;
   INSERT INTO public.care_requests(order_id,generation,period_id,kind,description,status)
    VALUES(p_order_id,sub.generation,period.id,p_command->>'kind',p_command->>'description',resolution);
  ELSIF action='resolve' THEN
   SELECT * INTO req FROM public.care_requests WHERE id=(p_command->>'requestId')::uuid AND order_id=p_order_id AND generation=sub.generation FOR UPDATE;
   IF NOT FOUND OR req.status='completed' THEN RAISE EXCEPTION 'open_request_required'; END IF;
   resolution:=p_command->>'resolution'; requested_minutes:=(p_command->>'minutes')::integer;
   IF resolution NOT IN ('included','warranty','quote_required','completed') OR requested_minutes IS NULL OR requested_minutes<0 OR requested_minutes>180 OR length(COALESCE(p_command->>'note',''))<8 THEN RAISE EXCEPTION 'invalid_resolution'; END IF;
   IF resolution='warranty' THEN
    IF req.kind<>'defect' OR (req.created_at AT TIME ZONE 'UTC')::date >= (offer->>'deliveredOn')::date+30 THEN RAISE EXCEPTION 'warranty_expired'; END IF;
    requested_minutes:=0;
   ELSIF resolution='quote_required' THEN requested_minutes:=0;
   ELSIF resolution='completed' AND req.status='warranty' THEN requested_minutes:=0;
   ELSE
    IF req.period_id IS NULL OR NOT EXISTS(SELECT 1 FROM public.care_periods WHERE id=req.period_id AND paid_at IS NOT NULL) OR (resolution='completed' AND req.status<>'included') THEN RAISE EXCEPTION 'included_review_required'; END IF;
    SELECT count(*),COALESCE(sum(minutes),0) INTO count_used,minutes_used FROM public.care_requests
     WHERE period_id=req.period_id AND generation=sub.generation AND id<>req.id AND status IN ('included','completed') AND kind='small';
    IF count_used+1>cap OR minutes_used+requested_minutes>minutes_cap OR requested_minutes=0 THEN RAISE EXCEPTION 'quote_required'; END IF;
    IF resolution='completed' AND requested_minutes>req.minutes THEN RAISE EXCEPTION 'approved_estimate_exceeded'; END IF;
    UPDATE public.care_requests SET kind='small' WHERE id=req.id;
   END IF;
   UPDATE public.care_requests SET status=resolution,minutes=requested_minutes,note=p_command->>'note' WHERE id=req.id;
  ELSE RAISE EXCEPTION 'invalid_action'; END IF;
  UPDATE public.care_subscriptions SET version=version+1 WHERE order_id=p_order_id;
 END IF;
 SELECT generation INTO cycle_generation FROM public.care_subscriptions WHERE order_id=p_order_id;
 INSERT INTO public.care_events(order_id,request_id,actor,command,generation) VALUES(p_order_id,p_request_id,p_actor,p_command,cycle_generation);
 RETURN public.read_order_care(p_order_id);
END $$;
