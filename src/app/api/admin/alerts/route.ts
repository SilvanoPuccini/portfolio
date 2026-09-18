import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isAuthorized } from '@/lib/admin-auth';
import { buildAlerts, startOfTodayISO, type Alert } from '@/lib/admin/alerts';

export const dynamic = 'force-dynamic';

/**
 * Lo que el tablero tiene que reclamarte hoy.
 *
 * Siete consultas en paralelo y una función pura que las convierte en avisos.
 * No hay cron detrás: se calcula al abrir el panel. Un cron además no entraba
 * — el plan Hobby de Vercel topea en dos y el proyecto ya los usa para
 * publicar el post y los hilos.
 *
 * Si una consulta falla, el aviso que dependía de ella se omite y el resto
 * sigue: media lista es infinitamente mejor que un tablero en blanco.
 */

/** Leads que ya no están en juego: no reclaman seguimiento. */
const CLOSED_STATES = ['cerrado', 'descartado'];

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getSupabaseAdmin();
  const now = new Date();
  const today = startOfTodayISO(now);
  const nowIso = now.toISOString();

  const [
    unread, subsToday, newLeads, proposals, threads, late, pendingMail,
  ] = await Promise.all([
    db.from('messages').select('id', { count: 'exact', head: true }).eq('read', false),

    db.from('subscribers').select('id', { count: 'exact', head: true }).gte('created_at', today),

    db.from('leads').select('id, created_at').eq('estado', 'nuevo'),

    db.from('leads').select('id, proposal_sent_at')
      .not('proposal_sent_at', 'is', null).not('estado', 'in', `(${CLOSED_STATES.join(',')})`),

    db.from('x_threads').select('id', { count: 'exact', head: true })
      .eq('status', 'error').is('deleted_at', null),

    db.from('post_publications').select('post_slug', { count: 'exact', head: true })
      .lt('scheduled_at', nowIso).neq('status', 'publicado').is('deleted_at', null),

    // El correo del post sale solo al publicar desde el calendario, así que un
    // fallo acá no lo ve nadie: el post está arriba y la lista nunca se enteró.
    db.from('post_publications').select('post_slug, notify_error')
      .eq('status', 'publicado').eq('notify_subscribers', true)
      .is('notified_at', null).is('deleted_at', null),
  ]);

  const alerts: Alert[] = buildAlerts({
    now,
    unreadMessages: unread.count ?? 0,
    newSubscribersToday: subsToday.count ?? 0,
    newLeads: (newLeads.data ?? []) as { id: string; created_at: string }[],
    sentProposals: (proposals.data ?? []) as { id: string; proposal_sent_at: string }[],
    failedThreads: threads.count ?? 0,
    latePieces: late.count ?? 0,
    unsentNewsletters: (pendingMail.data ?? []) as { post_slug: string; notify_error: string | null }[],
  });

  // Que el panel pueda decir "no pude leer todo" en vez de fingir calma.
  const failed = [
    ['mensajes', unread.error], ['suscriptores', subsToday.error],
    ['leads', newLeads.error], ['propuestas', proposals.error],
    ['hilos', threads.error], ['agenda', late.error], ['newsletter', pendingMail.error],
  ].filter(([, error]) => error).map(([name]) => name as string);

  return NextResponse.json({ alerts, ...(failed.length > 0 ? { incomplete: failed } : {}) });
}
