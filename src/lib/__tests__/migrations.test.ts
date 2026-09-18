import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '../../..', 'supabase/migrations');

function readMigration(filename: string): string {
  return readFileSync(path.join(root, filename), 'utf-8');
}

describe('Migration 006: CRM automation columns', () => {
  const sql = readMigration('006_crm_automation.sql');

  it('adds service column to leads', () => {
    expect(sql).toContain('service text');
  });

  it('adds service_data jsonb column to leads', () => {
    expect(sql).toContain('service_data jsonb');
  });

  it('adds diagnostico_dolor column', () => {
    expect(sql).toContain('diagnostico_dolor text');
  });

  it('adds diagnostico_deseo column', () => {
    expect(sql).toContain('diagnostico_deseo text');
  });

  it('adds diagnostico_preocupaciones column', () => {
    expect(sql).toContain('diagnostico_preocupaciones text');
  });

  it('adds proposal_sent_at timestamptz column', () => {
    expect(sql).toContain('proposal_sent_at timestamptz');
  });

  it('adds contract_sent_at timestamptz column', () => {
    expect(sql).toContain('contract_sent_at timestamptz');
  });

  it('creates index on service', () => {
    expect(sql).toContain('idx_leads_service');
  });

  it('creates index on estado', () => {
    expect(sql).toContain('idx_leads_estado');
  });
});

describe('Migration 007: Questionnaires table', () => {
  const sql = readMigration('007_questionnaires.sql');

  it('creates questionnaires table', () => {
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS questionnaires');
  });

  it('has uuid primary key', () => {
    expect(sql).toContain('id');
    expect(sql).toContain('uuid');
    expect(sql).toContain('PRIMARY KEY');
    expect(sql).toContain('gen_random_uuid()');
  });

  it('has lead_id foreign key referencing leads', () => {
    expect(sql).toContain('lead_id');
    expect(sql).toContain('REFERENCES leads(id)');
  });

  it('has token column with unique constraint', () => {
    expect(sql).toContain('token');
    expect(sql).toContain('UNIQUE');
  });

  it('has answers jsonb column', () => {
    expect(sql).toContain('answers');
    expect(sql).toContain('jsonb');
  });

  it('has created_at with NOT NULL default', () => {
    expect(sql).toContain('created_at');
    expect(sql).toContain('NOT NULL');
  });

  it('has completed_at column (nullable)', () => {
    expect(sql).toContain('completed_at');
  });

  it('creates index on lead_id', () => {
    expect(sql).toContain('idx_questionnaires_lead_id');
  });

  it('creates index on token', () => {
    expect(sql).toContain('idx_questionnaires_token');
  });
});

describe('Migration 022: X autopilot setting', () => {
  const sql = readMigration('022_x_autopilot_setting.sql');

  it('creates the site_settings singleton table', () => {
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS site_settings');
    expect(sql).toContain('CHECK (id = 1)');
  });

  it('defaults the autopilot to off so a deploy never auto-publishes', () => {
    expect(sql).toContain('x_autopilot    boolean NOT NULL DEFAULT false');
  });

  it('seeds the singleton row idempotently', () => {
    expect(sql).toContain('INSERT INTO site_settings');
    expect(sql).toContain('ON CONFLICT (id) DO NOTHING');
  });

  it('locks the table behind RLS', () => {
    expect(sql).toContain('ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain("auth.role() = 'service_role'");
  });

  it('keeps updated_at on the row', () => {
    expect(sql).toContain('updated_at');
  });
});

describe('Migration 023: AI secretary', () => {
  const sql = readMigration('023_ai_secretary.sql');

  it('defaults the secretary to off so a deploy never starts calling the model', () => {
    expect(sql).toContain('ai_secretary          boolean NOT NULL DEFAULT false');
  });

  it('caches the summary so opening the panel twice does not pay twice', () => {
    expect(sql).toContain('secretary_summary     text');
    expect(sql).toContain('secretary_summary_at  timestamptz');
  });

  it('records which provider wrote it', () => {
    expect(sql).toContain('secretary_provider    text');
  });

  it('is idempotent', () => {
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS');
  });
});
