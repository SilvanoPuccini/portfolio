import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import type { UpdatePostPublicationRequest } from '@/lib/post-publications/types';

export const dynamic = 'force-dynamic';

const ALLOWED_FIELDS = ['raw_title', 'raw_content', 'scheduled_at', 'notify_subscribers', 'status'];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await params;
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('post_publications')
    .select('*')
    .eq('post_slug', slug)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  return NextResponse.json({ item: data });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await params;
  const db = getSupabaseAdmin();

  let body: UpdatePostPublicationRequest;
  try {
    body = (await req.json()) as UpdatePostPublicationRequest;
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in body) updates[key] = (body as Record<string, unknown>)[key];
  }

  if (body.status === 'preaprobado') updates.pre_approved_at = new Date().toISOString();
  if (body.status === 'publicado') updates.published_at = new Date().toISOString();

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nada para actualizar' }, { status: 400 });
  }
  updates.updated_at = new Date().toISOString();

  const { data, error } = await db
    .from('post_publications')
    .update(updates)
    .eq('post_slug', slug)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ item: data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await params;
  const db = getSupabaseAdmin();
  const { error } = await db.from('post_publications').delete().eq('post_slug', slug);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
