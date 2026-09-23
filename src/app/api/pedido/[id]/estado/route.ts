import { NextRequest, NextResponse } from 'next/server';

import { cargarPedidoCompleto } from '@/lib/leads/cargar-pedido';
import { pasoDeEtapa } from '@/lib/leads/pedido-pasos';
import { rateLimit } from '@/lib/rate-limit';

/**
 * En qué paso está este pedido, ahora mismo.
 *
 * Existe para una sola cosa: que la pantalla del cliente avance sola cuando
 * el pago se confirma del otro lado. Antes se quedaba mirando «recibí tu
 * aviso» para siempre — Silvano aprobaba el pago desde el panel y el cliente
 * no se enteraba hasta que recargaba a mano, si se le ocurría.
 *
 * Devuelve el paso y nada más. No lleva el nombre, ni el monto, ni el
 * contrato: es un dato que se pide cada pocos segundos y no tiene por qué
 * pasear los datos del cliente por la red para decir «seguís igual».
 */

export const dynamic = 'force-dynamic';

function getIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Generoso: se consulta cada pocos segundos mientras la pestaña está
  // abierta, y lo que devuelve no expone nada.
  if (!rateLimit(`estado:${getIp(req)}`, 120, 60_000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  const { id } = await params;
  const datos = await cargarPedidoCompleto(id);

  if (!datos) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  return NextResponse.json(
    { paso: pasoDeEtapa(datos.etapa), etapa: datos.etapa },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
