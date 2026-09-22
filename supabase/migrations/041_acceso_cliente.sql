-- El código que el cliente usa para entrar a su proyecto.
--
-- El link del pedido es un uuid imposible de adivinar, pero un link se
-- comparte: el cliente lo reenvía a su socio, lo pega en un grupo, comparte
-- pantalla en una reunión. Para ver el contrato firmado o cargar el material
-- hace falta además un código de seis dígitos que llega al mail de la venta.
--
-- No es una contraseña a propósito. Una contraseña se roba, se olvida, se
-- reutiliza de otro sitio y hay que mantener recuperación. Un código que
-- vence en diez minutos no deja nada que robar, y el mail ya está verificado:
-- ahí le llegó el contrato que firmó.
--
-- Se guarda el hash, no el código. Si alguien lee esta tabla no puede entrar
-- a ninguna cuenta con lo que ve.

CREATE TABLE IF NOT EXISTS accesos_cliente (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     uuid        NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  codigo_hash text        NOT NULL,
  intentos    smallint    NOT NULL DEFAULT 0,
  expira_at   timestamptz NOT NULL,
  usado_at    timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_accesos_lead ON accesos_cliente (lead_id, created_at DESC);

ALTER TABLE accesos_cliente ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE accesos_cliente FROM anon, authenticated;
