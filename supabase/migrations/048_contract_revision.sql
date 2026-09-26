-- Apply after 046/047 and before deploying the verified-signature route.
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS contrato_snapshot jsonb;
CREATE OR REPLACE FUNCTION public.freeze_order_contract(p_order_id uuid, p_lead_id uuid, p_snapshot jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE item public.pedidos%ROWTYPE;
BEGIN
 SELECT * INTO item FROM public.pedidos WHERE id = p_order_id FOR UPDATE;
 IF NOT FOUND OR item.lead_id IS DISTINCT FROM p_lead_id THEN RAISE EXCEPTION 'order_changed'; END IF;
 IF item.contrato_snapshot IS NOT NULL THEN RETURN item.contrato_snapshot; END IF;
 IF item.firmado_at IS NOT NULL THEN RAISE EXCEPTION 'already_signed'; END IF;
 IF p_snapshot->>'revision' IS NULL OR p_snapshot->>'texto' IS NULL THEN RAISE EXCEPTION 'invalid_revision'; END IF;
 UPDATE public.pedidos SET contrato_snapshot = p_snapshot WHERE id = item.id;
 RETURN p_snapshot;
END $$;
CREATE OR REPLACE FUNCTION public.persist_verified_order_signature(
 p_order_id uuid, p_lead_id uuid, p_expected_state text, p_next_state text, p_revision text, p_evidence jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE item public.pedidos%ROWTYPE;
BEGIN
 SELECT * INTO item FROM public.pedidos WHERE id = p_order_id FOR UPDATE;
 IF NOT FOUND OR item.lead_id IS DISTINCT FROM p_lead_id THEN RAISE EXCEPTION 'order_changed'; END IF;
 IF p_revision IS NULL OR item.contrato_snapshot IS NULL
   OR item.contrato_snapshot->>'revision' IS DISTINCT FROM p_revision
   OR p_evidence->>'huella' IS DISTINCT FROM p_revision
   OR p_evidence->>'texto' IS DISTINCT FROM item.contrato_snapshot->>'texto'
 THEN RAISE EXCEPTION 'revision_changed'; END IF;
 RETURN public.persist_order_signature(p_order_id, p_lead_id, p_expected_state, p_next_state, p_evidence);
END $$;
REVOKE ALL ON FUNCTION public.freeze_order_contract(uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.persist_verified_order_signature(uuid,uuid,text,text,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.freeze_order_contract(uuid,uuid,jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.persist_verified_order_signature(uuid,uuid,text,text,text,jsonb) TO service_role;
