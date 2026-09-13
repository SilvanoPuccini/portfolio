import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAuthorized } from '@/lib/admin-auth';
import { postPublicationSlugSchema } from '@/lib/post-publications/schemas';
import { importThread } from '@/lib/x/service';

export const dynamic = 'force-dynamic';

const importSchema = z.strictObject({
  post_slug: postPublicationSlugSchema,
  angle_id: z.string().min(1).max(100),
  angle_summary: z.string().min(1).max(500),
  scheduled_at: z.iso.datetime({ offset: true }),
  text: z.string().min(1).max(4000),
});

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = importSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Body inválido' }, { status: 400 });
  }

  try {
    const result = await importThread(parsed.data);
    // Los tweets pasados de 280 se importan y se reportan: recortar es edición,
    // y la edición vive en el editor.
    return NextResponse.json({ item: result.thread, oversize: result.oversize }, { status: 201 });
  } catch (reason) {
    return NextResponse.json({ error: reason instanceof Error ? reason.message : 'No se pudo importar' }, { status: 400 });
  }
}