import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin: vi.fn() }));
vi.mock('@/lib/admin-auth', () => ({ isAuthorized: vi.fn().mockReturnValue(true) }));
vi.mock('@/lib/admin/collect-alerts', () => ({ collectAlerts: vi.fn() }));
vi.mock('@/lib/admin/secretary', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/admin/secretary')>()),
  writeSummary: vi.fn(),
}));

import { getSupabaseAdmin } from '@/lib/supabase';
import { isAuthorized } from '@/lib/admin-auth';
import { collectAlerts } from '@/lib/admin/collect-alerts';
import { writeSummary } from '@/lib/admin/secretary';
import { GET, POST } from '@/app/api/admin/secretary/route';

type Row = {
  ai_secretary: boolean;
  secretary_summary: string | null;
  secretary_summary_at: string | null;
  secretary_provider: string | null;
};

function supabaseWith(row: Row | null, error: { message: string } | null = null) {
  const upsert = vi.fn().mockResolvedValue({ error: null });
  const from = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: row, error }) }),
    }),
    upsert,
  });
  vi.mocked(getSupabaseAdmin).mockReturnValue({ from } as never);
  return upsert;
}

function row(overrides: Partial<Row> = {}): Row {
  return {
    ai_secretary: true,
    secretary_summary: null,
    secretary_summary_at: null,
    secretary_provider: null,
    ...overrides,
  };
}

const getRequest = () => new NextRequest('http://localhost/api/admin/secretary');
const postRequest = (body?: unknown) => new NextRequest('http://localhost/api/admin/secretary', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

describe('/api/admin/secretary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isAuthorized).mockReturnValue(true);
    vi.mocked(collectAlerts).mockResolvedValue({ alerts: [], incomplete: [], now: new Date() });
    vi.mocked(writeSummary).mockResolvedValue({ summary: 'Hoy no hay nada urgente.', provider: 'gemini' });
  });

  it('rejects an unauthenticated read', async () => {
    vi.mocked(isAuthorized).mockReturnValue(false);
    expect((await GET(getRequest())).status).toBe(401);
    expect(getSupabaseAdmin).not.toHaveBeenCalled();
  });

  it('never calls the model while the secretary is off', async () => {
    supabaseWith(row({ ai_secretary: false }));

    const body = await (await GET(getRequest())).json();

    expect(body.enabled).toBe(false);
    expect(writeSummary).not.toHaveBeenCalled();
  });

  it('reuses today\'s summary instead of paying twice', async () => {
    supabaseWith(row({
      secretary_summary: 'Lo de hoy, ya escrito.',
      secretary_summary_at: new Date().toISOString(),
      secretary_provider: 'gemini',
    }));

    const body = await (await GET(getRequest())).json();

    expect(body.summary).toBe('Lo de hoy, ya escrito.');
    expect(writeSummary).not.toHaveBeenCalled();
  });

  it('writes a new summary when yesterday\'s went stale', async () => {
    const upsert = supabaseWith(row({
      secretary_summary: 'Lo de ayer.',
      secretary_summary_at: '2020-01-01T10:00:00.000Z',
    }));

    const body = await (await GET(getRequest())).json();

    expect(writeSummary).toHaveBeenCalledOnce();
    expect(body.summary).toBe('Hoy no hay nada urgente.');
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ secretary_summary: 'Hoy no hay nada urgente.', secretary_provider: 'gemini' }),
      { onConflict: 'id' },
    );
  });

  it('keeps the old summary and flags it when the model fails', async () => {
    supabaseWith(row({
      secretary_summary: 'Lo de ayer.',
      secretary_summary_at: '2020-01-01T10:00:00.000Z',
    }));
    vi.mocked(writeSummary).mockRejectedValue(new Error('Sin cuota'));

    const response = await GET(getRequest());
    const body = await response.json();

    // El tablero no se cae por una cuota: los avisos son reglas y viven
    // aparte. El resumen viejo sirve más que un hueco, mientras se sepa.
    expect(response.status).toBe(200);
    expect(body.stale).toBe(true);
    expect(body.summary).toBe('Lo de ayer.');
    expect(body.detail).toContain('Sin cuota');
  });

  it('toggles the switch when no explicit value is sent', async () => {
    const upsert = supabaseWith(row({ ai_secretary: false }));

    const body = await (await POST(postRequest())).json();

    expect(body.enabled).toBe(true);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ ai_secretary: true }), { onConflict: 'id' },
    );
    expect(writeSummary).not.toHaveBeenCalled();
  });

  it('regenerates on demand even if today\'s summary is fresh', async () => {
    supabaseWith(row({
      secretary_summary: 'Lo de hoy.',
      secretary_summary_at: new Date().toISOString(),
    }));

    const body = await (await POST(postRequest({ refresh: true }))).json();

    expect(writeSummary).toHaveBeenCalledOnce();
    expect(body.summary).toBe('Hoy no hay nada urgente.');
  });

  it('refuses to refresh while the secretary is off', async () => {
    supabaseWith(row({ ai_secretary: false }));

    const response = await POST(postRequest({ refresh: true }));

    expect(response.status).toBe(409);
    expect(writeSummary).not.toHaveBeenCalled();
  });

  it('refuses to write when the migration has not run', async () => {
    supabaseWith(null, { message: 'column "ai_secretary" does not exist' });

    const response = await POST(postRequest({ enabled: true }));

    expect(response.status).toBe(503);
    expect((await response.json()).error).toContain('migración 023');
  });
});
