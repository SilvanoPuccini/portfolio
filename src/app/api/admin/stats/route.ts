import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAllBlogPosts } from '@/lib/blog';

export const dynamic = 'force-dynamic';

import { isAuthorized } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();

    const [subscribersRes, messagesRes, unreadRes] = await Promise.all([
      supabase.from('subscribers').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('contact_messages').select('*', { count: 'exact', head: true }),
      supabase.from('contact_messages').select('*', { count: 'exact', head: true }).eq('read', false),
    ]);

    const posts = getAllBlogPosts();

    return NextResponse.json({
      subscribers: subscribersRes.count ?? 0,
      totalMessages: messagesRes.count ?? 0,
      unreadMessages: unreadRes.count ?? 0,
      totalPosts: posts.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[admin/stats] error:', message);
    return NextResponse.json({ error: `Error al obtener stats: ${message}` }, { status: 500 });
  }
}
