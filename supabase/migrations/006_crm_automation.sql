-- Migration 006: CRM Automation — Lead columns
-- Adds service/service_data, new discovery fields, and email timestamp columns to leads

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS service text,
  ADD COLUMN IF NOT EXISTS service_data jsonb,
  ADD COLUMN IF NOT EXISTS diagnostico_dolor text,
  ADD COLUMN IF NOT EXISTS diagnostico_deseo text,
  ADD COLUMN IF NOT EXISTS diagnostico_preocupaciones text,
  ADD COLUMN IF NOT EXISTS proposal_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS contract_sent_at timestamptz;

-- Indexes for common filter/aggregate patterns
CREATE INDEX IF NOT EXISTS idx_leads_service ON leads (service);
CREATE INDEX IF NOT EXISTS idx_leads_estado ON leads (estado);
