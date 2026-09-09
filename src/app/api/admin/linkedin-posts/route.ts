import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import { normalizeLinkedInMarkdown } from '@/lib/linkedin-posts/markdown';
import { createLinkedInPostSchema } from '@/lib/linkedin-posts/schemas';
import { defaultLinkedInSchedule } from '@/lib/linkedin-posts/scheduling';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await getSupabaseAdmin()
    .from('linkedin_posts')
    .select('slug, post_slug, slot, title, body, carousel_pdf_url, source_frontmatter, source_filename, pdf_storage_path, pdf_original_name, pdf_size_bytes, pdf_mime_type, pdf_pending_path, pdf_pending_at, status, scheduled_at, pre_approved_at, published_at, published_url, deleted_at, created_at, updated_at')
    .is('deleted_at', null)
    .order('scheduled_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = (data ?? []).map(({ body, ...row }) => ({
    ...row,
    has_content: Boolean(body?.trim()),
    content_chars: body?.trim().length ?? 0,
    has_pdf: Boolean(row.pdf_storage_path || row.carousel_pdf_url),
  }));
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = createLinkedInPostSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Body inválido' }, { status: 400 });
  }

  const db = getSupabaseAdmin();
  const { data: blog, error: blogError } = await db
    .from('post_publications')
    .select('post_slug, scheduled_at')
    .eq('post_slug', parsed.data.post_slug)
    .is('deleted_at', null)
    .maybeSingle();
  if (blogError) return NextResponse.json({ error: blogError.message }, { status: 500 });
  if (!blog) return NextResponse.json({ error: 'El post vinculado no existe en Agenda' }, { status: 400 });

  const normalized = normalizeLinkedInMarkdown(parsed.data.source_markdown, parsed.data.source_filename);
  if (!normalized.title || !normalized.body) {
    return NextResponse.json({ error: 'El Markdown necesita título y contenido legible' }, { status: 400 });
  }

  const { data, error } = await db.from('linkedin_posts').insert({
    slug: parsed.data.slug,
    post_slug: parsed.data.post_slug,
    slot: parsed.data.slot,
    title: normalized.title,
    body: normalized.body,
    source_markdown: normalized.sourceMarkdown,
    source_frontmatter: normalized.frontmatter,
    source_filename: parsed.data.source_filename,
    scheduled_at: defaultLinkedInSchedule(blog.scheduled_at, parsed.data.slot),
  }).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 409 });
  return NextResponse.json({ item: data }, { status: 201 });
}
