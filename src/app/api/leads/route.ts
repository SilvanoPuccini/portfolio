import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const MAX_NAME = 100;
const MAX_EMAIL = 254;
const MAX_TEXT = 2000;

function getIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
}

export async function POST(req: NextRequest) {
  try {
    const ip = getIp(req);

    if (!rateLimit(`leads:${ip}`, 3, 60_000)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429 }
      );
    }

    const body = await req.json();

    // Honeypot: bots fill hidden fields, humans do not
    if (body?.website) {
      return NextResponse.json({ success: true });
    }

    const nombre = typeof body?.nombre === 'string' ? body.nombre.trim() : '';
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!nombre || !email) {
      return NextResponse.json(
        { error: 'Name and email are required.' },
        { status: 400 }
      );
    }

    if (nombre.length > MAX_NAME || email.length > MAX_EMAIL) {
      return NextResponse.json(
        { error: 'A field exceeds the maximum allowed length.' },
        { status: 400 }
      );
    }

    const queConstruir = typeof body?.que_construir === 'string' ? body.que_construir.trim() : '';
    const problema = typeof body?.problema === 'string' ? body.problema.trim() : '';
    if (queConstruir.length > MAX_TEXT || problema.length > MAX_TEXT) {
      return NextResponse.json(
        { error: 'A field exceeds the maximum allowed length.' },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address.' },
        { status: 400 }
      );
    }

    const { data, error: dbError } = await getSupabaseAdmin()
      .from('leads')
      .insert({
        nombre,
        email,
        telefono: body.telefono ?? null,
        tipo_proyecto: body.tipo_proyecto ?? null,
        que_construir: body.que_construir ?? null,
        secciones: body.secciones ?? null,
        tiene_login: body.tiene_login ?? null,
        tiene_pagos: body.tiene_pagos ?? null,
        tiene_admin: body.tiene_admin ?? null,
        integraciones: body.integraciones ?? null,
        idiomas: body.idiomas ?? 1,
        tiene_marca: body.tiene_marca ?? null,
        tiene_contenido: body.tiene_contenido ?? null,
        problema: body.problema ?? null,
        presupuesto_rango: body.presupuesto_rango ?? null,
        plazo: body.plazo ?? null,
        canal_llamada: body.canal_llamada ?? null,
      })
      .select('id')
      .single();

    if (dbError) {
      console.error('[leads] Supabase error:', dbError);
      return NextResponse.json(
        { error: 'Could not save the lead. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (err) {
    console.error('[leads] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Unexpected error.' },
      { status: 500 }
    );
  }
}
