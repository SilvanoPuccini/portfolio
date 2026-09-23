import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

import {
  motivoLegible, nombreVisible, revisarComprobante, rutaDelComprobante,
} from '@/lib/leads/comprobante';
import { escapeHtml } from '@/lib/html-escape';
import { rateLimit } from '@/lib/rate-limit';
import { sendCrmEmail } from '@/lib/resend';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * «Ya transferí»: el cliente avisa que pagó.
 *
 * No confirma el cobro, lo informa. La plata se confirma cuando Silvano la ve
 * en la cuenta, y hasta entonces el pedido queda en un estado intermedio que
 * los dos entienden: el cliente sabe que su aviso llegó y Silvano sabe que
 * tiene algo que verificar.
 *
 * Sin esto, el que transfería quedaba sin saber si hacía falta avisar, y la
 * mitad avisaba por otro canal.
 *
 * Puede venir con el comprobante adjunto, y ahí el aviso deja de ser una
 * promesa: antes había que entrar al banco, buscar el movimiento y adivinar
 * cuál de todos era. Adjuntarlo NO es obligatorio — el que ya transfirió y no
 * lo encuentra no puede quedar trabado — pero cuando viene, se archiva y
 * viaja en el aviso.
 */

export const dynamic = 'force-dynamic';

function getIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!rateLimit(`pago:${getIp(req)}`, 5, 60_000)) {
      return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
    }

    const { id } = await params;

    // El comprobante se valida ANTES de tocar nada: rechazar después de haber
    // marcado el pago dejaría el aviso puesto y el archivo afuera.
    const adjunto = await comprobanteDe(req);
    if (adjunto.rechazo && adjunto.rechazo !== 'vacio') {
      return NextResponse.json(
        { error: motivoLegible(adjunto.rechazo) },
        { status: adjunto.rechazo === 'pesado' ? 413 : 415 },
      );
    }

    const db = getSupabaseAdmin();

    const { data: pedido } = await db
      .from('pedidos')
      .select('id, lead_id, firmado_at, total_usd')
      .eq('id', id)
      .maybeSingle();

    const fila = pedido as { id: string; lead_id: string | null; total_usd: number } | null;
    if (!fila?.lead_id) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });

    const { data: lead } = await db
      .from('leads')
      .select('id, nombre, email, estado, contrato_firmado_at, pago_estado')
      .eq('id', fila.lead_id)
      .maybeSingle();

    const venta = lead as {
      id: string; nombre: string; email: string;
      contrato_firmado_at: string | null; pago_estado: string | null;
    } | null;

    if (!venta) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });

    // Sin contrato firmado no hay nada que pagar todavía.
    if (!venta.contrato_firmado_at) {
      return NextResponse.json({ error: 'El contrato todavía no está firmado.' }, { status: 409 });
    }

    // Ya informado o ya cobrado: se responde que sí y no se vuelve a avisar.
    if (venta.pago_estado === 'informado' || venta.pago_estado === 'pagado') {
      return NextResponse.json({ ok: true, estado: venta.pago_estado });
    }

    // El archivo va primero, pero su fallo no frena el aviso: el cliente ya
    // transfirió y perder lo que informó por un problema de nuestro storage
    // sería castigarlo por algo que no hizo.
    const guardado = adjunto.archivo
      ? await archivarComprobante(fila.lead_id, fila.id, adjunto.archivo)
      : null;

    const { error } = await db
      .from('leads')
      .update({ pago_estado: 'informado', ultimo_contacto_at: new Date().toISOString() })
      .eq('id', venta.id);

    if (error) {
      console.error('[api/pedido/pago] No se pudo registrar el aviso:', error);
      return NextResponse.json({ error: 'Could not register the payment.' }, { status: 500 });
    }

    if (guardado) {
      await db.from('pedidos').update({
        comprobante_path: guardado.path,
        comprobante_nombre: guardado.nombre,
        comprobante_at: new Date().toISOString(),
      }).eq('id', fila.id);
    }

    // Que falle el aviso no puede borrar lo que el cliente ya informó.
    const admin = process.env.ADMIN_EMAIL;
    if (admin) {
      try {
        const monto = `USD ${Math.round(fila.total_usd).toLocaleString('es-AR')}`;

        // El asunto dice si hay algo que mirar: no es lo mismo un aviso suelto
        // que un aviso con el comprobante esperando en el panel.
        await sendCrmEmail(
          admin,
          guardado
            ? `${venta.nombre} subió el comprobante de ${monto}`
            : `${venta.nombre} informó el pago de ${monto}`,
          `<p>${escapeHtml(venta.nombre)} (${escapeHtml(venta.email)}) avisó que transfirió `
          + `${escapeHtml(monto)}.</p>`
          + (guardado
            ? `<p>Adjuntó el comprobante «${escapeHtml(guardado.nombre)}». Lo tenés en su ficha.</p>`
            : '<p>No adjuntó comprobante.</p>')
          + '<p>Verificá la cuenta y confirmalo en el panel para que salga la factura.</p>',
        );
      } catch (reason) {
        console.warn('[api/pedido/pago] El aviso no salió:', reason);
      }
    }

    return NextResponse.json({ ok: true, estado: 'informado' });
  } catch (err) {
    console.error('[api/pedido/pago] POST error:', err);
    return NextResponse.json({ error: 'Could not register the payment.' }, { status: 500 });
  }
}

/** El comprobante que vino en el formulario, ya revisado. */
async function comprobanteDe(req: NextRequest) {
  const tipo = req.headers.get('content-type') ?? '';
  if (!tipo.includes('multipart/form-data')) {
    return { archivo: null, rechazo: 'vacio' as const };
  }

  try {
    const form = await req.formData();
    const archivo = form.get('comprobante');
    if (!(archivo instanceof File)) return { archivo: null, rechazo: 'vacio' as const };

    return { archivo, rechazo: revisarComprobante(archivo) };
  } catch {
    // Un formulario que no se puede leer no puede frenar un aviso de pago.
    return { archivo: null, rechazo: 'vacio' as const };
  }
}

/**
 * Guarda el comprobante en el bucket privado.
 *
 * Devuelve `null` si no se pudo: el aviso del cliente vale igual. Un
 * comprobante lleva el CBU y el titular de una persona, así que nunca se
 * sirve por URL pública — el panel lo abre con un link firmado que vence.
 */
async function archivarComprobante(
  leadId: string,
  pedidoId: string,
  archivo: File,
): Promise<{ path: string; nombre: string } | null> {
  try {
    const path = rutaDelComprobante(leadId, pedidoId, archivo.name, randomUUID());

    const { error } = await getSupabaseAdmin().storage.from('comprobantes').upload(
      path,
      new Uint8Array(await archivo.arrayBuffer()),
      { contentType: archivo.type, upsert: false },
    );

    if (error) {
      console.error('[api/pedido/pago] No se pudo archivar el comprobante:', error);
      return null;
    }

    return { path, nombre: nombreVisible(archivo.name) };
  } catch (reason) {
    console.error('[api/pedido/pago] El comprobante no se pudo leer:', reason);
    return null;
  }
}
