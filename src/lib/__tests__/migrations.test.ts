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
