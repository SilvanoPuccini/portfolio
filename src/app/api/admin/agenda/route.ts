import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import { normalizeAgendaItems } from '@/lib/agenda/normalize';
import type { PostPublicationListItem } from '@/lib/post-publications/types';
import type { LinkedInPostListItem } from '@/lib/linkedin-posts/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = getSupabaseAdmin();
  const [blogResult, linkedinResult] = await Promise.all([
    db.from('post_publications').select('*').is('deleted_at', null).order('scheduled_at'),
    db.from('linkedin_posts').select('slug, post_slug, slot, title, body, carousel_pdf_url, source_frontmatter, source_filename, pdf_storage_path, pdf_original_name, pdf_size_bytes, pdf_mime_type, pdf_pending_path, pdf_pending_at, status, scheduled_at, pre_approved_at, published_at, published_url, deleted_at, created_at, updated_at').is('deleted_at', null).order('scheduled_at'),
  ]);
  if (blogResult.error) return NextResponse.json({ error: blogResult.error.message }, { status: 500 });
  if (linkedinResult.error) return NextResponse.json({ error: linkedinResult.error.message }, { status: 500 });

  const blogs: PostPublicationListItem[] = (blogResult.data ?? []).map(({ raw_content, ...row }) => ({
    ...row,
    has_content: Boolean(raw_content?.trim()),
    content_chars: raw_content?.trim().length ?? 0,
  }));
  const linkedin: LinkedInPostListItem[] = (linkedinResult.data ?? []).map(
    ({ body, ...row }) => ({
      ...row,
      has_content: Boolean(body?.trim()),
      content_chars: body?.trim().length ?? 0,
      has_pdf: Boolean(row.pdf_storage_path || row.carousel_pdf_url),
    }),
  );
  return NextResponse.json({ items: normalizeAgendaItems(blogs, linkedin) });
}
