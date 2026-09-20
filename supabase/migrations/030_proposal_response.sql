-- La respuesta del cliente a la propuesta, con un clic.
--
-- El circuito eran dos correos y dos esperas: mandar la propuesta, esperar
-- que conteste, y recién ahí mandar el contrato a mano. El ida y vuelta se
-- come días, y una propuesta aceptada por teléfono seguía figurando como
-- «sin respuesta» en el panel.
--
-- Ahora el correo de la propuesta lleva un link propio: el cliente acepta y
-- el contrato sale solo. Los dos pasos se conservan —la aceptación se mide y
-- el alcance todavía se puede negociar antes del contrato—, pero para el
-- cliente es un clic.
--
-- El token se renueva en cada envío: si se manda una propuesta corregida, el
-- link viejo deja de servir y nadie acepta una versión que ya no existe.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS propuesta_token         uuid,
  ADD COLUMN IF NOT EXISTS propuesta_respuesta     text,
  ADD COLUMN IF NOT EXISTS propuesta_respondida_at timestamptz,
  ADD COLUMN IF NOT EXISTS propuesta_rechazo_motivo text;

CREATE UNIQUE INDEX IF NOT EXISTS uq_leads_propuesta_token ON leads (propuesta_token)
  WHERE propuesta_token IS NOT NULL;
