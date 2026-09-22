-- El material del proyecto, cargado por el cliente.
--
-- Después de pagar, el cliente completa un formulario que se arma según lo
-- que compró: las secciones de su sitio, sus productos, sus horarios. Todo
-- eso vive acá, en una sola columna, porque su forma depende del paquete y
-- una tabla por cada variante sería una tabla nueva por cada paquete nuevo.
--
-- Se guarda a medida que escribe, no al final: el que junta el logo, las
-- fotos y los textos de su negocio no lo hace de una sentada, y perder lo
-- cargado es perder al cliente.
--
-- `kickoff_completado_at` marca cuándo dijo que terminó. Antes de esa fecha
-- lo que hay es un borrador suyo; después, el material con el que se arranca.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS kickoff_datos        jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS kickoff_completado_at timestamptz;

-- Los archivos que sube el cliente: logo, fotos, planillas de productos.
-- Bucket privado: se sirven con links firmados que vencen, nunca públicos.
INSERT INTO storage.buckets (id, name, public)
VALUES ('kickoff', 'kickoff', false)
ON CONFLICT (id) DO NOTHING;
