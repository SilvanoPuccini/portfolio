import { getSupabaseAdmin } from '@/lib/supabase';
import type { PostPublicationStatus } from './types';

export interface PostVisibility {
  status: PostPublicationStatus;
  scheduledAt: string;
}

/**
 * Slug -> estado de agenda. Un post sin fila en post_publications es legado
 * (creado antes de este sistema) y siempre se considera visible.
 */
export async function getPostVisibilityMap(): Promise<Map<string, PostVisibility>> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('post_publications')
    .select('post_slug, status, scheduled_at');

  if (error || !data) return new Map();

  return new Map(
    data.map((row) => [
      row.post_slug as string,
      { status: row.status as PostPublicationStatus, scheduledAt: row.scheduled_at as string },
    ]),
  );
}

export function isVisible(visibility: PostVisibility | undefined): boolean {
  return !visibility || visibility.status === 'publicado';
}

export interface NextScheduledPost {
  slug: string;
  title: string;
  scheduledAt: string;
}

/**
 * El próximo post ya hardcodeado y deployado (preaprobado) que falta
 * publicar. Solo considera "preaprobado" — un post "planificado" todavía
 * no tiene .mdx real, así que no hay ruta a la que linkearlo.
 */
export async function getNextScheduledPost(): Promise<NextScheduledPost | null> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('post_publications')
    .select('post_slug, raw_title, scheduled_at')
    .eq('status', 'preaprobado')
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
