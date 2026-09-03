import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/mdx', () => ({
  getBlogPostBySlug: vi.fn().mockResolvedValue({ slug: 'test-post', title: 'Test post' }),
}));

// Registrar métricas exige que el post esté publicado. Por defecto lo está;
// el caso contrario se prueba aparte.
vi.mock('@/lib/post-publications/visibility', () => ({
  getVisibilityIndex: vi.fn().mockResolvedValue({ states: new Map(), degraded: false }),
  isPostVisible: vi.fn().mockReturnValue(true),
}));

vi.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: vi.fn(),
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn().mockReturnValue(true),
}));

import { getSupabaseAdmin } from '@/lib/supabase';
import { isPostVisible } from '@/lib/post-publications/visibility';
import { GET, POST } from '@/app/api/blog/[slug]/engagement/route';

type QueryOptions = {
  reaction?: 'like' | 'dislike' | null;
  likeCount?: number;
};

function makeSupabaseMock(options: QueryOptions = {}) {
  const upsert = vi.fn().mockResolvedValue({ error: null });
  const deleteResult = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }),
  });

  const from = vi.fn().mockImplementation((table: string) => ({
    select: vi.fn().mockImplementation((_columns: string, config?: { head?: boolean }) => {
      if (config?.head) {
        return {
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count: options.likeCount ?? 4, error: null }),
          }),
        };
      }
      return {
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: options.reaction ? { reaction: options.reaction } : null,
              error: null,
            }),
          }),
        }),
      };
    }),
    upsert,
    delete: deleteResult,
    table,
  }));

  return { from, upsert, deleteResult };
}

function makeRequest(method = 'GET', body?: unknown): NextRequest {
  return new NextRequest('http://localhost/api/blog/test-post/engagement', {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
  });
}

function context(slug = 'test-post') {
  return { params: Promise.resolve({ slug }) };
}

describe('/api/blog/[slug]/engagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Cada test arranca con el post publicado; el grupo de abajo lo baja a
    // propósito y no debe filtrarse al resto.
    vi.mocked(isPostVisible).mockReturnValue(true);
    process.env.ADMIN_SESSION_SECRET = 'test-session-secret-with-enough-entropy';
  });

  it('returns only the public like count and current reaction without authorization', async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(makeSupabaseMock({ reaction: 'like', likeCount: 7 }) as never);

    const response = await GET(makeRequest(), context());
    const body = await response.json() as { data: Record<string, unknown> };

    expect(response.status).toBe(200);
    expect(body.data).toEqual({ likeCount: 7, reaction: 'like' });
    expect(body.data).not.toHaveProperty('dislikes');
    expect(body.data).not.toHaveProperty('views');
    expect(body.data).not.toHaveProperty('shares');
    expect(response.headers.get('set-cookie')).toContain('blog_visitor=');
    expect(response.headers.get('set-cookie')).toContain('HttpOnly');
    expect(response.headers.get('set-cookie')).toContain('SameSite=lax');
  });

  it('rejects an invalid slug before database access', async () => {
    const response = await GET(makeRequest(), context('../invalid'));

    expect(response.status).toBe(400);
    expect(getSupabaseAdmin).not.toHaveBeenCalled();
  });

  it('fails gracefully when the server-side identity secret is unavailable', async () => {
    delete process.env.ADMIN_SESSION_SECRET;

    const response = await GET(makeRequest(), context());
    const body = await response.json() as { error: { code: string } };

    expect(response.status).toBe(503);
    expect(body.error.code).toBe('SERVICE_UNAVAILABLE');
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(getSupabaseAdmin).not.toHaveBeenCalled();
  });

  it('upserts a mutable reaction on the visitor and post key', async () => {
    const mock = makeSupabaseMock({ reaction: 'like', likeCount: 5 });
    vi.mocked(getSupabaseAdmin).mockReturnValue(mock as never);

    const response = await POST(makeRequest('POST', { action: 'reaction', reaction: 'like' }), context());

    expect(response.status).toBe(200);
    expect(mock.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ post_slug: 'test-post', reaction: 'like' }),
      { onConflict: 'post_slug,visitor_hash' },
    );
  });

  it('deletes the visitor reaction when reaction is null', async () => {
    const mock = makeSupabaseMock({ reaction: null, likeCount: 4 });
    vi.mocked(getSupabaseAdmin).mockReturnValue(mock as never);

    const response = await POST(makeRequest('POST', { action: 'reaction', reaction: null }), context());

    expect(response.status).toBe(200);
    expect(mock.deleteResult).toHaveBeenCalledOnce();
    expect(mock.upsert).not.toHaveBeenCalled();
  });

  it('upserts views against the daily visitor event uniqueness key', async () => {
    const mock = makeSupabaseMock();
    vi.mocked(getSupabaseAdmin).mockReturnValue(mock as never);

    const response = await POST(makeRequest('POST', { action: 'view' }), context());

    expect(response.status).toBe(200);
    expect(mock.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ post_slug: 'test-post', event_type: 'view' }),
      {
        onConflict: 'post_slug,visitor_hash,event_type,event_date',
        ignoreDuplicates: true,
      },
    );
  });

  it('rejects malformed actions', async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(makeSupabaseMock() as never);

    const response = await POST(makeRequest('POST', { action: 'reaction', reaction: 'love' }), context());

    expect(response.status).toBe(400);
  });

  describe('on a post that is not published yet', () => {
    beforeEach(() => {
      vi.mocked(isPostVisible).mockReturnValue(false);
    });

    it('records no view, so the admin preview does not inflate the stats', async () => {
      const mock = makeSupabaseMock();
      vi.mocked(getSupabaseAdmin).mockReturnValue(mock as never);

      const response = await POST(makeRequest('POST', { action: 'view' }), context());

      expect(response.status).toBe(404);
      expect(mock.upsert).not.toHaveBeenCalled();
    });

    it('records no reaction either', async () => {
      const mock = makeSupabaseMock();
      vi.mocked(getSupabaseAdmin).mockReturnValue(mock as never);

      const response = await POST(
        makeRequest('POST', { action: 'reaction', reaction: 'like' }),
        context(),
      );

      expect(response.status).toBe(404);
      expect(mock.upsert).not.toHaveBeenCalled();
    });

    it('still answers the read, so the preview renders like the real page', async () => {
      vi.mocked(getSupabaseAdmin).mockReturnValue(makeSupabaseMock({ likeCount: 4 }) as never);

      const response = await GET(makeRequest(), context());

      expect(response.status).toBe(200);
    });
  });
});
