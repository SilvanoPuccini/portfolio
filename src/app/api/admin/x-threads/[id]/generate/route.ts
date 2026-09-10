import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/admin-auth';
import { getThread } from '@/lib/x/repository';
import { generateThread } from '@/lib/x/service';

export const dynamic = 'force-dynamic';
/** Hasta tres vueltas de escritura y crítica: puede tardar más de un minuto. */
export const maxDuration = 300;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const thread = await getThread((await params).id);
  if (!thread) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  if (thread.published_at) {
    return NextResponse.json({ error: 'Este hilo ya se publicó' }, { status: 409 });
  }

  try {
    const updated = await generateThread(thread);
    // Un bloqueo no es un fallo del endpoint: el circuito hizo su trabajo y
    // decidió no publicar. Se devuelve 200 con el motivo a la vista.
    return NextResponse.json({ item: updated, blocked: updated.status !== 'preaprobado' });
  } catch (reason) {
    return NextResponse.json({ error: reason instanceof Error ? reason.message : 'No se pudo generar' }, { status: 500 });
  }
}
