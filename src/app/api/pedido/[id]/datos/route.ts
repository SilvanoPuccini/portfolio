import { NextRequest, NextResponse } from 'next/server';

import { escapeHtml } from '@/lib/html-escape';
import { rateLimit } from '@/lib/rate-limit';
import { sendCrmEmail } from '@/lib/resend';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * El material del proyecto, guardado a medida que el cliente lo carga.
 *
 * Se guarda parcial y seguido, no al final. El que junta el logo, las fotos y
 * los textos de su negocio no lo hace de una sentada: se distrae, cierra la
 * pestaña, vuelve al otro día. Perder lo que ya cargó es perder al cliente.
 *
 * `listo` es distinto de guardar: es el cliente diciendo «terminé». Recién
 * ahí Silvano recibe el aviso, porque antes lo que hay es un borrador.
 */

export const dynamic = 'force-dynamic';

const MAX_TEXTO = 5_000;
const MAX_FILAS = 300;

function getIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
}

/** Un texto del cliente: recortado y sin sorpresas. */
function texto(valor: unknown): string | null {
  return typeof valor === 'string' ? valor.slice(0, MAX_TEXTO) : null;
}

/**
 * Lo que viene del navegador, limpio.
 *
 * Se aceptan textos, listas de textos (los archivos ya subidos) y filas de
 * los bloques repetidos. Cualquier otra forma se descarta en silencio: es
 * mejor perder un campo raro que guardar algo que después rompe la pantalla
 * del panel.
 */
function limpiar(entrada: unknown): Record<string, unknown> {
  if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)) return {};

  const limpio: Record<string, unknown> = {};

  for (const [clave, valor] of Object.entries(entrada as Record<string, unknown>)) {
    const simple = texto(valor);
    if (simple !== null) {
      limpio[clave] = simple;
      continue;
    }

    if (!Array.isArray(valor)) continue;

    const filas = valor.slice(0, MAX_FILAS).flatMap((fila) => {
      const suelto = texto(fila);
      if (suelto !== null) return [suelto];

      if (!fila || typeof fila !== 'object' || Array.isArray(fila)) return [];

      const campos: Record<string, string> = {};
      for (const [k, v] of Object.entries(fila as Record<string, unknown>)) {
        const t = texto(v);
        if (t !== null) campos[k] = t;
      }
      return Object.keys(campos).length > 0 ? [campos] : [];
    });

    limpio[clave] = filas;
  }

  return limpio;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!rateLimit(`kickoff:${getIp(req)}`, 60, 60_000)) {
      return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => null);
    const db = getSupabaseAdmin();

    const { data: pedido } = await db
      .from('pedidos')
      .select('id, lead_id, paquete, extras')
      .eq('id', id)
      .maybeSingle();

    const leadId = (pedido as { lead_id: string | null } | null)?.lead_id;
    if (!leadId) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

    const { data } = await db
      .from('leads')
      .select('id, nombre, email, kickoff_datos, kickoff_completado_at')
      .eq('id', leadId)
      .maybeSingle();

    const lead = data as {
      id: string; nombre: string; email: string;
      kickoff_datos: Record<string, unknown> | null;
      kickoff_completado_at: string | null;
    } | null;

    if (!lead) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

    // Lo nuevo se suma a lo que ya había: el cliente puede estar completando
    // una sola pantalla y no por eso borra lo anterior.
    const kickoff_datos = { ...(lead.kickoff_datos ?? {}), ...limpiar(body?.datos) };
    const yaEstaba = Boolean(lead.kickoff_completado_at);
    const termina = body?.listo === true && !yaEstaba;

    const { error } = await db
      .from('leads')
      .update({
        kickoff_datos,
        ...(termina ? { kickoff_completado_at: new Date().toISOString() } : {}),
      })
      .eq('id', lead.id);

    if (error) {
      console.error('[api/pedido/datos] No se pudo guardar:', error);
      return NextResponse.json({ error: 'Could not save.' }, { status: 500 });
    }

    // Solo cuando dice que terminó. Un aviso por cada tecla no es un aviso.
    const admin = process.env.ADMIN_EMAIL;
    if (termina && admin) {
      try {
        await sendCrmEmail(
          admin,
          `${lead.nombre} completó los datos de su proyecto`,
          `<p>${escapeHtml(lead.nombre)} (${escapeHtml(lead.email)}) terminó de cargar el material.</p>`
          + '<p>Está todo en su ficha del panel, listo para arrancar.</p>',
        );
      } catch (reason) {
        console.warn('[api/pedido/datos] El aviso no salió:', reason);
      }
    }

    return NextResponse.json({ ok: true, completado: termina || yaEstaba });
  } catch (err) {
    console.error('[api/pedido/datos] POST error:', err);
    return NextResponse.json({ error: 'Could not save.' }, { status: 500 });
  }
}
