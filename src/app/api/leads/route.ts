import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { rateLimit } from '@/lib/rate-limit';
import { sendCrmEmail } from '@/lib/resend';
import { newLeadHtml } from '@/lib/email-templates/new-lead';

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

    // Coerce optional fields to expected types
    const optStr = (v: unknown) => (typeof v === 'string' ? v.slice(0, MAX_TEXT) : null);
    const optBool = (v: unknown) => (typeof v === 'boolean' ? v : null);
    const optNum = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
    const optObj = (v: unknown) => (v !== null && typeof v === 'object' && !Array.isArray(v) ? v : null);

    const { data, error: dbError } = await getSupabaseAdmin()
      .from('leads')
      .insert({
        nombre,
        email,
        telefono: optStr(body.telefono),
        tipo_proyecto: optStr(body.tipo_proyecto),
        que_construir: optStr(body.que_construir),
        secciones: optStr(body.secciones),
        tiene_login: optBool(body.tiene_login),
        tiene_pagos: optBool(body.tiene_pagos),
        tiene_admin: optBool(body.tiene_admin),
        integraciones: optStr(body.integraciones),
        idiomas: optNum(body.idiomas) ?? 1,
        tiene_marca: optBool(body.tiene_marca),
        tiene_contenido: optBool(body.tiene_contenido),
        problema: optStr(body.problema),
        presupuesto_rango: optStr(body.presupuesto_rango),
        plazo: optStr(body.plazo),
        canal_llamada: optStr(body.canal_llamada),
        service: optStr(body.service),
        service_data: optObj(body.service_data),
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

    // Fire-and-forget admin notification — never block the response
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      sendCrmEmail(
        adminEmail,
        `New lead: ${nombre}`,
        newLeadHtml({
          name: nombre,
          email,
          service: optStr(body.service),
          project_type: optStr(body.tipo_proyecto),
          created_at: new Date().toISOString(),
        }),
      ).catch((err) => console.error('[leads] Admin notification failed:', err));
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
