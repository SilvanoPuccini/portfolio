import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/admin-auth';
import { whoAmI } from '@/lib/x/client';
import { getThread } from '@/lib/x/repository';
import { publishThreadNow } from '@/lib/x/service';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * Comprobación barata de credenciales, sin publicar nada.
 *
 * Es la única forma de saber si los tokens siguen vivos antes de intentar un
 * hilo: si están vencidos o quedaron de solo lectura, esto lo dice sin dejar
 * medio hilo colgado en X.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const me = await whoAmI();
    return NextResponse.json({ ok: true, account: me.data });
  } catch (reason) {
    return NextResponse.json({ ok: false, error: reason instanceof Error ? reason.message : 'Sin acceso' }, { status: 502 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const thread = await getThread((await params).id);
  if (!thread) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  try {
    const result = await publishThreadNow(thread);
    return NextResponse.json({ item: result.thread, alreadyPublished: result.alreadyPublished });
  } catch (reason) {
    return NextResponse.json({ error: reason instanceof Error ? reason.message : 'No se pudo publicar' }, { status: 502 });
  }
}
