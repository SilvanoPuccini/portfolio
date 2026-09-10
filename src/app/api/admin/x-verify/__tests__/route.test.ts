import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/admin-auth', () => ({
  isAuthorized: vi.fn().mockReturnValue(true),
}));

vi.mock('@/lib/x/client', () => ({
  whoAmI: vi.fn(),
  postTweet: vi.fn(),
  deleteTweet: vi.fn(),
}));

import { deleteTweet, postTweet, whoAmI } from '@/lib/x/client';
import { POST } from '@/app/api/admin/x-verify/route';

function makeRequest(): NextRequest {
  return new NextRequest('http://localhost/api/admin/x-verify', { method: 'POST' });
}

function xError(message: string, status: number, detail = message): Error {
  return Object.assign(new Error(message), { status, detail });
}

describe('POST /api/admin/x-verify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(postTweet).mockResolvedValue('tweet-123');
    vi.mocked(deleteTweet).mockResolvedValue(true);
  });

  it('marks client-not-enrolled as a skipped read without claiming a Free plan', async () => {
    vi.mocked(whoAmI).mockRejectedValue(xError('forbidden', 403, 'client-not-enrolled'));

    const response = await POST(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.steps[0]).toEqual({
      step: 'lectura',
      ok: true,
      skipped: true,
      detail: 'client-not-enrolled',
    });
    expect(JSON.stringify(body)).not.toContain('Plan Free');
  });

  it('keeps an unrelated 403 read failure visible and still verifies writing', async () => {
    vi.mocked(whoAmI).mockRejectedValue(xError('Forbidden by project policy', 403));

    const response = await POST(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.steps[0]).toEqual({
      step: 'lectura',
      ok: false,
      detail: 'Forbidden by project policy',
    });
    expect(postTweet).toHaveBeenCalledOnce();
    expect(deleteTweet).toHaveBeenCalledWith('tweet-123');
  });

  it('returns a bounded sanitized upstream write failure without inferring read-only access', async () => {
    vi.mocked(whoAmI).mockResolvedValue({ data: { id: '1', name: 'Silvano', username: 'silvano' } });
    vi.mocked(postTweet).mockRejectedValue(xError(
      'write failed',
      403,
      `authorization=Bearer-secret\n${'upstream rejected request '.repeat(30)}`,
    ));

    const response = await POST(makeRequest());
    const body = await response.json();
    const writeStep = body.steps.find((step: { step: string }) => step.step === 'escritura');

    expect(response.status).toBe(502);
    expect(writeStep.detail).toContain('authorization=[redacted]');
    expect(writeStep.detail).not.toContain('Bearer-secret');
    expect(writeStep.detail.length).toBeLessThanOrEqual(300);
    expect(body.hint).not.toContain('solo lectura');
  });
});
