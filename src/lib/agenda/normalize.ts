import type { AgendaItem } from './types';
import type { PostPublicationListItem } from '@/lib/post-publications/types';
import type { LinkedInPostListItem } from '@/lib/linkedin-posts/types';

export function normalizeAgendaItems(
  blogItems: PostPublicationListItem[],
  linkedinItems: LinkedInPostListItem[],
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
  ].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
}
