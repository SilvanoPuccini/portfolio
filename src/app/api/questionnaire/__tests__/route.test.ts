import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: vi.fn(),
}));

import { getSupabaseAdmin } from '@/lib/supabase';
import { POST } from '@/app/api/questionnaire/route';

const VALID_TOKEN = 'valid-token-uuid';
const MOCK_ANSWERS = {
  q1: 'We need to solve X',
  q2: 'Success looks like Y',
  q3: 'No prior solutions',
  q4: 'Just me',
  q5: '3 months',
  q6: 'Nothing else',
};

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/questionnaire', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

function makeSupabaseMock(opts: {
  selectResult: { data: unknown; error: unknown };
  updateResult?: { error: unknown };
}) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(opts.selectResult),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue(opts.updateResult ?? { error: null }),
      }),
    }),
  };
}

describe('POST /api/questionnaire', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 on valid uncompleted token', async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(
      makeSupabaseMock({
        selectResult: { data: { id: 'q-123', completed_at: null }, error: null },
        updateResult: { error: null },
      }) as never,
    );

    const req = makeRequest({ token: VALID_TOKEN, answers: MOCK_ANSWERS });
    const res = await POST(req);
    const body = await res.json() as { success: boolean };

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('returns 404 when token not found', async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(
      makeSupabaseMock({
        selectResult: { data: null, error: { message: 'no rows' } },
      }) as never,
    );

    const req = makeRequest({ token: 'nonexistent-token', answers: MOCK_ANSWERS });
    const res = await POST(req);

    expect(res.status).toBe(404);
  });

  it('returns 409 when token already completed', async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(
      makeSupabaseMock({
        selectResult: {
          data: { id: 'q-456', completed_at: '2026-07-06T10:00:00Z' },
          error: null,
        },
      }) as never,
    );

    const req = makeRequest({ token: VALID_TOKEN, answers: MOCK_ANSWERS });
    const res = await POST(req);

    expect(res.status).toBe(409);
  });

  it('returns 400 when token is missing', async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue({} as never);

    const req = makeRequest({ answers: MOCK_ANSWERS });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when answers are missing', async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue({} as never);

    const req = makeRequest({ token: VALID_TOKEN });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
