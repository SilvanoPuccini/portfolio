-- El seguimiento de una propuesta fría dejaba de ser rastreable.
--
-- Para reiniciar el reloj del silencio, el envío pisaba `proposal_sent_at` con
-- la fecha del seguimiento: el reloj arrancaba de nuevo, pero se perdía cuándo
-- salió la propuesta de verdad y ya no se podía medir cuánto tardó en cerrarse
-- una venta. El silencio ahora se mide desde `ultimo_contacto_at`, que es otra
-- cosa que la fecha de la propuesta.
--
-- Además, cada seguimiento enviado queda guardado: sin eso, el segundo
-- borrador no sabe qué decía el primero y repite el mismo correo.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS ultimo_contacto_at timestamptz,
  -- El último borrador escrito por la IA, sin enviar. Evita gastar cuota cada
  -- vez que se abre la ficha.
  ADD COLUMN IF NOT EXISTS followup_draft     jsonb;

CREATE TABLE IF NOT EXISTS lead_followups (
  id       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id  uuid        NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  subject  text        NOT NULL,
  body     text        NOT NULL,
  sent_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_followups_lead ON lead_followups (lead_id, sent_at DESC);

-- Los seguimientos son datos del negocio: solo el panel (service role) entra.
ALTER TABLE lead_followups ENABLE ROW LEVEL SECURITY;
