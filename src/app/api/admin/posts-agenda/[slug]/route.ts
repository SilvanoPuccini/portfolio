import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import { publishPost } from '@/lib/post-publications/publish';
import { isValidTransition } from '@/lib/post-publications/types';
import type {
  PostPublication,
  PostPublicationStatus,
  UpdatePostPublicationRequest,
} from '@/lib/post-publications/types';

export const dynamic = 'force-dynamic';

const EDITABLE_FIELDS = ['raw_title', 'raw_content', 'scheduled_at', 'notify_subscribers'] as const;
const VALID_STATUSES: PostPublicationStatus[] = ['planificado', 'preaprobado', 'publicado'];

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

  const { data: current, error: readError } = await db
    .from('post_publications')
    .select('*')
    .eq('post_slug', slug)
    .maybeSingle<PostPublication>();

  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 });
  if (!current) return NextResponse.json({ error: 'No está en la agenda' }, { status: 404 });

  // Publicar no es un update más: pasa por publishPost, igual que el cron
  // (verifica el .mdx, hace compare-and-swap y manda el newsletter una sola vez).
  if (body.status === 'publicado' && current.status !== 'publicado') {
    const outcome = await publishPost(slug);

    if (!outcome.ok) {
      const status = outcome.reason === 'missing-mdx' || outcome.reason === 'invalid-state' ? 400 : 500;
      return NextResponse.json({ error: outcome.detail, reason: outcome.reason }, { status });
    }

    const { data: published } = await db
      .from('post_publications')
      .select('*')
      .eq('post_slug', slug)
      .single();

    return NextResponse.json({ item: published, notified: outcome.notified });
  }

  const updates: Record<string, unknown> = {};
  for (const key of EDITABLE_FIELDS) {
    if (key in body) updates[key] = (body as Record<string, unknown>)[key];
  }

  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: `Estado inválido: ${body.status}` }, { status: 400 });
    }
    if (!isValidTransition(current.status, body.status)) {
      return NextResponse.json(
        { error: `Transición inválida: ${current.status} → ${body.status}` },
        { status: 400 },
      );
    }

    updates.status = body.status;

    // Los timestamps reflejan el estado real: al retroceder se limpian, así
    // nunca queda un published_at de un estado que ya no es el actual.
    if (body.status === 'planificado') {
      updates.pre_approved_at = null;
      updates.published_at = null;
    }
    if (body.status === 'preaprobado') {
      updates.pre_approved_at = current.pre_approved_at ?? new Date().toISOString();
      // published_at y notified_at NO se limpian a propósito: son el registro
      // de que este post ya salió una vez. El cron usa published_at para no
      // volver a publicarlo solo, y notified_at para no remandar el mail a
      // toda la lista. Ocultar algo publicado lo deja oculto hasta que vos
      // lo republiques a mano.
    }
  }

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
