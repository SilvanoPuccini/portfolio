-- El comprobante de la transferencia.
--
-- Hasta acá el cliente tocaba «ya transferí» y del otro lado no quedaba nada
-- que mirar: había que entrar al banco, buscar el movimiento y adivinar cuál
-- de todos era. Esa es la traba real del cobro, no el botón.
--
-- Se guarda contra el pedido y no contra la venta porque lo que se paga es un
-- pedido: el día que un mismo cliente compre dos veces, cada pago tiene que
-- poder señalar el suyo.

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS comprobante_path   text,
  ADD COLUMN IF NOT EXISTS comprobante_nombre text,
  ADD COLUMN IF NOT EXISTS comprobante_at     timestamptz;

COMMENT ON COLUMN pedidos.comprobante_path IS
  'Ruta en el bucket privado «comprobantes». Nunca se sirve por URL pública.';
COMMENT ON COLUMN pedidos.comprobante_nombre IS
  'El nombre con el que lo mandó el cliente, solo para mostrarlo en el panel.';

-- Privado: un comprobante lleva el CBU, el titular y el monto de una persona.
INSERT INTO storage.buckets (id, name, public)
VALUES ('comprobantes', 'comprobantes', false)
ON CONFLICT (id) DO NOTHING;
