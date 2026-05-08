import { NextRequest, NextResponse } from 'next/server';
import { renderCarouselImages } from '@/lib/distribution/renderer/render';
import type { Slide, LinkedInSlide } from '@/lib/distribution/types';

export const dynamic = 'force-dynamic';

import { isAuthorized } from '@/lib/admin-auth';

// POST /api/admin/render/linkedin
// POST /api/admin/render/instagram
// Body: { slides: Slide[] }
// Devuelve los PNGs como base64 — para preview en vivo antes de subir a storage

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { type } = await params;
  if (type !== 'linkedin' && type !== 'instagram') {
    return NextResponse.json({ error: 'type debe ser linkedin o instagram' }, { status: 400 });
  }

  let slides: LinkedInSlide[] | Slide[];
  try {
    const body = await req.json() as { slides?: (LinkedInSlide | Slide)[] };
    if (!body.slides?.length) {
      return NextResponse.json({ error: 'slides requerido' }, { status: 400 });
    }
    slides = body.slides as LinkedInSlide[] | Slide[];
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  try {
    const buffers = await renderCarouselImages(slides, type);
    const images = buffers
      .filter(Boolean)
      .map((buf) => `data:image/png;base64,${buf.toString('base64')}`);
    return NextResponse.json({ images });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error de render';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
