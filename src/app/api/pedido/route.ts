import { RETIRED_EXTRAS, RETIRED_PACKAGES } from '@/content/service-policy';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

import {
  calificaParaComprar,
  extrasParaNuevoPedido,
  paquetePorSlug,
  servicioPorSlug,
  totalPedido,
  type Locale,
} from '@/content/servicios';
import { rateLimit } from '@/lib/rate-limit';
import { diasDeEspera, horasEnCurso } from '@/lib/leads/capacidad';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * El pedido, antes de la firma.
 *
 * El botón de contratar ya no apunta directo a Documenso. Pasa por acá, se
 * registra qué eligió el cliente y con qué precio, y recién entonces se lo
 * manda a firmar con el pedido enganchado al sobre (`externalId`).
 *
 * El total se calcula ACÁ, desde el catálogo. Lo que venga en el cuerpo del
 * pedido es sugerencia del navegador, y el navegador lo maneja el cliente:
 * confiar en ese número sería dejar que cada uno ponga su propio precio.
 */

export const dynamic = 'force-dynamic';

function getIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
}

export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(`pedido:${getIp(req)}`, 5, 60_000)) {
      return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
    }

    const body = await req.json().catch(() => null);
    const parsed = z.object({ paquete: z.string(), extras: z.array(z.string()).max(100).default([]),
      calificacion: z.record(z.string(), z.string()).default({}), locale: z.enum(['es', 'en']).optional() }).safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid order configuration.' }, { status: 400 });
    const slug = parsed.data.paquete;
    const locale: Locale = body?.locale === 'en' ? 'en' : 'es';

    const paquete = paquetePorSlug(slug);
    if (!paquete || RETIRED_PACKAGES.has(paquete.slug)) {
      return NextResponse.json({ error: 'Unknown package.' }, { status: 400 });
    }

    // Un paquete sin precio cerrado no se pide: se habla primero.
    if (paquete.precioUsd === null) {
      return NextResponse.json(
        { error: 'This package is quoted on a call.', url: `/${locale}/services/agendar?paquete=${paquete.slug}` },
        { status: 400 },
      );
    }

    const calificacion = parsed.data.calificacion;
    if (Object.keys(calificacion).some((key) => !paquete.calificacion.some((q) => q.id === key))
      || !calificaParaComprar(paquete, calificacion)) {
      return NextResponse.json({ error: 'The selected configuration is outside this package. Review your answers.' }, { status: 400 });
    }
    // Monthly activation terms are not yet defined; never create a zero-payment purchase.
    if (paquete.recurrente) return NextResponse.json({ error: 'Monthly activation and billing require confirmation before purchase.' }, { status: 409 });
    const servicio = servicioPorSlug(paquete.servicio);
    const pedidos = parsed.data.extras;
    if (pedidos.some((id) => RETIRED_EXTRAS.has(id) || !servicio?.extras.some((extra) => extra.id === id))) {
      return NextResponse.json({ error: 'Unknown or incompatible extra.' }, { status: 400 });
    }
    const resumen = totalPedido(paquete, extrasParaNuevoPedido(pedidos, servicio?.extras ?? []), servicio?.extras ?? []);
    const extras = resumen.extras.map((extra) => extra.id);

    const fila = {
      paquete: paquete.slug,
      extras,
      total_usd: resumen.totalUsd ?? 0,
      mensual_usd: resumen.recurrenteUsd,
      locale,
      calificacion,
    };

    // La espera por la agenda se congela acá: es la que va a leer en el
    // contrato y la que va a firmar, aunque mañana entren más pedidos.
    const espera = diasDeEspera(await horasEnCurso());

    let { data, error } = await getSupabaseAdmin()
      .from('pedidos')
      .insert({ ...fila, espera_dias: espera })
      .select('id')
      .single();

    // Sin la migración 045 la columna no existe: el pedido se registra igual,
    // sin espera, que es exactamente como funcionaba antes.
    if (error && /espera_dias/.test(error.message ?? '')) {
      ({ data, error } = await getSupabaseAdmin().from('pedidos').insert(fila).select('id').single());
    }

    if (error || !data) {
      console.error('[api/pedido] No se pudo registrar el pedido:', error);
      return NextResponse.json({ error: 'Could not register the order.' }, { status: 500 });
    }

    // Al detalle de lo que compró, donde deja sus datos y firma. Mandarlo a
    // agendar una llamada era lo contrario de lo que pidió: si eligió un
    // paquete de precio cerrado, es porque no quiere una llamada.
    const url = `/${locale}/pedido/${data.id}`;

    return NextResponse.json({
      pedidoId: data.id,
      url,
      totalUsd: resumen.totalUsd,
      mensualUsd: resumen.recurrenteUsd,
    });
  } catch (err) {
    console.error('[api/pedido] POST error:', err);
    return NextResponse.json({ error: 'Could not register the order.' }, { status: 500 });
  }
}
