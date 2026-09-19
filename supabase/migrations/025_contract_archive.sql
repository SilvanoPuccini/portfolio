-- Migration 025: contratos vencidos y archivo del PDF firmado.
--
-- Dos huecos que dejó conectar Documenso.
--
-- El contrato vence a los 7 días sin firmar. Hasta ahora el panel no se
-- enteraba: el lead quedaba en «contrato enviado» para siempre, esperando una
-- firma que ya no podía llegar. `contrato_vencido_at` lo marca, y el tablero
-- lo levanta como aviso.
--
-- El PDF firmado, con su certificado (IP, fecha y mail de cada firma), es el
-- respaldo si algún día hay un conflicto por un pago. Documenso lo manda por
-- mail, pero un mail se borra. Se guarda también en Storage, en un bucket
-- PRIVADO: son contratos con datos personales y montos, nunca se sirven con un
-- link público. El panel los muestra con links firmados que vencen.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS contrato_vencido_at  timestamptz,
  ADD COLUMN IF NOT EXISTS contrato_pdf_path    text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('contratos', 'contratos', false)
ON CONFLICT (id) DO NOTHING;
