import { getSupabaseAdmin } from '@/lib/supabase';
import { buildAlerts, startOfTodayISO, type Alert } from './alerts';

/**
 * Las consultas que alimentan el tablero, en un solo lugar.
 *
 * Vive acá y no dentro de una route porque el secretario resume exactamente
 * la misma lista que ve el panel. Si cada endpoint armara la suya, un día el
 * resumen hablaría de avisos que la pantalla ya no muestra.
 *
 * Si una consulta falla, el aviso que dependía de ella se omite y el resto
 * sigue: media lista es mejor que un tablero en blanco. `incomplete` dice
 * cuáles no se pudieron leer, para que el panel lo pueda admitir.
 */

/** Leads que ya no están en juego: no reclaman seguimiento. */
const CLOSED_STATES = ['cerrado', 'descartado'];

export interface CollectedAlerts {
  alerts: Alert[];
  incomplete: string[];
  now: Date;
}

export async function collectAlerts(now = new Date()): Promise<CollectedAlerts> {
  const db = getSupabaseAdmin();
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

  const alerts = buildAlerts({
    now,
    unreadMessages: unread.count ?? 0,
    newSubscribersToday: subsToday.count ?? 0,
    newLeads: (newLeads.data ?? []) as { id: string; created_at: string }[],
    sentProposals: (proposals.data ?? []) as { id: string; proposal_sent_at: string }[],
    failedThreads: threads.count ?? 0,
    latePieces: late.count ?? 0,
    unsentNewsletters: (pendingMail.data ?? []) as { post_slug: string; notify_error: string | null }[],
  });

  const incomplete = ([
    ['mensajes', unread.error], ['suscriptores', subsToday.error],
    ['leads', newLeads.error], ['propuestas', proposals.error],
    ['hilos', threads.error], ['agenda', late.error], ['newsletter', pendingMail.error],
  ] as const).filter(([, error]) => error).map(([name]) => name);

  return { alerts, incomplete: [...incomplete], now };
}
