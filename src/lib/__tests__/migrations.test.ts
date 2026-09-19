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

describe('Migration 024: cierre del circuito de venta', () => {
  const sql = readMigration('024_lead_pipeline_close.sql');

  it('marca la firma del contrato', () => {
    expect(sql).toContain('contrato_firmado_at  timestamptz');
  });

  it('guarda la seña con su porcentaje y si fue pago único', () => {
    expect(sql).toContain('sena_pct             numeric');
    expect(sql).toContain('sena_monto           numeric');
    expect(sql).toContain('pago_unico           boolean');
    expect(sql).toContain('cobrado_at           timestamptz');
  });

  it('guarda el número de factura emitido afuera', () => {
    expect(sql).toContain('factura_numero       text');
    expect(sql).toContain('factura_at           timestamptz');
  });

  it('cierra en la entrega', () => {
    expect(sql).toContain('entregado_at         timestamptz');
  });

  it('exige saber por qué se perdió una venta', () => {
    expect(sql).toContain('perdido_motivo       text');
    expect(sql).toContain('perdido_at           timestamptz');
  });

  it('indexa el estado, que es por donde filtran los tableros', () => {
    expect(sql).toContain('idx_leads_estado');
  });

  it('no rompe filas existentes: todo es idempotente y nullable', () => {
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS');
    expect(sql).not.toContain('NOT NULL');
  });
});

describe('Migration 025: contratos vencidos y archivo del PDF firmado', () => {
  const sql = readMigration('025_contract_archive.sql');

  it('marca el vencimiento y guarda dónde quedó el PDF', () => {
    expect(sql).toContain('contrato_vencido_at  timestamptz');
    expect(sql).toContain('contrato_pdf_path    text');
  });

  it('crea el bucket de contratos PRIVADO', () => {
    // Contratos con datos personales y montos: nunca un link público.
    expect(sql).toContain("VALUES ('contratos', 'contratos', false)");
  });

  it('es idempotente', () => {
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS');
    expect(sql).toContain('ON CONFLICT (id) DO NOTHING');
  });
});

describe('Migration 026: apertura y rechazo del contrato', () => {
  const sql = readMigration('026_contract_engagement.sql');

  it('guarda cuándo lo abrió, cuándo lo rechazó y por qué', () => {
    expect(sql).toContain('contrato_abierto_at      timestamptz');
    expect(sql).toContain('contrato_rechazado_at    timestamptz');
    expect(sql).toContain('contrato_rechazo_motivo  text');
  });

  it('es idempotente', () => {
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS');
  });
});
