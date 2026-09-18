-- Migration 022: setting de piloto automático para el circuito de X.
--
-- Introduce una tabla singleton `site_settings` para guardar configuraciones
-- del admin sin necesidad de variables de entorno. Arrancar con x_autopilot
-- en false: el panel exige activación explícita. Así no se auto-publica nada
-- por accidente al deployar.

CREATE TABLE IF NOT EXISTS site_settings (
  id             integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  x_autopilot    boolean NOT NULL DEFAULT false,
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Row singleton garantizado. INSERT si no existe todavía.
INSERT INTO site_settings (id, x_autopilot)
VALUES (1, false)
ON CONFLICT (id) DO NOTHING;

-- RLS: solo service_role puede tocar esto (el admin usa la service key).
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role only" ON site_settings
  USING (auth.role() = 'service_role');
