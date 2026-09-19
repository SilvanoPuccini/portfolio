-- Migration 026: qué hizo el cliente con el contrato antes de firmar.
--
-- Entre «contrato enviado» y «firmado» había una caja negra. Documenso avisa
-- dos cosas que la abren:
--
--   Abierto  → lo leyó y no firmó. Si pasan días así, es el momento de
--              llamar: tiene una duda que no escribió.
--   Rechazo  → dijo que no, casi siempre con un motivo («no estoy de acuerdo
--              con la cláusula X»). No es una venta perdida: muchas veces es
--              una negociación. Por eso el estado no cambia; se guarda el
--              motivo y el tablero lo reclama como urgente.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS contrato_abierto_at      timestamptz,
  ADD COLUMN IF NOT EXISTS contrato_rechazado_at    timestamptz,
  ADD COLUMN IF NOT EXISTS contrato_rechazo_motivo  text;
