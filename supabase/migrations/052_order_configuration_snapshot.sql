-- Freeze the server-validated, buyer-visible configuration for new orders.
-- Historical rows remain NULL and keep their existing totals/contracts.
ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS configuracion_snapshot jsonb;

COMMENT ON COLUMN public.pedidos.configuracion_snapshot IS
  'Versioned server-built buyer configuration. NULL identifies a legacy order; non-NULL values are immutable.';

CREATE OR REPLACE FUNCTION public.prevent_pedido_configuration_snapshot_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.configuracion_snapshot IS DISTINCT FROM OLD.configuracion_snapshot THEN
    RAISE EXCEPTION 'pedido configuration snapshot is immutable'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pedidos_configuration_snapshot_immutable ON public.pedidos;
CREATE TRIGGER pedidos_configuration_snapshot_immutable
  BEFORE UPDATE OF configuracion_snapshot ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_pedido_configuration_snapshot_change();
