import { cache } from 'react';
import { getSupabaseAdmin } from '@/lib/supabase';
import type { PostPublicationStatus } from './types';

export interface PostVisibilityState {
  status: PostPublicationStatus;
  scheduledAt: string;
}

export interface VisibilityIndex {
  /** Slug -> estado de agenda. Un slug ausente no tiene fila en post_publications. */
  states: Map<string, PostVisibilityState>;
  /**
   * true cuando la consulta a Supabase falló. En ese caso solo se aplica el
   * piso por fecha: nunca se asume que algo es visible por falta de datos.
   */
  degraded: boolean;
}

/** Un post cuya fecha de publicación todavía no llegó jamás se muestra. */
function dateHasPassed(date: string): boolean {
  const publishAt = new Date(`${date}T00:00:00-03:00`).getTime();
  return Number.isFinite(publishAt) && publishAt <= Date.now();
}

/**
 * Última lectura exitosa, viva mientras viva el proceso. Si Supabase falla
 * se reutiliza en vez de asumir que no hay nada oculto: un post retenido
 * con fecha ya pasada seguiría oculto igual.
 */
let lastGoodStates: Map<string, PostVisibilityState> | null = null;

/**
 * Índice de visibilidad. Cacheado por request (React cache) para que
 * generateMetadata y el render de la página no consulten dos veces.
 */
export const getVisibilityIndex = cache(async (): Promise<VisibilityIndex> => {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('post_publications')
    .select('post_slug, status, scheduled_at');

  if (error || !data) {
    console.error('[visibility] no se pudo leer post_publications:', error?.message);
    // Degradado: se conserva lo último que sí se pudo leer. Si nunca hubo
    // lectura buena queda solo el piso por fecha, que es lo más restrictivo
    // que se puede afirmar sin base de datos.
    return { states: new Map(lastGoodStates ?? []), degraded: true };
  }

  const states = new Map(
    data.map((row) => [
      row.post_slug as string,
      { status: row.status as PostPublicationStatus, scheduledAt: row.scheduled_at as string },
    ]),
  );
  lastGoodStates = states;

  return { states, degraded: false };
});

/**
 * Regla de visibilidad, en orden:
 * 1. Fila en `publicado` -> visible (permite publicar antes de la fecha).
 * 2. Fila en cualquier otro estado -> oculto.
 * 3. Sin fila -> visible solo si su fecha ya pasó. Esto cubre los posts
 *    legados (fecha pasada, sin fila) y evita que un .mdx nuevo pusheado
 *    sin cargar en la agenda se publique solo.
 *
 * Si el índice viene degradado (Supabase caído) solo rige el paso 3, así
 * que un post futuro sigue oculto: falla cerrado, no abierto.
 */
export function isPostVisible(
  post: { slug: string; date: string },
  index: VisibilityIndex,
): boolean {
  const state = index.states.get(post.slug);

  if (state) {
    return state.status === 'publicado';
  }

  return dateHasPassed(post.date);
}

export interface NextScheduledPost {
  slug: string;
  title: string;
  scheduledAt: string;
}

/**
 * El próximo post ya hardcodeado y deployado (preaprobado) que falta
 * publicar. Solo considera "preaprobado" — un post "planificado" todavía
 * no tiene .mdx real, así que no hay ruta a la que linkearlo — y solo
 * fechas futuras, para que uno vencido no quede de "próximo" para siempre.
 */
export async function getNextScheduledPost(): Promise<NextScheduledPost | null> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('post_publications')
    .select('post_slug, raw_title, scheduled_at')
    .eq('status', 'preaprobado')
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return {
    slug: data.post_slug as string,
    title: data.raw_title as string,
    scheduledAt: data.scheduled_at as string,
  };
}
