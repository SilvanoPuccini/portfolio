import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: vi.fn(),
}));

vi.mock('@/lib/admin-auth', () => ({
  isAuthorized: vi.fn().mockReturnValue(true),
}));

import { getSupabaseAdmin } from '@/lib/supabase';
import { PATCH } from '@/app/api/admin/leads/[id]/route';

function makeSupabaseMock(updateResult: { error: unknown }) {
  return {
    from: vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue(updateResult),
      }),
    }),
  };
}

function makeRequest(body: unknown, id = 'lead-123'): [NextRequest, { params: Promise<{ id: string }> }] {
  const req = new NextRequest(`http://localhost/api/admin/leads/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
  return [req, { params: Promise.resolve({ id }) }];
}

describe('PATCH /api/admin/leads/[id]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('accepts diagnostico_dolor', async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(makeSupabaseMock({ error: null }) as never);
    const [req, ctx] = makeRequest({ diagnostico_dolor: 'Client has pain around X' });
    const res = await PATCH(req, ctx);
    expect(res.status).toBe(200);
  });

  it('accepts diagnostico_deseo', async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(makeSupabaseMock({ error: null }) as never);
    const [req, ctx] = makeRequest({ diagnostico_deseo: 'Client wants Y' });
    const res = await PATCH(req, ctx);
    expect(res.status).toBe(200);
  });

  it('accepts diagnostico_preocupaciones', async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(makeSupabaseMock({ error: null }) as never);
    const [req, ctx] = makeRequest({ diagnostico_preocupaciones: 'Client worried about Z' });
    const res = await PATCH(req, ctx);
    expect(res.status).toBe(200);
  });

  it('accepts all 6 discovery fields together', async () => {
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    vi.mocked(getSupabaseAdmin).mockReturnValue({
      from: vi.fn().mockReturnValue({ update: mockUpdate }),
    } as never);

    const [req, ctx] = makeRequest({
      diagnostico_objetivo: 'obj',
      diagnostico_situacion: 'sit',
      diagnostico_requerimiento: 'req',
      diagnostico_dolor: 'pain',
      diagnostico_deseo: 'desire',
      diagnostico_preocupaciones: 'concerns',
    });

    const res = await PATCH(req, ctx);
    expect(res.status).toBe(200);

    const updatePayload = mockUpdate.mock.calls[0][0] as Record<string, unknown>;
    expect(updatePayload).toHaveProperty('diagnostico_dolor', 'pain');
    expect(updatePayload).toHaveProperty('diagnostico_deseo', 'desire');
    expect(updatePayload).toHaveProperty('diagnostico_preocupaciones', 'concerns');
  });

  it('accepts proposal_sent_at', async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(makeSupabaseMock({ error: null }) as never);
    const [req, ctx] = makeRequest({ proposal_sent_at: '2026-07-07T22:00:00Z' });
    const res = await PATCH(req, ctx);
    expect(res.status).toBe(200);
  });

  it('accepts contract_sent_at', async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(makeSupabaseMock({ error: null }) as never);
    const [req, ctx] = makeRequest({ contract_sent_at: '2026-07-07T22:00:00Z' });
    const res = await PATCH(req, ctx);
    expect(res.status).toBe(200);
  });

  it('original 3 discovery fields still work', async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(makeSupabaseMock({ error: null }) as never);
    const [req, ctx] = makeRequest({
      diagnostico_objetivo: 'obj',
      diagnostico_situacion: 'sit',
      diagnostico_requerimiento: 'req',
    });
    const res = await PATCH(req, ctx);
    expect(res.status).toBe(200);
  });
});
