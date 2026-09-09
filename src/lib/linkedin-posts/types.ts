import type { PostPublicationStatus } from '@/lib/post-publications/types';

export type LinkedInSlot = 'martes' | 'viernes';

export interface LinkedInPost {
  slug: string;
  post_slug: string | null;
  slot: LinkedInSlot;
  title: string;
  body: string | null;
  carousel_notes: string | null;
  carousel_pdf_url: string | null;
  source_markdown: string | null;
  source_frontmatter: Record<string, unknown>;
  source_filename: string | null;
  pdf_storage_path: string | null;
  pdf_original_name: string | null;
  pdf_size_bytes: number | null;
  pdf_mime_type: string | null;
  pdf_pending_path: string | null;
  pdf_pending_at: string | null;
  status: PostPublicationStatus;
  scheduled_at: string;
  pre_approved_at: string | null;
  published_at: string | null;
  published_url: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LinkedInPostListItem extends Omit<LinkedInPost, 'source_markdown' | 'body' | 'carousel_notes'> {
  has_content: boolean;
  content_chars: number;
  has_pdf: boolean;
}
