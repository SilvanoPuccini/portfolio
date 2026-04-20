import { NextRequest, NextResponse } from 'next/server';
import { regenerateDistribution } from '@/lib/distribution/orchestrator';
import type { RegenerateRequest } from '@/lib/distribution/types';

export const dynamic = 'force-dynamic';

function isAuthorized(req: NextRequest) {
  return req.headers.get('authorization') === `Bearer ${process.env.NOTIFY_SECRET}`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  let body: RegenerateRequest;
  try {
    body = await req.json() as RegenerateRequest;
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const validScopes = ['all', 'linkedin', 'instagram', 'twitter', 'slide', 'caption', 'hashtags'];
  if (!validScopes.includes(body.scope)) {
    return NextResponse.json({ error: `scope inválido: ${body.scope}` }, { status: 400 });
  }

  try {
    await regenerateDistribution(id, body.scope, {
      platform: body.platform,
      slideIndex: body.slide_index,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
