import type { PostPublicationStatus } from '@/lib/post-publications/types';

export type AgendaChannel = 'blog' | 'linkedin';

export interface AgendaItem {
  id: string;
  channel: AgendaChannel;
  source_id: string;
  title: string;
  scheduled_at: string;
  status: PostPublicationStatus;
  detail_path: string;
  has_content: boolean;
  content_chars: number;
  pre_approved_at: string | null;
  published_at: string | null;
}
