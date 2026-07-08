import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: vi.fn(),
}));

// Mock Resend
vi.mock('@/lib/resend', () => ({
  sendCrmEmail: vi.fn().mockResolvedValue(undefined),
}));

// Mock email templates
vi.mock('@/lib/email-templates/new-lead', () => ({
  newLeadHtml: vi.fn().mockReturnValue('<html>mock</html>'),
}));

// Mock rate-limit (always allow)
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn().mockReturnValue(true),
}));

import { getSupabaseAdmin } from '@/lib/supabase';
import { sendCrmEmail } from '@/lib/resend';
import { POST } from '@/app/api/leads/route';

function makeSupabaseMock(insertResult: { data: unknown; error: unknown }) {
  return {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(insertResult),
        }),
      }),
    }),
  };
}

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/leads', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

describe('POST /api/leads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_EMAIL = 'admin@example.com';
  });

  it('saves service and service_data in the insert payload', async () => {
    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: 'lead-123' }, error: null }),
      }),
    });
    const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
    vi.mocked(getSupabaseAdmin).mockReturnValue({ from: mockFrom } as never);

    const req = makeRequest({
      nombre: 'Test User',
      email: 'test@example.com',
      service: 'full-stack-builds',
      service_data: { fs_current_state: 'Nothing' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const insertPayload = mockInsert.mock.calls[0][0] as Record<string, unknown>;
    expect(insertPayload.service).toBe('full-stack-builds');
    expect(insertPayload.service_data).toEqual({ fs_current_state: 'Nothing' });
  });

  it('returns 200 even when Resend throws', async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(
      makeSupabaseMock({ data: { id: 'lead-456' }, error: null }) as never,
    );
    vi.mocked(sendCrmEmail).mockRejectedValueOnce(new Error('Resend unavailable'));

    const req = makeRequest({
      nombre: 'Error Test',
      email: 'error@example.com',
      service: 'automation-ai',
    });

    const res = await POST(req);
    const body = await res.json() as { success: boolean };
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('handles legacy request without service fields and returns 200', async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(
      makeSupabaseMock({ data: { id: 'lead-789' }, error: null }) as never,
    );

    const req = makeRequest({
      nombre: 'Legacy User',
      email: 'legacy@example.com',
      tipo_proyecto: 'Landing page',
    });

    const res = await POST(req);
    const body = await res.json() as { success: boolean };
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('returns 400 when name is missing', async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(
      makeSupabaseMock({ data: null, error: null }) as never,
    );

    const req = makeRequest({ email: 'test@example.com' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
