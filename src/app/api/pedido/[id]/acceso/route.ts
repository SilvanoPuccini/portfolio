import { NextRequest, NextResponse } from 'next/server';

import { emailLayout, nota, panelDestacado, parrafo } from '@/lib/email-templates/layout';
import {
  MAX_INTENTOS,
  codigoNuevo,
  firmarSesion,
  hashDeCodigo,
  vencimientoDelCodigo,
} from '@/lib/leads/acceso-cliente';
import { rateLimit } from '@/lib/rate-limit';
import { sendCrmEmail } from '@/lib/resend';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * La puerta al proyecto del cliente.
 *
 * Sin cuerpo, manda un código al mail de la venta. Con `codigo`, lo verifica
 * y deja la sesión. Son dos pasos del mismo trámite, así que viven juntos:
 * separarlos en dos rutas obligaría a repetir las mismas cuatro consultas.
 *
 * El código va SIEMPRE al mail que está en la venta, nunca a uno que venga en
 * el pedido: si no, cualquiera con el link pediría el código a su propia
 * casilla y la puerta no serviría de nada.
 */

export const dynamic = 'force-dynamic';

const COOKIE = 'pedido_acceso';

function getIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
}

/** «es***@ejemplo.com»: alcanza para saber a qué casilla mirar. */
function pistaDelMail(email: string): string {
  const [usuario, dominio] = email.split('@');
  if (!dominio) return '';
  return `${usuario.slice(0, 2)}${'*'.repeat(Math.max(1, usuario.length - 2))}@${dominio}`;
}

function codigoHtml(nombre: string, codigo: string): string {
  return emailLayout({
    preheader: `Tu código es ${codigo}. Vence en 10 minutos.`,
    eyebrow: 'Acceso a tu proyecto',
    titulo: `Hola, ${nombre}`,
    cuerpo: [
      parrafo('Este es el código para entrar a tu proyecto. Vence en 10 minutos.'),
      panelDestacado({ etiqueta: 'Tu código', valor: codigo }),
      nota('Si no lo pediste vos, alguien tiene el link de tu pedido. '
        + 'Respondé este correo y lo damos de baja.'),
    ].join(''),
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => null);
    const codigo = typeof body?.codigo === 'string' ? body.codigo.trim() : '';

    if (!rateLimit(`acceso:${getIp(req)}:${id}`, codigo ? 10 : 3, 60_000)) {
      return NextResponse.json({ error: 'Probá de nuevo en un minuto.' }, { status: 429 });
    }

    const db = getSupabaseAdmin();

    const { data: pedido } = await db
      .from('pedidos')
      .select('id, lead_id')
      .eq('id', id)
      .maybeSingle();

    const leadId = (pedido as { lead_id: string | null } | null)?.lead_id;
    if (!leadId) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

    const { data } = await db
      .from('leads')
      .select('id, nombre, email')
      .eq('id', leadId)
      .maybeSingle();

    const lead = data as { id: string; nombre: string; email: string } | null;
    if (!lead?.email) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

    /* ── Pedir el código ─────────────────────────────────────────────── */
    if (!codigo) {
      const nuevo = codigoNuevo();

      const { error } = await db.from('accesos_cliente').insert({
        lead_id: lead.id,
        codigo_hash: hashDeCodigo(nuevo, lead.id),
        expira_at: vencimientoDelCodigo(),
      });

      if (error) {
        console.error('[api/pedido/acceso] No se pudo crear el código:', error);
        return NextResponse.json({ error: 'No se pudo enviar el código.' }, { status: 500 });
      }

      try {
        await sendCrmEmail(lead.email, `Tu código de acceso: ${nuevo}`, codigoHtml(lead.nombre, nuevo));
      } catch (reason) {
        console.error('[api/pedido/acceso] El código no salió:', reason);
        return NextResponse.json({ error: 'No se pudo enviar el código.' }, { status: 502 });
      }

      return NextResponse.json({ ok: true, pista: pistaDelMail(lead.email) });
    }

    /* ── Verificarlo ─────────────────────────────────────────────────── */
    const { data: fila } = await db
      .from('accesos_cliente')
      .select('id, codigo_hash, intentos, expira_at, usado_at')
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const acceso = fila as {
      id: string; codigo_hash: string; intentos: number;
      expira_at: string; usado_at: string | null;
    } | null;

    if (!acceso || acceso.usado_at || new Date(acceso.expira_at) < new Date()) {
      return NextResponse.json({ error: 'El código venció. Pedí uno nuevo.' }, { status: 401 });
    }

    // El tope existe para que no se puedan probar los diez mil códigos.
    if (acceso.intentos >= MAX_INTENTOS) {
      return NextResponse.json({ error: 'Demasiados intentos. Pedí un código nuevo.' }, { status: 429 });
    }

    if (acceso.codigo_hash !== hashDeCodigo(codigo, lead.id)) {
      await db.from('accesos_cliente')
        .update({ intentos: acceso.intentos + 1 })
        .eq('id', acceso.id);

      return NextResponse.json({ error: 'Ese código no es.' }, { status: 401 });
    }

    // Se quema apenas se usa: un código que sirve dos veces es medio código.
    await db.from('accesos_cliente')
      .update({ usado_at: new Date().toISOString() })
      .eq('id', acceso.id);

    const secreto = process.env.ADMIN_SESSION_SECRET;
    if (!secreto) {
      console.error('[api/pedido/acceso] Falta ADMIN_SESSION_SECRET');
      return NextResponse.json({ error: 'No se pudo abrir la sesión.' }, { status: 500 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE, firmarSesion(id, secreto), {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: `/`,
      maxAge: 30 * 86_400,
    });
    return res;
  } catch (err) {
    console.error('[api/pedido/acceso] POST error:', err);
    return NextResponse.json({ error: 'No se pudo abrir la sesión.' }, { status: 500 });
  }
}
