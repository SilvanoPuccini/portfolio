import type { AgendaItem } from './types';
import type { PostPublicationListItem } from '@/lib/post-publications/types';
import type { LinkedInPostListItem } from '@/lib/linkedin-posts/types';
import type { XThreadListItem } from '@/lib/x/types';

export function normalizeAgendaItems(
  blogItems: PostPublicationListItem[],
  linkedinItems: LinkedInPostListItem[],
  xThreads: XThreadListItem[] = [],
): AgendaItem[] {
  return [
    ...blogItems.map((item): AgendaItem => ({
      id: `blog:${item.post_slug}`,
      channel: 'blog',
      source_id: item.post_slug,
      title: item.raw_title,
      scheduled_at: item.scheduled_at,
      status: item.status,
      detail_path: `/admin/agenda/${item.post_slug}`,
      has_content: item.has_content,
      content_chars: item.content_chars,
      has_pdf: true,
      is_ready: item.has_content,
      pre_approved_at: item.pre_approved_at,
      published_at: item.published_at,
    })),
    ...linkedinItems.map((item): AgendaItem => ({
      id: `linkedin:${item.slug}`,
      channel: 'linkedin',
      source_id: item.slug,
      title: item.title,
      scheduled_at: item.scheduled_at,
      status: item.status,
      detail_path: `/admin/content/${item.slug}`,
      has_content: item.has_content,
      content_chars: item.content_chars,
      has_pdf: item.has_pdf,
      is_ready: item.has_content && item.has_pdf,
      pre_approved_at: item.pre_approved_at,
      published_at: item.published_at,
    })),
    ...xThreads.map((item): AgendaItem => ({
      id: `x:${item.id}`,
      channel: 'x',
      source_id: item.id,
      // El título del hilo es su primer tweet: es lo que se va a leer en X.
      title: item.preview || item.angle_summary.split('|')[0] || 'Hilo sin escribir',
      scheduled_at: item.scheduled_at,
      // 'error' es operativo y no existe en el circuito editorial: en el
      // calendario se lee como planificado, y el detalle explica qué pasó.
      status: item.status === 'error' ? 'planificado' : item.status,
      detail_path: '/admin/x',
      has_content: item.has_content,
      content_chars: item.preview.length,
      has_pdf: true,
      is_ready: item.status === 'preaprobado' || item.status === 'publicado',
      pre_approved_at: item.pre_approved_at,
      published_at: item.published_at,
    })),
  ].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
}
