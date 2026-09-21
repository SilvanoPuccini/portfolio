-- El pedido, registrado antes de la firma.
--
-- Hasta ahora la venta de un paquete nacía recién cuando alguien terminaba de
-- firmar, y lo único que se sabía era qué plantilla se había usado. Con eso
-- alcanzaba para un paquete pelado, pero se rompe apenas hay extras: no se
-- puede tener una plantilla de Documenso por cada combinación posible.
--
-- Acá queda lo que el cliente eligió en el momento en que lo eligió, con su
-- precio congelado. Sirve para tres cosas:
--   1. El contrato y el mail de pago salen por el total real, no por el de lista.
--   2. Si mañana sube la lista, lo que se eligió ayer no se mueve.
--   3. Los pedidos que NO terminan en firma quedan registrados. Que veinte
--      personas tilden «agenda de turnos» y ninguna compre es información de
--      negocio que hoy se pierde sin dejar rastro.
--
-- `lead_id` se completa cuando la firma llega: el pedido nace sin dueño porque
-- el nombre y el mail los pide Documenso, no nosotros. Un campo más antes de
-- comprar es gente que abandona.

CREATE TABLE IF NOT EXISTS pedidos (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  paquete     text        NOT NULL,
  extras      jsonb       NOT NULL DEFAULT '[]'::jsonb,
  total_usd   numeric     NOT NULL DEFAULT 0,
  mensual_usd numeric     NOT NULL DEFAULT 0,
  locale      text        NOT NULL DEFAULT 'es',
  lead_id     uuid        REFERENCES leads(id) ON DELETE SET NULL,
  firmado_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pedidos_lead_id ON pedidos (lead_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_created_at ON pedidos (created_at DESC);

ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE pedidos FROM anon, authenticated;
