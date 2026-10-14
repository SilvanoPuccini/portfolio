import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/admin-auth';
import { canReplanThread } from '@/lib/x/generation-state';
import { getThread } from '@/lib/x/repository';
import { replanThread } from '@/lib/x/service';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/** Replan one exhausted row; writing remains a separate, normally validated action. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const thread = await getThread((await params).id);
    if (!thread) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    if (!canReplanThread(thread)) {
      return NextResponse.json({ error: 'Solo se puede replanificar un hilo no publicado con el plan agotado.' }, { status: 409 });
    }
    return NextResponse.json({ item: await replanThread(thread) });
  } catch (reason) {
    return NextResponse.json({ error: reason instanceof Error ? reason.message : 'No se pudo replanificar' }, { status: 500 });
  }
}
