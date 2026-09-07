import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/admin-auth', () => ({ isAuthorized: vi.fn().mockReturnValue(true) }));
vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin: vi.fn() }));
vi.mock('@/lib/post-publications/publish', () => ({ publishPost: vi.fn() }));

import { isAuthorized } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import { POST } from '@/app/api/admin/posts-agenda/route';
import { DELETE, PATCH } from '@/app/api/admin/posts-agenda/[slug]/route';

function request(method: string, body?: unknown) {
  return new NextRequest('http://localhost/api/admin/posts-agenda/test-post', {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
  });
}

describe('posts agenda API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isAuthorized).mockReturnValue(true);
  });

  it('validates POST before opening a database connection', async () => {
    const response = await POST(request('POST', {
      post_slug: 'Slug inválido',
      raw_title: '',
      scheduled_at: 'mañana',
      unexpected: true,
    }));

    expect(response.status).toBe(400);
    expect(getSupabaseAdmin).not.toHaveBeenCalled();
  });

  it('keeps server-side auth on mutations', async () => {
    vi.mocked(isAuthorized).mockReturnValue(false);

    const response = await POST(request('POST', {}));

    expect(response.status).toBe(401);
    expect(getSupabaseAdmin).not.toHaveBeenCalled();
  });

  it('soft deletes an active publication instead of removing its row', async () => {
    const select = vi.fn().mockResolvedValue({ data: [{ post_slug: 'test-post' }], error: null });
    const is = vi.fn().mockReturnValue({ select });
    const eq = vi.fn().mockReturnValue({ is });
    const update = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ update });
    vi.mocked(getSupabaseAdmin).mockReturnValue({ from } as never);

    const response = await DELETE(request('DELETE'), {
      params: Promise.resolve({ slug: 'test-post' }),
    });

    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      deleted_at: expect.any(String),
      updated_at: expect.any(String),
    }));
    expect(eq).toHaveBeenCalledWith('post_slug', 'test-post');
    expect(is).toHaveBeenCalledWith('deleted_at', null);
  });

  it('validates PATCH before opening a database connection', async () => {
    const response = await PATCH(request('PATCH', { scheduled_at: 'not-a-date', extra: true }), {
      params: Promise.resolve({ slug: 'test-post' }),
    });

    expect(response.status).toBe(400);
    expect(getSupabaseAdmin).not.toHaveBeenCalled();
  });

  it('rejects an invalid DELETE slug before opening a database connection', async () => {
    const response = await DELETE(request('DELETE'), {
      params: Promise.resolve({ slug: 'No válido' }),
    });

    expect(response.status).toBe(400);
    expect(getSupabaseAdmin).not.toHaveBeenCalled();
  });
});
