-- Apply before deploying the signing route. No customer evidence is rewritten.
-- Short row locks serialize competing signatures and repair legacy partial state.
CREATE OR REPLACE FUNCTION public.persist_order_signature(
  p_order_id uuid,
  p_lead_id uuid,
  p_expected_state text,
  p_next_state text,
  p_evidence jsonb DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  current_order public.pedidos%ROWTYPE;
  current_lead public.leads%ROWTYPE;
  saved public.firmas%ROWTYPE;
  created boolean := false;
BEGIN
  SELECT * INTO current_order FROM public.pedidos WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND OR current_order.lead_id IS DISTINCT FROM p_lead_id THEN
    RAISE EXCEPTION 'Order ownership changed';
  END IF;
  SELECT * INTO current_lead FROM public.leads WHERE id = p_lead_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lead not found'; END IF;

  SELECT * INTO saved FROM public.firmas
    WHERE pedido_id = p_order_id AND lead_id = p_lead_id
    ORDER BY firmado_at, id LIMIT 1;

  IF saved.id IS NULL THEN
    -- Probe calls can repair committed evidence without creating a new signature.
    IF p_evidence IS NULL THEN RETURN NULL; END IF;
    IF current_order.firmado_at IS NOT NULL OR current_lead.contrato_firmado_at IS NOT NULL THEN
      RAISE EXCEPTION 'Already signed without local evidence';
    END IF;
    INSERT INTO public.firmas (lead_id, pedido_id, nombre, ip, navegador, texto, huella, pdf_path, firmado_at)
      VALUES (p_lead_id, p_order_id, p_evidence->>'nombre', p_evidence->>'ip',
        p_evidence->>'navegador', p_evidence->>'texto', p_evidence->>'huella',
        p_evidence->>'pdf_path', (p_evidence->>'firmado_at')::timestamptz)
      RETURNING * INTO saved;
    created := true;
  END IF;

  UPDATE public.leads SET contrato_firmado_at = saved.firmado_at,
    estado = CASE WHEN estado IS NOT DISTINCT FROM p_expected_state AND p_next_state IS NOT NULL
      THEN p_next_state ELSE estado END
    WHERE id = p_lead_id;
  UPDATE public.pedidos SET firmado_at = saved.firmado_at WHERE id = p_order_id;
  RETURN jsonb_build_object('firmadoAt', saved.firmado_at, 'created', created);
END;
$$;

REVOKE ALL ON FUNCTION public.persist_order_signature(uuid, uuid, text, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.persist_order_signature(uuid, uuid, text, text, jsonb) TO service_role;
