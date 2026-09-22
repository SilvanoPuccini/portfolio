-- La firma del contrato, hecha en nuestro sitio.
--
-- El cliente lee el contrato completo en pantalla, escribe su nombre y
-- acepta. Eso es una firma electrónica y vale para un contrato como este; lo
-- que la sostiene es la evidencia que queda guardada alrededor.
--
-- Por eso se guarda todo: cuándo, desde qué dirección, con qué navegador, el
-- texto completo del contrato tal como lo leyó, y su huella digital. Si algún
-- día hay que probar qué firmó, se prueba con esto.
--
-- La huella ata las dos puntas: si el PDF archivado no da la misma huella que
-- la guardada al firmar, es que alguien lo cambió después.
--
-- Se guarda el texto entero a propósito, aunque ocupe: una huella sin el
-- texto original no prueba nada, porque no hay con qué compararla.

CREATE TABLE IF NOT EXISTS firmas (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     uuid        NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  pedido_id   uuid        REFERENCES pedidos(id) ON DELETE SET NULL,
  nombre      text        NOT NULL,
  ip          text,
  navegador   text,
  texto       text        NOT NULL,
  huella      text        NOT NULL,
  pdf_path    text,
  firmado_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_firmas_lead ON firmas (lead_id, firmado_at DESC);

ALTER TABLE firmas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE firmas FROM anon, authenticated;

-- Dónde vive el PDF firmado que se genera de nuestro lado.
INSERT INTO storage.buckets (id, name, public)
VALUES ('contratos', 'contratos', false)
ON CONFLICT (id) DO NOTHING;
