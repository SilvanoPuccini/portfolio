import { NextRequest, NextResponse } from 'next/server';
import { createDistribution } from '@/lib/distribution/orchestrator';
import type { DistributionSourceRef } from '@/lib/distribution/sources';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutos — necesario para IA + render con Puppeteer

import { isAuthorized } from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let source: DistributionSourceRef;
  try {
    const body = await req.json() as { source?: DistributionSourceRef; slug?: string };
    if (body.source && ['portfolio', 'linkedin'].includes(body.source.channel) && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.source.id)) {
      source = body.source;
    } else if (body.slug && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.slug)) {
      source = { channel: 'portfolio', id: body.slug };
    } else {
      return NextResponse.json({ error: 'Fuente inválida' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  try {
    const id = await createDistribution(source);
    return NextResponse.json({ id });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
