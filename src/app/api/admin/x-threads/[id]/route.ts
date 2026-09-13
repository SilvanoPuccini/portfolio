import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAuthorized } from '@/lib/admin-auth';
import { deleteTweet } from '@/lib/x/client';
import { fingerprint } from '@/lib/x/orchestrate';
import { getThread, threadsScheduledOn, softDelete, updateThread } from '@/lib/x/repository';
import { allowedUrls } from '@/lib/x/repository';
import { validateThread } from '@/lib/x/validate';

export const dynamic = 'force-dynamic';

/**
 * Los tweets ya llevan tweet_number, pero el ORDEN siempre manda acá: al
 * guardar, se renumera por posición. Así un reorden o un alta manual no pueden
 * dejar números repetidos o salteados, y el editor nunca pelea contra la base.
 */
const updateSchema = z.strictObject({
  tweets: z.array(z.object({ text: z.string().max(400) })).min(1).max(8).optional(),
  reply_with_link: z.string().max(400).optional(),
  scheduled_at: z.iso.datetime({ offset: true }).optional(),
  status: z.enum(['planificado', 'preaprobado', 'publicado', 'error']).optional(),
  /** Marca que el hilo se borró en X por fuera del admin. */
  mark_removed: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, 'Nada para actualizar');

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const thread = await getThread((await params).id);
  if (!thread) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  return NextResponse.json({ item: thread });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Body inválido' }, { status: 400 });
  }

  const thread = await getThread((await params).id);
  if (!thread) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  const { mark_removed, ...body } = parsed.data;
  const updates: Record<string, unknown> = { ...body };

  /**
   * Se borró en X desde el celular, sin pasar por acá. El registro se alinea
   * con la realidad: sin esto quedaría diciendo "publicado" con una URL muerta.
   */
  if (mark_removed) {
    updates.status = 'error';
    updates.published_url = null;
    updates.last_error = 'Borrado en X por fuera del admin';
  }

  // Tocar el texto invalida la aprobación: lo que se publica tiene que ser
  // exactamente lo que pasó los controles. El orden se renumera acá, siempre.
  if (body.tweets || body.reply_with_link !== undefined) {
    const numbered = (body.tweets ?? thread.tweets).map((tweet, index) => ({
      text: tweet.text,
      tweet_number: index + 1,
    }));
    updates.tweets = numbered;

    const texts = numbered.map((tweet) => tweet.text);
    const reply = body.reply_with_link ?? thread.reply_with_link ?? '';
    const issues = validateThread(texts, reply, allowedUrls());
    updates.approved_fingerprint = issues.length === 0 ? fingerprint(texts, reply) : null;
    if (issues.length > 0) {
      updates.status = 'planificado';
      updates.last_error = issues.map((issue) => `${issue.target}: ${issue.problem}`).join(' | ').slice(0, 1000);
    } else {
      updates.last_error = null;
    }
  }

  // Colisión de fecha: se avisa, pero se guarda igual. A veces chocar es la
  // intención, y el que decide es la persona, no la base.
  let warning: string | null = null;
  if (body.scheduled_at && body.scheduled_at !== thread.scheduled_at) {
    const collisions = await threadsScheduledOn(body.scheduled_at, thread.id);
    if (collisions.length > 0) {
      const slugs = collisions.map((c) => `"${c.angle_summary.split(' | ')[0]}"`).join(', ');
      warning = `Ya hay ${collisions.length === 1 ? 'otro hilo' : `${collisions.length} hilos`} ese día (${slugs}). Se guardó igual.`;
    }
  }

  try {
    const item = await updateThread(thread.id, updates);
    return NextResponse.json({ item, warning });
  } catch (reason) {
    return NextResponse.json({ error: reason instanceof Error ? reason.message : 'Error' }, { status: 500 });
  }
}

/**
 * Borrar el hilo. Si ya salió en X, lo borra allá también: el admin tiene los
 * ids de cada post, así que puede deshacer lo que publicó.
 *
 * Para un hilo publicado, el alta es definitiva (la UNIQUE existía para
 * impedir republicar; ahora la protección vive en published_at). Para un hilo
 * nunca publicado, es un soft delete: volver a planificar el mismo ángulo ya
 * no choca, porque la restricción se soltó.
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const thread = await getThread((await params).id);
  if (!thread) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  const failures: string[] = [];
  // Del último al primero: borrar la raíz antes que las respuestas dejaría
  // huérfanos los ids que todavía no procesamos.
  for (const id of [...(thread.published_ids ?? [])].reverse()) {
    try {
      await deleteTweet(id);
    } catch (reason) {
      failures.push(`${id}: ${reason instanceof Error ? reason.message : 'error'}`);
    }
  }

  await softDelete(thread.id);
  return NextResponse.json({ deleted: true, removedFromX: (thread.published_ids ?? []).length - failures.length, failures });
}