import { getSupabaseAdmin } from '@/lib/supabase';
import { BLOG_URL, LINKEDIN_URL } from './author-profile';
import { MAX_REWRITE_HISTORY } from './types';
import type { XAngle, XRewriteHistoryEntry, XThread, XThreadListItem } from './types';

/**
 * Acceso a `x_threads`. Vive aparte de las rutas para que el cron y el admin
 * usen exactamente el mismo camino, sin dos versiones de la misma consulta.
 */

const COLUMNS = 'id, post_slug, angle_id, angle_summary, thesis, tweets, reply_with_link, evidence, status, scheduled_at, pre_approved_at, published_at, published_ids, published_url, approved_fingerprint, generation_attempts, publish_attempts, last_error, plan, rewrite_history, deleted_at, created_at, updated_at';

/** Las únicas URL que pueden aparecer en la respuesta del hilo. */
export function allowedUrls(): string[] {
  return [BLOG_URL, LINKEDIN_URL];
}

function toListItem(row: XThread): XThreadListItem {
  const tweets = row.tweets ?? [];
  return {
    ...row,
    tweet_count: tweets.length,
    has_content: tweets.length > 0,
    preview: tweets[0]?.text?.slice(0, 120) ?? '',
  };
}

export async function listThreads(): Promise<XThreadListItem[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('x_threads').select(COLUMNS).is('deleted_at', null).order('scheduled_at');
  if (error) throw new Error(error.message);
  return (data as XThread[] ?? []).map(toListItem);
}

export async function getThread(id: string): Promise<XThread | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('x_threads').select(COLUMNS).eq('id', id).is('deleted_at', null).maybeSingle<XThread>();
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Los hilos ya escritos de la misma semana del post. Es lo que recibe el
 * generador para no repetirse: X sanciona el contenido sustancialmente
 * similar, así que esto no es una preferencia de estilo.
 */
export async function siblingsOf(postSlug: string, exceptId?: string): Promise<string[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('x_threads').select('id, tweets').eq('post_slug', postSlug).is('deleted_at', null);
  if (error) throw new Error(error.message);
  return (data ?? [])
    .filter((row) => row.id !== exceptId)
    .flatMap((row) => ((row.tweets ?? []) as { text: string }[]).map((tweet) => tweet.text));
}

/**
 * Otros hilos que vendrían a la misma hora. El panel avisa de la colisión pero
 * deja guardar: a veces publicar dos el mismo día es una decisión, no un error.
 */
export async function threadsScheduledOn(scheduledAt: string, exceptId?: string): Promise<XThread[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('x_threads').select(COLUMNS)
    .eq('scheduled_at', scheduledAt).is('deleted_at', null);
  if (error) throw new Error(error.message);
  return (data ?? []).filter((row) => row.id !== exceptId) as XThread[];
}

/**
 * Sobre la marcha del historial de reescrituras.
 *
 * El historial alimenta la próxima generación (el escritor recibe los fixes
 * acumulados), pero no puede crecer sin límite: cada entrada tiene los fixes de
 * una vuelta y adentro del prompt caben solo los últimos. El cap está acá, a la
 * vista del dato, y no en el servicio.
 */
export function appendRewriteHistory(current: XRewriteHistoryEntry[], entry: XRewriteHistoryEntry): XRewriteHistoryEntry[] {
  return [...current, entry].slice(-MAX_REWRITE_HISTORY);
}

/** Crea un hilo a mano o importado, sin planificar la semana con IA. */
export async function createThread(row: {
  post_slug: string;
  angle_id: string;
  angle_summary: string;
  scheduled_at: string;
  tweets: { text: string; tweet_number: number }[];
}) {
  const { data, error } = await getSupabaseAdmin()
    .from('x_threads').insert({
      ...row,
      plan: [{ id: row.angle_id, summary: row.angle_summary.split(' | ')[0], question: row.angle_summary.split(' | ')[1] ?? '' }],
    }).select(COLUMNS).single();
  if (error) throw new Error(error.message);
  return data as XThread;
}

/** Crea los cuatro turnos de la semana. Choca si el ángulo sigue vivo. */
export async function createWeek(postSlug: string, angles: XAngle[], dates: string[]) {
  const rows = angles.map((angle, index) => ({
    post_slug: postSlug,
    angle_id: angle.id,
    angle_summary: `${angle.summary} | ${angle.question}`,
    scheduled_at: dates[index],
    plan: angles,
  }));
  const { data, error } = await getSupabaseAdmin()
    .from('x_threads').insert(rows).select(COLUMNS);
  if (error) throw new Error(error.message);
  return data as XThread[];
}

export async function updateThread(id: string, updates: Record<string, unknown>) {
  const { data, error } = await getSupabaseAdmin()
    .from('x_threads')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id).is('deleted_at', null).select(COLUMNS).single();
  if (error) throw new Error(error.message);
  return data as XThread;
}

export async function softDelete(id: string) {
  const { error } = await getSupabaseAdmin()
    .from('x_threads').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error(error.message);
}

/**
 * Lo que vence hoy y todavía no salió.
 *
 * `published_at is null` es la condición que evita republicar: un hilo que ya
 * salió conserva su marca aunque después se lo borre en X.
 */
export async function dueNow(now = new Date()): Promise<XThread[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('x_threads').select(COLUMNS)
    .eq('status', 'preaprobado')
    .is('deleted_at', null)
    .is('published_at', null)
    .lte('scheduled_at', now.toISOString());
  if (error) throw new Error(error.message);
  return data as XThread[] ?? [];
}

/**
 * Lo que hay que generar: vence pronto y todavía no tiene texto aprobado.
 *
 * Se genera con días de anticipación a propósito. Si la generación falla o el
 * crítico rechaza dos veces, quedan días para arreglarlo en vez de perder el
 * turno. Generar el mismo día no deja margen para nada.
 */
export async function pendingGeneration(daysAhead: number, now = new Date()): Promise<XThread[]> {
  const horizon = new Date(now.getTime() + daysAhead * 86_400_000).toISOString();
  const { data, error } = await getSupabaseAdmin()
    .from('x_threads').select(COLUMNS)
    .eq('status', 'planificado')
    .is('deleted_at', null)
    .lte('scheduled_at', horizon)
    .order('scheduled_at');
  if (error) throw new Error(error.message);
  return data as XThread[] ?? [];
}
