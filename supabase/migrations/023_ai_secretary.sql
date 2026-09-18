-- Migration 023: el secretario de IA del tablero.
--
-- Mismo patrón que x_autopilot: un interruptor en la base para que se prenda
-- y se apague desde el panel, sin variables de entorno ni redeploy. Arranca
-- APAGADO: la IA no se activa sola en un deploy.
--
-- El resumen se cachea acá mismo porque es una sola llamada por día. Sin
-- cache, abrir el tablero cinco veces serían cinco llamadas al modelo, y el
-- motivo entero de poner a la IA arriba de las reglas es que cueste poco.
-- Los avisos que resume salen de consultas y no dependen de esta columna:
-- si el secretario se apaga, el tablero sigue avisando lo mismo.

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS ai_secretary          boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS secretary_summary     text,
  ADD COLUMN IF NOT EXISTS secretary_summary_at  timestamptz,
  ADD COLUMN IF NOT EXISTS secretary_provider    text;
