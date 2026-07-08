-- Migration 007: Questionnaires table
-- Creates the questionnaires entity for token-gated client intake forms

CREATE TABLE IF NOT EXISTS questionnaires (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id      uuid        NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  token        uuid        NOT NULL DEFAULT gen_random_uuid(),
  answers      jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT uq_questionnaire_token UNIQUE (token)
);

CREATE INDEX IF NOT EXISTS idx_questionnaires_lead_id ON questionnaires (lead_id);
CREATE INDEX IF NOT EXISTS idx_questionnaires_token ON questionnaires (token);
