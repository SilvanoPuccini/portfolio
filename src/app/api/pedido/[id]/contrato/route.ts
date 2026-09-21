import { NextRequest, NextResponse } from 'next/server';

import { paquetePorSlug, servicioPorSlug, totalPedido } from '@/content/servicios';
import { createContract } from '@/lib/leads/documenso-contract';
import { legalClauseFor } from '@/lib/leads/legal-clause';
import { rateLimit } from '@/lib/rate-limit';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * El contrato de un pedido, listo para firmar en la misma página.
 *
 * Es el paso que faltaba entre elegir el paquete y firmarlo. Antes el botón
 * de contratar mandaba a agendar una llamada, que es exactamente lo contrario
 * de lo que pidió el cliente: si eligió un paquete de precio cerrado, es
 * porque no quiere una llamada.
 *
 * Acá se piden los tres datos mínimos, se crea la venta y se devuelve el link
 * de firma. El país no es un capricho: define la ley que aplica y la moneda
 * en la que se le cobra.
 */

export const dynamic = 'force-dynamic';

const MAX_NOMBRE = 100;
const MAX_EMAIL = 254;

function getIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
}

interface PedidoRow {
  id: string;
  paquete: string;
  extras: string[] | null;
  total_usd: number;
  mensual_usd: number;
  firmado_at: string | null;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!rateLimit(`contrato:${getIp(req)}`, 5, 60_000)) {
      return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => null);

    const nombre = typeof body?.nombre === 'string' ? body.nombre.trim() : '';
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const pais = typeof body?.pais === 'string' ? body.pais.trim() : '';

    if (!nombre || nombre.length > MAX_NOMBRE) {
      return NextResponse.json({ error: 'Necesito tu nombre.' }, { status: 400 });
    }
    if (!email || email.length > MAX_EMAIL || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Revisá el mail.' }, { status: 400 });
    }

    const db = getSupabaseAdmin();

    const { data: pedido } = await db
      .from('pedidos')
      .select('id, paquete, extras, total_usd, mensual_usd, firmado_at')
      .eq('id', id)
      .maybeSingle();

    if (!pedido) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });

    const fila = pedido as PedidoRow;
    if (fila.firmado_at) {
      return NextResponse.json({ error: 'Este pedido ya está firmado.' }, { status: 409 });
    }

    const paquete = paquetePorSlug(fila.paquete);
    if (!paquete) return NextResponse.json({ error: 'Unknown package.' }, { status: 404 });

    const servicio = servicioPorSlug(paquete.servicio);
    const resumen = totalPedido(paquete, fila.extras ?? [], servicio?.extras ?? []);

    // Lo que dice el contrato: el paquete con sus extras, tal como lo eligió.
    const alcance = [
      ...paquete.incluye.es,
      ...resumen.extras.map((extra) => extra.label.es),
    ].join(', ');

    const modulos = [
      { slug: paquete.slug, label: paquete.nombre.es, precioUsd: paquete.precioUsd ?? undefined },
      ...resumen.extras.map((extra) => ({
        slug: extra.id, label: extra.label.es, precioUsd: extra.precioUsd,
      })),
    ];

    const { data: lead, error: leadError } = await db
      .from('leads')
      .insert({
        nombre,
        email,
        pais: pais || null,
        tipo_proyecto: paquete.nombre.es,
        que_construir: paquete.resumen.es,
        estado: 'contrato_enviado',
        monto_presupuestado: fila.total_usd,
        mantenimiento_mensual: fila.mensual_usd || null,
        pago_unico: paquete.pagoUnico,
        service: paquete.servicio,
        modulos_seleccionados: modulos,
        pedido_snapshot: {
          paquete: fila.paquete,
          extras: fila.extras ?? [],
          totalUsd: fila.total_usd,
          mensualUsd: fila.mensual_usd,
          congeladoAt: new Date().toISOString(),
        },
        contract_sent_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (leadError || !lead) {
      console.error('[api/pedido/contrato] No se pudo crear la venta:', leadError);
      return NextResponse.json({ error: 'Could not create the sale.' }, { status: 500 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://silvanopuccini.dev';

    let contrato;
    try {
      contrato = await createContract(
        {
          nombre,
          email,
          total: fila.total_usd,
          alcance,
          objeto: paquete.resumen.es,
          plazo: `${paquete.plazoDias} días hábiles desde la acreditación del pago.`,
          pago: paquete.pagoUnico
            ? `Pago único de USD ${fila.total_usd.toLocaleString('es-AR')} por adelantado.`
            : 'Seña del 50% para comenzar y el saldo contra entrega.',
          domicilio: pais,
          jurisdiccion: legalClauseFor(pais || null),
        },
        `${siteUrl}/gracias`,
        fila.id,
      );
    } catch (reason) {
      console.error('[api/pedido/contrato] Documenso falló:', reason);
      return NextResponse.json({ error: 'Could not prepare the contract.' }, { status: 502 });
    }

    await db.from('leads').update({
      contrato_signing_url: contrato.signingUrl,
      contrato_firma_token: contrato.token,
      contrato_envelope_id: contrato.envelopeId,
    }).eq('id', lead.id);

    await db.from('pedidos').update({ lead_id: lead.id }).eq('id', fila.id);

    return NextResponse.json({ token: contrato.token, signingUrl: contrato.signingUrl });
  } catch (err) {
    console.error('[api/pedido/contrato] POST error:', err);
    return NextResponse.json({ error: 'Could not prepare the contract.' }, { status: 500 });
  }
}
