import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/admin-auth';
import { getAllBlogPosts } from '@/lib/mdx';
import { getSupabaseAdmin } from '@/lib/supabase';
import type { ApiError } from '@/lib/blog-engagement';

export const dynamic = 'force-dynamic';

type ReactionRow = { post_slug: string; reaction: 'like' | 'dislike' };
type EventRow = { post_slug: string; event_type: 'view' | 'share' };

export type EngagementMetric = {
  slug: string;
  title: string;
  issue: number;
  date: string;
  likes: number;
  dislikes: number;
  views: number;
  shares: number;
  reactions: number;
  engagementRate: number;
};

export type EngagementSummary = {
  likes: number;
  dislikes: number;
  views: number;
  shares: number;
  reactions: number;
  engagementRate: number;
};

export type AdminEngagementResponse = {
  data: {
    posts: EngagementMetric[];
    summary: EngagementSummary;
  };
};

function roundRate(interactions: number, views: number): number {
  return Math.round((interactions / Math.max(views, 1)) * 1000) / 10;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(req)) {
    return NextResponse.json<ApiError>(
      { error: { code: 'UNAUTHORIZED', message: 'Unauthorized.' } },
      { status: 401 },
    );
  }

  try {
    const supabase = getSupabaseAdmin();
    const [reactionsResult, eventsResult] = await Promise.all([
      supabase.from('post_reactions').select('post_slug,reaction'),
      supabase.from('post_engagement_events').select('post_slug,event_type'),
    ]);

    if (reactionsResult.error || eventsResult.error) throw new Error('engagement aggregate query failed');

    const reactions = (reactionsResult.data ?? []) as ReactionRow[];
    const events = (eventsResult.data ?? []) as EventRow[];
    const counts = new Map<string, Omit<EngagementSummary, 'engagementRate'>>();

    function countFor(slug: string): Omit<EngagementSummary, 'engagementRate'> {
      const current = counts.get(slug);
      if (current) return current;
      const created = { likes: 0, dislikes: 0, views: 0, shares: 0, reactions: 0 };
      counts.set(slug, created);
      return created;
    }

    for (const row of reactions) {
      const count = countFor(row.post_slug);
      if (row.reaction === 'like') count.likes += 1;
      if (row.reaction === 'dislike') count.dislikes += 1;
      count.reactions += 1;
    }
    for (const row of events) {
      const count = countFor(row.post_slug);
      if (row.event_type === 'view') count.views += 1;
      if (row.event_type === 'share') count.shares += 1;
    }

    const posts = getAllBlogPosts().map<EngagementMetric>((post) => {
      const count = countFor(post.slug);
      return {
        slug: post.slug,
        title: post.title,
        issue: post.issue,
        date: post.date,
        ...count,
        engagementRate: roundRate(count.reactions + count.shares, count.views),
      };
    });

    const totals = posts.reduce<Omit<EngagementSummary, 'engagementRate'>>(
      (result, post) => ({
        likes: result.likes + post.likes,
        dislikes: result.dislikes + post.dislikes,
        views: result.views + post.views,
        shares: result.shares + post.shares,
        reactions: result.reactions + post.reactions,
      }),
      { likes: 0, dislikes: 0, views: 0, shares: 0, reactions: 0 },
    );

    return NextResponse.json<AdminEngagementResponse>({
      data: {
        posts,
        summary: {
          ...totals,
          engagementRate: roundRate(totals.reactions + totals.shares, totals.views),
        },
      },
    });
  } catch {
    return NextResponse.json<ApiError>(
      { error: { code: 'INTERNAL_ERROR', message: 'Unable to load engagement metrics.' } },
      { status: 500 },
    );
  }
}
