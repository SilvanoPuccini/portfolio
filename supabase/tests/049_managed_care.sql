-- Disposable PostgreSQL only. This fixture creates its own minimal application tables.
\set ON_ERROR_STOP on
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role BYPASSRLS; END IF;
END $$;
CREATE TABLE public.leads(id uuid PRIMARY KEY);
CREATE TABLE public.pedidos(id uuid PRIMARY KEY,lead_id uuid REFERENCES public.leads,paquete text,firmado_at timestamptz);
GRANT SELECT,UPDATE ON public.pedidos TO service_role;
\ir ../migrations/049_managed_care.sql
\ir ../migrations/050_managed_care_runtime_guards.sql
\ir ../migrations/051_managed_care_agreement_generations.sql
INSERT INTO public.leads VALUES('10000000-0000-4000-8000-000000000001');
INSERT INTO public.pedidos SELECT ('20000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'10000000-0000-4000-8000-000000000001','landing',now() FROM generate_series(1,5) n;
CREATE FUNCTION public.test_offer(starts date, delivered date) RETURNS jsonb LANGUAGE sql AS $$
 SELECT jsonb_build_object('action','offer','offer',jsonb_build_object('packageSlug','landing','revision',repeat('a',64),'version','test-v1','amountUsd',40,'intervalMonths',3,'requests',1,'minutes',30,'startsOn',starts,'deliveredOn',delivered,'scope','Hosting and bounded care','inspectionNote','Inspected existing deployment and access.','terms',jsonb_build_object('es',jsonb_build_array('Frozen terms'),'en',jsonb_build_array('Frozen terms'))))
$$;
CREATE FUNCTION public.expect_care_error(command text, expected text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
 BEGIN EXECUTE command; EXCEPTION WHEN OTHERS THEN
  IF SQLERRM=expected THEN RETURN; END IF; RAISE;
 END;
 RAISE EXCEPTION 'Expected error %',expected;
END $$;
DO $$
DECLARE id uuid:='20000000-0000-4000-8000-000000000001'; rid uuid:=gen_random_uuid(); pid uuid; request_id uuid; before_version integer; result jsonb; command jsonb;
 today date:=(now() AT TIME ZONE 'UTC')::date;
BEGIN
 ASSERT public.care_month_boundary('2028-01-31',1)='2028-02-29'::date;
 ASSERT public.care_month_boundary('2028-01-31',2)='2028-03-31'::date;
 ASSERT NOT has_function_privilege('anon','public.transition_order_care(uuid,text,uuid,integer,jsonb)','EXECUTE');
 ASSERT NOT has_function_privilege('authenticated','public.read_order_care(uuid)','EXECUTE');
 ASSERT NOT has_table_privilege('anon','public.care_subscriptions','SELECT');
 ASSERT NOT has_table_privilege('authenticated','public.care_periods','UPDATE');
 ASSERT (SELECT relrowsecurity FROM pg_class WHERE oid='public.care_subscriptions'::regclass);
 result:=public.transition_order_care(id,'admin',rid,0,public.test_offer(today,today-30));
 ASSERT result->'subscription'->>'status'='offered';
 PERFORM public.transition_order_care(id,'admin',rid,0,public.test_offer(today,today-30));
 ASSERT (SELECT version=1 FROM public.care_subscriptions WHERE order_id='20000000-0000-4000-8000-000000000001');
 PERFORM public.expect_care_error(format('SELECT public.transition_order_care(%L,''admin'',%L,1,%L)',id,rid,'{"action":"activate"}'),'idempotency_conflict');
 PERFORM public.expect_care_error(format('SELECT public.transition_order_care(%L,''client'',%L,1,%L)',id,gen_random_uuid(),'{"action":"pay"}'),'forbidden_action');
 PERFORM public.expect_care_error(format('SELECT public.transition_order_care(%L,''client'',%L,1,%L)',id,gen_random_uuid(),'{"action":"accept","revision":"wrong"}'),'offer_changed');
 PERFORM public.transition_order_care(id,'client',gen_random_uuid(),1,jsonb_build_object('action','accept','revision',repeat('a',64)));
 PERFORM public.transition_order_care(id,'admin',gen_random_uuid(),2,'{"action":"activate"}');
 SELECT p.id INTO pid FROM public.care_periods p WHERE p.order_id='20000000-0000-4000-8000-000000000001';
 ASSERT (SELECT paid_at IS NULL AND amount_usd=40 FROM public.care_periods WHERE care_periods.id=pid);
END $$;
DO $$
DECLARE oid uuid:='20000000-0000-4000-8000-000000000001'; pid uuid; rid uuid; cmd jsonb; version_before integer;
 today date:=(now() AT TIME ZONE 'UTC')::date;
BEGIN
 SELECT id INTO pid FROM public.care_periods WHERE order_id=oid;
 PERFORM public.expect_care_error(format('SELECT public.transition_order_care(%L,''client'',%L,3,%L)',oid,gen_random_uuid(),'{"action":"request","kind":"small","description":"Please update title"}'),'paid_period_required');
 cmd:=jsonb_build_object('action','pay','periodId',pid,'amountUsd',39,'reference','BANK-UNIQUE-1','paidOn',today);
 PERFORM public.expect_care_error(format('SELECT public.transition_order_care(%L,''admin'',%L,3,%L)',oid,gen_random_uuid(),cmd),'invalid_payment');
 cmd:=cmd||'{"amountUsd":40}'::jsonb; rid:=gen_random_uuid();
 PERFORM public.transition_order_care(oid,'admin',rid,3,cmd);
 PERFORM public.transition_order_care(oid,'admin',rid,3,cmd);
 ASSERT (SELECT version=4 FROM public.care_subscriptions WHERE order_id=oid);
 ASSERT (SELECT paid_at IS NOT NULL AND payment_reference='BANK-UNIQUE-1' FROM public.care_periods WHERE id=pid);
 ASSERT (SELECT count(*)=1 FROM public.care_events WHERE order_id=oid AND request_id=rid);
 PERFORM public.transition_order_care(oid,'client',gen_random_uuid(),4,'{"action":"request","kind":"small","description":"Please update title"}');
 PERFORM public.transition_order_care(oid,'client',gen_random_uuid(),5,'{"action":"request","kind":"small","description":"Second request exceeds cap"}');
 ASSERT (SELECT count(*)=1 FROM public.care_requests WHERE order_id=oid AND status='quote_required');
 SELECT id INTO rid FROM public.care_requests WHERE order_id=oid AND status='pending';
 cmd:=jsonb_build_object('action','resolve','requestId',rid,'resolution','included','minutes',31,'note','Review estimate exceeds cap');
 PERFORM public.expect_care_error(format('SELECT public.transition_order_care(%L,''admin'',%L,6,%L)',oid,gen_random_uuid(),cmd),'quote_required');
 PERFORM public.transition_order_care(oid,'admin',gen_random_uuid(),6,cmd||'{"minutes":25}'::jsonb);
 cmd:=cmd||'{"resolution":"completed","minutes":26}'::jsonb;
 PERFORM public.expect_care_error(format('SELECT public.transition_order_care(%L,''admin'',%L,7,%L)',oid,gen_random_uuid(),cmd),'approved_estimate_exceeded');
 PERFORM public.transition_order_care(oid,'admin',gen_random_uuid(),7,cmd||'{"minutes":20}'::jsonb);
 ASSERT (SELECT status='completed' AND minutes=20 FROM public.care_requests WHERE id=rid);
 PERFORM public.transition_order_care(oid,'client',gen_random_uuid(),8,'{"action":"source","note":"Please provide source securely"}');
 ASSERT (SELECT status='active' FROM public.care_subscriptions WHERE order_id=oid);
 PERFORM public.transition_order_care(oid,'client',gen_random_uuid(),9,'{"action":"cancel"}');
 ASSERT (SELECT status='cancel_pending' AND cancel_on=(SELECT ends_on FROM public.care_periods WHERE id=pid) FROM public.care_subscriptions WHERE order_id=oid);
 PERFORM public.expect_care_error(format('SELECT public.transition_order_care(%L,''admin'',%L,10,%L)',oid,gen_random_uuid(),'{"action":"renew"}'),'renewal_not_due');
 PERFORM public.expect_care_error(format('SELECT public.transition_order_care(%L,''admin'',%L,10,%L)',oid,gen_random_uuid(),'{"action":"close","note":"Confirmed handover"}'),'transfer_not_due');
 PERFORM public.expect_care_error(format('SELECT public.transition_order_care(%L,''client'',%L,9,%L)',oid,gen_random_uuid(),'{"action":"cancel"}'),'version_conflict');
END $$;
DO $$
DECLARE oid uuid:='20000000-0000-4000-8000-000000000002'; rid uuid; today date:=(now() AT TIME ZONE 'UTC')::date;
BEGIN
 PERFORM public.transition_order_care(oid,'admin',gen_random_uuid(),0,public.test_offer(today+30,today));
 PERFORM public.transition_order_care(oid,'client',gen_random_uuid(),1,'{"action":"request","kind":"defect","description":"Original form is broken"}');
 SELECT id INTO rid FROM public.care_requests WHERE order_id=oid;
 PERFORM public.transition_order_care(oid,'admin',gen_random_uuid(),2,jsonb_build_object('action','resolve','requestId',rid,'resolution','warranty','minutes',0,'note','Confirmed original defect'));
 ASSERT (SELECT status='warranty' AND minutes=0 AND period_id IS NULL FROM public.care_requests WHERE id=rid);
 PERFORM public.transition_order_care(oid,'client',gen_random_uuid(),3,jsonb_build_object('action','accept','revision',repeat('a',64)));
 PERFORM public.expect_care_error(format('SELECT public.transition_order_care(%L,''admin'',%L,4,%L)',oid,gen_random_uuid(),'{"action":"activate"}'),'activation_not_due');
 PERFORM public.transition_order_care(oid,'admin',gen_random_uuid(),4,public.test_offer(today+31,today));
 ASSERT (SELECT accepted_at IS NULL AND status='offered' FROM public.care_subscriptions WHERE order_id=oid);
 ASSERT NOT EXISTS(SELECT 1 FROM public.care_periods WHERE order_id=oid);
END $$;
-- A late first enrollment creates no retroactive periods or debt.
SELECT public.transition_order_care('20000000-0000-4000-8000-000000000003','admin',gen_random_uuid(),0,public.test_offer((now() AT TIME ZONE 'UTC')::date,(now() AT TIME ZONE 'UTC')::date-120));
DO $$ BEGIN ASSERT NOT EXISTS(SELECT 1 FROM public.care_periods WHERE order_id='20000000-0000-4000-8000-000000000003'); END $$;
-- Verify the entire mutation rolls back if its evidence write fails.
CREATE FUNCTION reject_care_event() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'simulated_evidence_failure'; END $$;
CREATE TRIGGER reject_care_event BEFORE INSERT ON public.care_events FOR EACH ROW EXECUTE FUNCTION reject_care_event();
SELECT public.expect_care_error(format('SELECT public.transition_order_care(%L,''admin'',%L,0,%L)','20000000-0000-4000-8000-000000000004',gen_random_uuid(),public.test_offer((now() AT TIME ZONE 'UTC')::date,(now() AT TIME ZONE 'UTC')::date-30)),'simulated_evidence_failure');
DO $$ BEGIN ASSERT NOT EXISTS(SELECT 1 FROM public.care_subscriptions WHERE order_id='20000000-0000-4000-8000-000000000004'); END $$;
DROP TRIGGER reject_care_event ON public.care_events;
-- Lapsed active agreement: a fresh accepted generation starts today, never backfills the gap.
DO $$
DECLARE oid uuid:='20000000-0000-4000-8000-000000000003'; pid uuid; today date:=(now() AT TIME ZONE 'UTC')::date; old_event_count integer;
BEGIN
 PERFORM public.transition_order_care(oid,'client',gen_random_uuid(),1,jsonb_build_object('action','accept','revision',repeat('a',64)));
 PERFORM public.transition_order_care(oid,'admin',gen_random_uuid(),2,'{"action":"activate"}');
 SELECT id INTO pid FROM public.care_periods WHERE order_id=oid AND generation=1;
 PERFORM public.transition_order_care(oid,'admin',gen_random_uuid(),3,jsonb_build_object('action','pay','periodId',pid,'amountUsd',40,'reference','CARE-OLD-3','paidOn',today));
 UPDATE public.care_periods SET starts_on=today-2,ends_on=today-1 WHERE id=pid;
 SELECT count(*) INTO old_event_count FROM public.care_events WHERE order_id=oid AND generation=1;
 PERFORM public.transition_order_care(oid,'admin',gen_random_uuid(),4,public.test_offer(today,today-30));
 ASSERT (SELECT generation=2 AND status='offered' AND version=5 FROM public.care_subscriptions WHERE order_id=oid);
 ASSERT (SELECT count(*)=1 FROM public.care_agreement_history WHERE order_id=oid AND generation=1);
 ASSERT (SELECT count(*)=1 FROM public.care_periods WHERE order_id=oid);
 ASSERT (SELECT count(*)=old_event_count FROM public.care_events WHERE order_id=oid AND generation=1);
 ASSERT (SELECT paid_at IS NOT NULL AND generation=1 FROM public.care_periods WHERE id=pid);
 PERFORM public.expect_care_error(format('UPDATE public.care_periods SET payment_reference=''FORGED'' WHERE id=%L',pid),'invalid_care_generation');
 PERFORM public.expect_care_error(format('DELETE FROM public.care_events WHERE order_id=%L AND generation=1',oid),'archived_care_immutable');
 PERFORM public.expect_care_error(format('SELECT public.transition_order_care(%L,''admin'',%L,5,%L)',oid,gen_random_uuid(),jsonb_build_object('action','pay','periodId',pid,'amountUsd',40,'reference','CARE-OLD-NEW','paidOn',today)),'unpaid_period_required');
 PERFORM public.transition_order_care(oid,'client',gen_random_uuid(),5,jsonb_build_object('action','accept','revision',repeat('a',64)));
 PERFORM public.transition_order_care(oid,'admin',gen_random_uuid(),6,'{"action":"activate"}');
 ASSERT (SELECT count(*)=1 FROM public.care_periods WHERE order_id=oid AND generation=2 AND ordinal=1 AND starts_on=today);
 PERFORM public.expect_care_error(format('SELECT public.transition_order_care(%L,''client'',%L,7,%L)',oid,gen_random_uuid(),' {"action":"request","kind":"small","description":"New period has not been paid"}'),'paid_period_required');
 ASSERT (SELECT count(*)=2 FROM public.care_periods WHERE order_id=oid);
END $$;
-- Closed agreement: preserve the old snapshot and require new acceptance before activation.
DO $$
DECLARE oid uuid:='20000000-0000-4000-8000-000000000005'; pid uuid; rid uuid; today date:=(now() AT TIME ZONE 'UTC')::date;
BEGIN
 PERFORM public.transition_order_care(oid,'admin',gen_random_uuid(),0,public.test_offer(today,today-30));
 PERFORM public.transition_order_care(oid,'client',gen_random_uuid(),1,jsonb_build_object('action','accept','revision',repeat('a',64)));
 PERFORM public.transition_order_care(oid,'admin',gen_random_uuid(),2,'{"action":"activate"}');
 SELECT id INTO pid FROM public.care_periods WHERE order_id=oid;
 UPDATE public.care_periods SET starts_on=today-2,ends_on=today-1 WHERE id=pid;
 INSERT INTO public.care_requests(order_id,generation,kind,description,status) VALUES(oid,1,'defect','Historical quoted issue','quote_required') RETURNING id INTO rid;
 PERFORM public.transition_order_care(oid,'client',gen_random_uuid(),3,'{"action":"cancel"}');
 PERFORM public.transition_order_care(oid,'admin',gen_random_uuid(),4,'{"action":"close","note":"Transfer completed and confirmed"}');
 PERFORM public.transition_order_care(oid,'admin',gen_random_uuid(),5,public.test_offer(today,today-30));
 ASSERT (SELECT subscription->>'status'='closed' FROM public.care_agreement_history WHERE order_id=oid AND generation=1);
 ASSERT (SELECT status='offered' AND accepted_at IS NULL AND generation=2 FROM public.care_subscriptions WHERE order_id=oid);
 ASSERT (SELECT status='quote_required' AND generation=1 FROM public.care_requests WHERE id=rid);
 PERFORM public.expect_care_error(format('UPDATE public.care_requests SET note=''FORGED'' WHERE id=%L',rid),'invalid_care_generation');
 PERFORM public.expect_care_error(format('SELECT public.transition_order_care(%L,''admin'',%L,6,%L)',oid,gen_random_uuid(),' {"action":"activate"}'),'activation_not_due');
 PERFORM public.transition_order_care(oid,'client',gen_random_uuid(),6,jsonb_build_object('action','accept','revision',repeat('a',64)));
 ASSERT (SELECT count(*)=1 FROM public.care_periods WHERE order_id=oid);
END $$;
SET ROLE service_role;
SELECT public.read_order_care('20000000-0000-4000-8000-000000000001');
RESET ROLE;
SELECT 'Managed care assertions passed';
