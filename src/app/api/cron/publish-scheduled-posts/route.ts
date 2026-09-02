import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized, isCronAuthorized } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import { sendPostNewsletter } from '@/lib/newsletter/send-post-newsletter';

export const dynamic = 'force-dynamic';

interface PublishOutcome {
  post_slug: string;
  notified: boolean;
  notify_error?: string;
}

/**
 * Corre cada domingo (Vercel Cron) y también admite invocación manual con
 * ADMIN_API_KEY. Publica todo lo que esté "preaprobado" con scheduled_at ya
 * cumplida — nunca lo que sigue en "planificado", que es justo la señal de
 * que ese post no llegó a tiempo a la revisión.
 */
export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req) && !isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getSupabaseAdmin();
  const nowIso = new Date().toISOString();

  const { data: due, error } = await db
    .from('post_publications')
    .select('post_slug, notify_subscribers')
    .eq('status', 'preaprobado')
    .lte('scheduled_at', nowIso);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const outcomes: PublishOutcome[] = [];

  for (const row of due ?? []) {
    const publishedAt = new Date().toISOString();
    const { error: updateError } = await db
      .from('post_publications')
      .update({ status: 'publicado', published_at: publishedAt, updated_at: publishedAt })
      .eq('post_slug', row.post_slug);

    if (updateError) {
      outcomes.push({ post_slug: row.post_slug, notified: false, notify_error: updateError.message });
      continue;
    }

    if (!row.notify_subscribers) {
      outcomes.push({ post_slug: row.post_slug, notified: false });
      continue;
    }

    const result = await sendPostNewsletter(row.post_slug);
    if (!result.ok) {
      outcomes.push({ post_slug: row.post_slug, notified: false, notify_error: result.error });
      continue;
    }

    await db
      .from('post_publications')
      .update({ notified_at: new Date().toISOString() })
      .eq('post_slug', row.post_slug);

    outcomes.push({ post_slug: row.post_slug, notified: true });
  }

  return NextResponse.json({ published: outcomes.length, outcomes });
}
