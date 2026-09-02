import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized, isCronAuthorized } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import { publishPost, type PublishOutcome } from '@/lib/post-publications/publish';

export const dynamic = 'force-dynamic';

/**
 * Corre cada hora (Vercel Cron) y también admite invocación manual con
 * ADMIN_API_KEY. Hace dos cosas:
 *
 * 1. Publica lo que esté "preaprobado" con scheduled_at ya cumplida. Nunca
 *    lo que sigue en "planificado" — eso es justamente la señal de que ese
 *    post no llegó a tiempo a la revisión.
 * 2. Reintenta el newsletter de lo ya publicado que nunca llegó a mandarse
 *    (Resend caído, por ejemplo). Sin esto, un fallo de envío quedaba muerto.
 *
 * Toda la lógica de publicación vive en publishPost: mismo camino que el
 * botón del admin, con compare-and-swap e idempotencia por notified_at.
 */
export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req) && !isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getSupabaseAdmin();
  const nowIso = new Date().toISOString();

  // published_at null = nunca salió. Un post que se publicó y después se
  // ocultó a mano conserva su published_at, así que el cron no lo revive.
  const { data: due, error: dueError } = await db
    .from('post_publications')
    .select('post_slug')
    .eq('status', 'preaprobado')
    .is('published_at', null)
    .lte('scheduled_at', nowIso);

  if (dueError) {
    return NextResponse.json({ error: dueError.message }, { status: 500 });
  }

  const { data: pendingNotify, error: pendingError } = await db
    .from('post_publications')
    .select('post_slug')
    .eq('status', 'publicado')
    .eq('notify_subscribers', true)
    .is('notified_at', null);

  if (pendingError) {
    return NextResponse.json({ error: pendingError.message }, { status: 500 });
  }

  const slugs = [
    ...new Set([
      ...(due ?? []).map((r) => r.post_slug as string),
      ...(pendingNotify ?? []).map((r) => r.post_slug as string),
    ]),
  ];

  const outcomes: PublishOutcome[] = [];
  for (const slug of slugs) {
    outcomes.push(await publishPost(slug));
  }

  const failures = outcomes.filter((o) => !o.ok);
  if (failures.length > 0) {
    console.error('[cron/publish] fallos:', JSON.stringify(failures));
  }

  return NextResponse.json({
    checked: slugs.length,
    published: outcomes.filter((o) => o.ok && !o.alreadyPublished).length,
    notified: outcomes.filter((o) => o.ok && o.notified).length,
    failed: failures.length,
    outcomes,
  });
}
