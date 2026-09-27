BEGIN;

DO $$
DECLARE
  order_id uuid;
  blocked boolean := false;
BEGIN
  INSERT INTO public.pedidos (paquete, total_usd, mensual_usd, configuracion_snapshot)
  VALUES ('snapshot-fixture', 100, 0, '{"schemaVersion":1,"package":{"label":"Frozen"}}'::jsonb)
  RETURNING id INTO order_id;

  -- No-op snapshot writes and unrelated lifecycle updates remain valid.
  UPDATE public.pedidos
  SET configuracion_snapshot = '{"schemaVersion":1,"package":{"label":"Frozen"}}'::jsonb,
      total_usd = 125
  WHERE id = order_id;
  IF NOT EXISTS (
    SELECT 1 FROM public.pedidos
    WHERE id = order_id AND total_usd = 125
      AND configuracion_snapshot = '{"schemaVersion":1,"package":{"label":"Frozen"}}'::jsonb
  ) THEN
    RAISE EXCEPTION 'same-value snapshot and unrelated order updates should remain valid';
  END IF;

  BEGIN
    UPDATE public.pedidos
    SET configuracion_snapshot = '{"schemaVersion":1,"package":{"label":"Changed"}}'::jsonb
    WHERE id = order_id;
  EXCEPTION WHEN check_violation THEN
    blocked := true;
  END;

  IF NOT blocked THEN
    RAISE EXCEPTION 'expected snapshot replacement to be rejected';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.pedidos
    WHERE id = order_id AND configuracion_snapshot = '{"schemaVersion":1,"package":{"label":"Frozen"}}'::jsonb
  ) THEN
    RAISE EXCEPTION 'rejected replacement must preserve the original snapshot';
  END IF;

  INSERT INTO public.pedidos (paquete, configuracion_snapshot)
  VALUES ('legacy-fixture', NULL)
  RETURNING id INTO order_id;

  blocked := false;
  BEGIN
    UPDATE public.pedidos
    SET configuracion_snapshot = '{"schemaVersion":1}'::jsonb
    WHERE id = order_id;
  EXCEPTION WHEN check_violation THEN
    blocked := true;
  END;

  IF NOT blocked THEN
    RAISE EXCEPTION 'expected legacy snapshot backfill to be rejected';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.pedidos WHERE id = order_id AND configuracion_snapshot IS NULL) THEN
    RAISE EXCEPTION 'legacy null snapshot must remain null';
  END IF;
END;
$$;

ROLLBACK;
