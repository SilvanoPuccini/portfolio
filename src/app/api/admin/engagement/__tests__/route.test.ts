import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/admin-auth', () => ({
  isAuthorized: vi.fn().mockReturnValue(true),
}));

vi.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: vi.fn(),
}));

vi.mock('@/lib/mdx', () => ({
  getAllBlogPosts: vi.fn().mockReturnValue([
    { slug: 'first-post', title: 'First post', issue: 1, date: '2026-08-01' },
    { slug: 'second-post', title: 'Second post', issue: 2, date: '2026-08-08' },
  ]),
}));

import { isAuthorized } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import { GET } from '@/app/api/admin/engagement/route';

function makeRequest(): NextRequest {
  return new NextRequest('http://localhost/api/admin/engagement');
}

function makeSupabaseMock() {
  return {
    from: vi.fn().mockImplementation((table: string) => ({
      select: vi.fn().mockResolvedValue(table === 'post_reactions'
        ? {
            data: [
              { post_slug: 'first-post', reaction: 'like' },
              { post_slug: 'first-post', reaction: 'dislike' },
              { post_slug: 'second-post', reaction: 'like' },
            ],
            error: null,
          }
        : {
            data: [
              { post_slug: 'first-post', event_type: 'view' },
              { post_slug: 'first-post', event_type: 'view' },
              { post_slug: 'first-post', event_type: 'share' },
              { post_slug: 'second-post', event_type: 'view' },
            ],
            error: null,
          }),
    })),
  };
}

describe('GET /api/admin/engagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isAuthorized).mockReturnValue(true);
  });

  it('rejects unauthorized requests before querying metrics', async () => {
    vi.mocked(isAuthorized).mockReturnValue(false);

    const response = await GET(makeRequest());

    expect(response.status).toBe(401);
    expect(getSupabaseAdmin).not.toHaveBeenCalled();
  });

  it('returns per-post and summary aggregates for authorized requests', async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(makeSupabaseMock() as never);

    const response = await GET(makeRequest());
    const body = await response.json() as {
      data: { posts: Array<Record<string, unknown>>; summary: Record<string, unknown> };
    };

    expect(response.status).toBe(200);
    expect(body.data.posts[0]).toMatchObject({
      slug: 'first-post',
      likes: 1,
      dislikes: 1,
      views: 2,
      shares: 1,
      reactions: 2,
      engagementRate: 150,
    });
    expect(body.data.summary).toMatchObject({
      likes: 2,
      dislikes: 1,
      views: 3,
      shares: 1,
      reactions: 3,
      engagementRate: 133.3,
    });
  });
});
