import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAuthorized } from '@/lib/admin-auth';
import { postPublicationSlugSchema } from '@/lib/post-publications/schemas';
import { listThreads } from '@/lib/x/repository';
import { planWeekFor } from '@/lib/x/service';

export const dynamic = 'force-dynamic';
/** Planificar la semana es una llamada a Gemini: puede tardar. */
export const maxDuration = 120;

const planSchema = z.strictObject({ post_slug: postPublicationSlugSchema });

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    return NextResponse.json({ items: await listThreads() });
  } catch (reason) {
    return NextResponse.json({ error: reason instanceof Error ? reason.message : 'Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = planSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Body inválido' }, { status: 400 });
  }

  try {
    const result = await planWeekFor(parsed.data.post_slug);
    return NextResponse.json({ items: result.threads, angles: result.angles, tokens: result.tokens }, { status: 201 });
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : 'No se pudo planificar la semana';
    // La unicidad por (post_slug, angle_id) es lo que impide planificar dos
    // veces el mismo post: el choque es la respuesta correcta, no un error.
    const status = message.includes('duplicate') || message.includes('unique') ? 409 : 400;
    return NextResponse.json({ error: status === 409 ? 'Ese post ya tiene su semana planificada' : message }, { status });
  }
}
