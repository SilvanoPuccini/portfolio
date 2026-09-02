-- Migration 010: Editorial guidelines (singleton reference doc)
-- Holds the "El Radar — agenda editorial" rules (weekly folder structure,
-- editorial flow, criterio de terminado) as data instead of hardcoded
-- knowledge — so the agenda dashboard (or anything else) can read/display
-- it and it survives outside any one conversation.
-- Service-role Route Handlers are the only application access path.

CREATE TABLE IF NOT EXISTS editorial_guidelines (
  id          text        PRIMARY KEY DEFAULT 'default',
  content     text        NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE editorial_guidelines ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE editorial_guidelines FROM anon, authenticated;
