import { NextRequest, NextResponse } from 'next/server';

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

    const { error } = await db
      .from('leads')
      .update({ pago_estado: 'informado', ultimo_contacto_at: new Date().toISOString() })
      .eq('id', venta.id);

    if (error) {
      console.error('[api/pedido/pago] No se pudo registrar el aviso:', error);
      return NextResponse.json({ error: 'Could not register the payment.' }, { status: 500 });
    }

    // Que falle el aviso no puede borrar lo que el cliente ya informó.
    const admin = process.env.ADMIN_EMAIL;
    if (admin) {
      try {
        const monto = `USD ${Math.round(fila.total_usd).toLocaleString('es-AR')}`;
        await sendCrmEmail(
          admin,
          `${venta.nombre} informó el pago de ${monto}`,
          `<p>${escapeHtml(venta.nombre)} (${escapeHtml(venta.email)}) avisó que transfirió `
          + `${escapeHtml(monto)}.</p><p>Verificá la cuenta y confirmalo en el panel para que `
          + 'salga la factura.</p>',
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
