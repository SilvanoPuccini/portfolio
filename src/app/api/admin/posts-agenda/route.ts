import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import type {
  CreatePostPublicationRequest,
  PostPublicationStatus,
} from '@/lib/post-publications/types';

export const dynamic = 'force-dynamic';

const PER_PAGE = 20;
const VALID_STATUSES: PostPublicationStatus[] = ['planificado', 'preaprobado', 'publicado'];

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const offset = (page - 1) * PER_PAGE;

  const db = getSupabaseAdmin();
  let query = db
    .from('post_publications')
    .select('*', { count: 'exact' })
    .order('scheduled_at', { ascending: true })
    .range(offset, offset + PER_PAGE - 1);

  if (status && VALID_STATUSES.includes(status as PostPublicationStatus)) {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ items: data, total: count ?? 0, page, per_page: PER_PAGE });
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: CreatePostPublicationRequest;
  try {
    body = (await req.json()) as CreatePostPublicationRequest;
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  if (!body.post_slug || !body.raw_title || !body.scheduled_at) {
    return NextResponse.json(
      { error: 'post_slug, raw_title y scheduled_at son obligatorios' },
      { status: 400 },
    );
  }

  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('post_publications')
    .insert({
      post_slug: body.post_slug,
      raw_title: body.raw_title,
      raw_content: body.raw_content ?? null,
      scheduled_at: body.scheduled_at,
      notify_subscribers: body.notify_subscribers ?? true,
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ item: data }, { status: 201 });
}
