import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import { linkedinSlugSchema, updateLinkedInPostSchema } from '@/lib/linkedin-posts/schemas';
import { isValidTransition, preApprovalBlockReason } from '@/lib/post-publications/types';
import type { LinkedInPost } from '@/lib/linkedin-posts/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { slug } = await params;
  if (!linkedinSlugSchema.safeParse(slug).success) return NextResponse.json({ error: 'Slug inválido' }, { status: 400 });
  const { data, error } = await getSupabaseAdmin().from('linkedin_posts').select('*')
    .eq('slug', slug).is('deleted_at', null).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  return NextResponse.json({ item: data });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { slug } = await params;
  if (!linkedinSlugSchema.safeParse(slug).success) return NextResponse.json({ error: 'Slug inválido' }, { status: 400 });
  const parsed = updateLinkedInPostSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Body inválido' }, { status: 400 });

  const db = getSupabaseAdmin();
  const { data: current, error: readError } = await db.from('linkedin_posts').select('*')
    .eq('slug', slug).is('deleted_at', null).maybeSingle<LinkedInPost>();
  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 });
  if (!current) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  const body = parsed.data;
  if (body.status && !isValidTransition(current.status, body.status)) {
    return NextResponse.json({ error: `Transición inválida: ${current.status} → ${body.status}` }, { status: 400 });
  }
  const nextStatus = body.status ?? current.status;
  const nextBody = body.body ?? current.body;
  if (nextStatus !== 'planificado') {
    const blocked = preApprovalBlockReason(nextBody);
    if (blocked) return NextResponse.json({ error: blocked, reason: 'missing-content' }, { status: 400 });
    if (!current.pdf_storage_path && !current.carousel_pdf_url) {
      return NextResponse.json({ error: 'Subí el PDF final antes de preaprobar esta pieza.', reason: 'missing-pdf' }, { status: 400 });
    }
  }

  const updates: Record<string, unknown> = { ...body, updated_at: new Date().toISOString() };
  if (body.published_url === '') updates.published_url = null;
  if (body.status === 'planificado') {
    updates.pre_approved_at = null;
    updates.published_at = null;
  } else if (body.status === 'preaprobado') {
    updates.pre_approved_at = current.pre_approved_at ?? new Date().toISOString();
    if (current.status === 'publicado') updates.published_at = null;
  } else if (body.status === 'publicado') {
    updates.published_at = current.published_at ?? new Date().toISOString();
  }

  const { data, error } = await db.from('linkedin_posts').update(updates)
    .eq('slug', slug).is('deleted_at', null).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}
