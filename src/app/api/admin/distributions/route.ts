import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import type { DistributionListItem } from '@/lib/distribution/types';

export const dynamic = 'force-dynamic';

import { isAuthorized } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const perPage = Math.min(50, parseInt(searchParams.get('per_page') ?? '20', 10));
  const offset = (page - 1) * perPage;

  const db = getSupabaseAdmin();
  let query = db
    .from('distributions')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1);

  if (status) query = query.eq('status', status);

  const { data, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items: DistributionListItem[] = (data ?? []).map((row) => ({
    id: row.id,
    post_slug: row.post_slug,
    post_title: row.post_title,
    status: row.status,
    linkedin_slides_count: row.linkedin_content?.slides?.length ?? 0,
    instagram_slides_count: row.instagram_content?.slides?.length ?? 0,
    twitter_tweets_count: row.twitter_content?.tweets?.length ?? 0,
    ai_metadata: row.ai_metadata,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));

  return NextResponse.json({ items, total: count ?? 0, page, per_page: perPage });
}
