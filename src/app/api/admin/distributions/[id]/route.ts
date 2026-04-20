import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import type { UpdateDistributionRequest } from '@/lib/distribution/types';

export const dynamic = 'force-dynamic';

function isAuthorized(req: NextRequest) {
  return req.headers.get('authorization') === `Bearer ${process.env.NOTIFY_SECRET}`;
}

// ── GET /api/admin/distributions/[id] ────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const db = getSupabaseAdmin();

  const { data, error } = await db
    .from('distributions')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  }

  return NextResponse.json({ distribution: data });
}

// ── PATCH /api/admin/distributions/[id] ──────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const db = getSupabaseAdmin();

  let body: UpdateDistributionRequest;
  try {
    body = await req.json() as UpdateDistributionRequest;
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const allowed = ['linkedin_content', 'instagram_content', 'twitter_content', 'status'];
  const updates: Record<string, unknown> = {};

  for (const key of allowed) {
    if (key in body) updates[key] = (body as Record<string, unknown>)[key];
  }

  // Si aprueba, guardar timestamp
  if (body.status === 'approved') updates.approved_at = new Date().toISOString();
  if (body.status === 'published') updates.published_at = new Date().toISOString();

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nada para actualizar' }, { status: 400 });
  }

  const { error } = await db.from('distributions').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log de edición manual
  await db.from('distribution_logs').insert({
    distribution_id: id,
    step: 'user_edit',
    level: 'info',
    message: `Campos actualizados: ${Object.keys(updates).join(', ')}`,
  });

  return NextResponse.json({ success: true });
}

// ── DELETE /api/admin/distributions/[id] ─────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const db = getSupabaseAdmin();

  const { error } = await db.from('distributions').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
