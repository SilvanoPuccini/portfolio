import { NextRequest, NextResponse } from 'next/server';
import { createDistribution } from '@/lib/distribution/orchestrator';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutos — necesario para IA + render con Puppeteer

import { isAuthorized } from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let slug: string;
  try {
    const body = await req.json() as { slug?: string };
    if (!body.slug) return NextResponse.json({ error: 'slug requerido' }, { status: 400 });
    slug = body.slug;
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  try {
    const id = await createDistribution(slug);
    return NextResponse.json({ id });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
