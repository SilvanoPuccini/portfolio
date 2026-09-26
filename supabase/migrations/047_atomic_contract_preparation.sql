-- Apply before deploying the contract-preparation route.
-- A claimed external request is never automatically repeated after an unknown result.
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS contract_provider_claimed_at timestamptz;

CREATE OR REPLACE FUNCTION public.prepare_order_contract(
  p_order_id uuid, p_details jsonb, p_external boolean DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  item public.pedidos%ROWTYPE;
  buyer public.leads%ROWTYPE;
  created boolean := false;
  provision boolean := false;
BEGIN
  SELECT * INTO item FROM public.pedidos WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'order_not_found'; END IF;
  IF item.firmado_at IS NOT NULL THEN RAISE EXCEPTION 'order_signed'; END IF;

  IF item.lead_id IS NOT NULL THEN
    SELECT * INTO buyer FROM public.leads WHERE id = item.lead_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'linked_buyer_not_found'; END IF;
    IF buyer.contrato_firmado_at IS NOT NULL THEN RAISE EXCEPTION 'order_signed'; END IF;
    IF lower(btrim(buyer.email)) IS DISTINCT FROM lower(btrim(p_details->>'email'))
      OR lower(regexp_replace(btrim(buyer.nombre), '\s+', ' ', 'g')) IS DISTINCT FROM lower(regexp_replace(btrim(p_details->>'nombre'), '\s+', ' ', 'g'))
      OR lower(btrim(coalesce(buyer.pais, ''))) IS DISTINCT FROM lower(btrim(coalesce(p_details->>'pais', '')))
    THEN RAISE EXCEPTION 'buyer_conflict'; END IF;
  ELSE
    INSERT INTO public.leads (nombre, email, pais, tipo_proyecto, que_construir, estado,
      monto_presupuestado, mantenimiento_mensual, pago_unico, service, modulos_seleccionados,
      pedido_snapshot, contract_sent_at)
    VALUES (btrim(p_details->>'nombre'), lower(btrim(p_details->>'email')), nullif(btrim(p_details->>'pais'), ''),
      p_details->>'tipo_proyecto', p_details->>'que_construir', 'contrato_enviado',
      item.total_usd, nullif(item.mensual_usd, 0), (p_details->>'pago_unico')::boolean,
      p_details->>'service', p_details->'modulos_seleccionados',
      jsonb_build_object('paquete', item.paquete, 'extras', item.extras, 'totalUsd', item.total_usd,
        'mensualUsd', item.mensual_usd, 'congeladoAt', now()), now()) RETURNING * INTO buyer;
    UPDATE public.pedidos SET lead_id = buyer.id WHERE id = item.id;
    created := true;
  END IF;

  IF p_external AND buyer.contrato_signing_url IS NULL AND buyer.contrato_firma_token IS NULL
    AND buyer.contrato_envelope_id IS NULL AND item.contract_provider_claimed_at IS NULL THEN
    UPDATE public.pedidos SET contract_provider_claimed_at = now() WHERE id = item.id;
    provision := true;
  END IF;
  RETURN jsonb_build_object('id', buyer.id, 'created', created, 'provision', provision,
    'signingUrl', buyer.contrato_signing_url, 'token', buyer.contrato_firma_token);
END;
$$;
REVOKE ALL ON FUNCTION public.prepare_order_contract(uuid, jsonb, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prepare_order_contract(uuid, jsonb, boolean) TO service_role;
