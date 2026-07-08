import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: vi.fn(),
}));

vi.mock('@/lib/admin-auth', () => ({
  isAuthorized: vi.fn().mockReturnValue(true),
}));

vi.mock('@/lib/proposal-template', () => ({
  buildProposal: vi.fn().mockReturnValue({}),
  Packer: {
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('mock-docx-content')),
  },
}));

import { getSupabaseAdmin } from '@/lib/supabase';
import { GET } from '@/app/api/admin/proposal/[id]/route';

function makeRequest(id = 'lead-123'): [NextRequest, { params: Promise<{ id: string }> }] {
  const req = new NextRequest(`http://localhost/api/admin/proposal/${id}`);
  return [req, { params: Promise.resolve({ id }) }];
}

type SupabaseMockConfig = {
  lead?: { data: unknown; error: unknown };
  modules?: { data: unknown; error: unknown };
  config?: { data: unknown; error: unknown };
};

function makeSupabaseMock(cfg: SupabaseMockConfig) {
  return {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'leads') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue(cfg.lead ?? { data: null, error: { message: 'not found' } }),
            }),
          }),
        };
      }
      if (table === 'modulos_presupuesto') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue(cfg.modules ?? { data: [], error: null }),
          }),
        };
      }
      if (table === 'config_presupuesto') {
        return {
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue(cfg.config ?? { data: { tarifa_hora: 35 }, error: null }),
          }),
        };
      }
      return {};
    }),
  };
}

describe('GET /api/admin/proposal/[id]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with DOCX content-type when lead has budget', async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(makeSupabaseMock({
      lead: {
        data: {
          nombre: 'Test Client',
          email: 'test@example.com',
          tipo_proyecto: 'Platform',
          monto_presupuestado: 3200,
          horas_calculadas: 80,
          plazo: '2 months',
        },
        error: null,
      },
      modules: { data: [{ slug: 'base', label: 'Base Web', horas_min: 30, horas_max: 50 }], error: null },
      config: { data: { tarifa_hora: 40 }, error: null },
    }) as never);

    const [req, ctx] = makeRequest();
    const res = await GET(req, ctx);

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
  });

  it('returns 400 when lead has no budget', async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(makeSupabaseMock({
      lead: {
        data: {
          nombre: 'No Budget Lead',
          email: 'nobudget@example.com',
          tipo_proyecto: null,
          monto_presupuestado: null,
          horas_calculadas: null,
          plazo: null,
        },
        error: null,
      },
    }) as never);

    const [req, ctx] = makeRequest();
    const res = await GET(req, ctx);
    const body = await res.json() as { error: string };

    expect(res.status).toBe(400);
    expect(body.error).toContain('Budget must be saved');
  });

  it('returns 401 when unauthenticated', async () => {
    const { isAuthorized } = await import('@/lib/admin-auth');
    vi.mocked(isAuthorized).mockReturnValueOnce(false);

    const [req, ctx] = makeRequest();
    const res = await GET(req, ctx);
    expect(res.status).toBe(401);
  });
});
