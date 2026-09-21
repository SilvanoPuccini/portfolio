-- El link único del cliente.
--
-- Hasta ahora el cliente recibía un link para el cuestionario, otro para la
-- propuesta y otro para firmar. Tres correos con tres direcciones distintas, y
-- la pregunta «¿cuál era el link?» en cada paso. Con esto guarda uno solo y
-- siempre lo lleva a lo que le toca ahora.
--
-- Es una columna propia y no se reusa `propuesta_token` porque ese token nace
-- recién cuando se manda la propuesta, y el link tiene que existir desde que
-- el lead entra.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS lead_token uuid DEFAULT gen_random_uuid();

-- Las filas viejas no tenían la columna: se les asigna uno ahora.
UPDATE leads SET lead_token = gen_random_uuid() WHERE lead_token IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_leads_lead_token ON leads (lead_token);
