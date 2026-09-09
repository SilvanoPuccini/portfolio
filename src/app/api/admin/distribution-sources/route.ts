import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = getSupabaseAdmin();
  const [portfolio, linkedin] = await Promise.all([
    db.from('post_publications').select('post_slug, raw_title, raw_content').is('deleted_at', null).order('scheduled_at', { ascending: false }),
    db.from('linkedin_posts').select('slug, title, body').is('deleted_at', null).order('scheduled_at', { ascending: false }),
  ]);
  if (portfolio.error || linkedin.error) return NextResponse.json({ error: portfolio.error?.message ?? linkedin.error?.message }, { status: 500 });
  return NextResponse.json({ sources: [
    ...(portfolio.data ?? []).filter((item) => item.raw_content?.trim()).map((item) => ({ channel: 'portfolio', id: item.post_slug, title: item.raw_title })),
    ...(linkedin.data ?? []).filter((item) => item.body?.trim()).map((item) => ({ channel: 'linkedin', id: item.slug, title: item.title })),
  ] });
}
