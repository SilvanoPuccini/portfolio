import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: vi.fn(),
}));

vi.mock('@/lib/admin-auth', () => ({
  isAuthorized: vi.fn().mockReturnValue(true),
}));

import { getSupabaseAdmin } from '@/lib/supabase';
import { GET } from '@/app/api/admin/crm-stats/route';
import type { CrmStats } from '@/app/api/admin/crm-stats/route';

function makeRequest(): NextRequest {
  return new NextRequest('http://localhost/api/admin/crm-stats');
}

const mockLeadsData = [
  { estado: 'nuevo', monto_presupuestado: null, proposal_sent_at: null, created_at: '2026-07-01T10:00:00Z' },
  { estado: 'llamada_agendada', monto_presupuestado: null, proposal_sent_at: null, created_at: '2026-07-02T10:00:00Z' },
  { estado: 'presupuestado', monto_presupuestado: 3200, proposal_sent_at: '2026-07-03T10:00:00Z', created_at: '2026-07-03T10:00:00Z' },
  { estado: 'cerrado', monto_presupuestado: 4800, proposal_sent_at: '2026-07-04T10:00:00Z', created_at: '2026-07-04T10:00:00Z' },
];

function makeSupabaseMock(leads: unknown[], monthlyLeads?: unknown[]) {
  let callCount = 0;
  return {
    from: vi.fn().mockImplementation(() => {
      callCount += 1;
      if (callCount <= 1) {
        // First call: main leads query
        return {
          select: vi.fn().mockResolvedValue({ data: leads, error: null }),
        };
      }
      // Second call: monthly trends query
      return {
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockResolvedValue({ data: monthlyLeads ?? leads, error: null }),
        }),
      };
    }),
  };
}

describe('GET /api/admin/crm-stats', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns all 7 metric fields with correct types', async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(makeSupabaseMock(mockLeadsData) as never);

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);

    const body = await res.json() as CrmStats;
    expect(typeof body.total_leads).toBe('number');
    expect(typeof body.leads_to_call_rate).toBe('number');
    expect(typeof body.call_to_proposal_rate).toBe('number');
    expect(typeof body.proposal_to_close_rate).toBe('number');
    expect(typeof body.pipeline_value).toBe('number');
    expect(typeof body.avg_deal_value).toBe('number');
    expect(Array.isArray(body.monthly_trends)).toBe(true);
  });

  it('returns total_leads matching the data count', async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(makeSupabaseMock(mockLeadsData) as never);

    const res = await GET(makeRequest());
    const body = await res.json() as CrmStats;
    expect(body.total_leads).toBe(4);
  });

  it('returns all zeros and empty trends when no leads', async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(makeSupabaseMock([], []) as never);

    const res = await GET(makeRequest());
    const body = await res.json() as CrmStats;

    expect(body.total_leads).toBe(0);
    expect(body.leads_to_call_rate).toBe(0);
    expect(body.call_to_proposal_rate).toBe(0);
    expect(body.proposal_to_close_rate).toBe(0);
    expect(body.pipeline_value).toBe(0);
    expect(body.avg_deal_value).toBe(0);
    expect(body.monthly_trends).toEqual([]);
  });

  it('returns 401 when unauthenticated', async () => {
    const { isAuthorized } = await import('@/lib/admin-auth');
    vi.mocked(isAuthorized).mockReturnValueOnce(false);

    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });
});
