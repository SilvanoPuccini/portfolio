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
