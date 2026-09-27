import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

import type { Locale } from '@/content/servicios';
import { resolveCurrentOrder } from '@/lib/order-config';
import { buildConfigurationSnapshot } from '@/lib/order-configuration-snapshot';
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
    const locale: Locale = parsed.data.locale === 'en' ? 'en' : 'es';
    const resolved = resolveCurrentOrder(parsed.data);
    if (!resolved.ok && resolved.error === 'quoted') {
      return NextResponse.json(
        { error: 'This package is quoted on a call.', url: `/${locale}/services/agendar?paquete=${parsed.data.paquete}` },
        { status: 400 },
      );
    }
    if (!resolved.ok && resolved.error === 'monthly') return NextResponse.json({ error: 'Monthly activation and billing require confirmation before purchase.' }, { status: 409 });
    if (!resolved.ok && resolved.error === 'unknown_package') return NextResponse.json({ error: 'Unknown package.' }, { status: 400 });
    if (!resolved.ok && resolved.error === 'invalid_extras') return NextResponse.json({ error: 'Unknown or incompatible extra.' }, { status: 400 });
    if (!resolved.ok) {
      return NextResponse.json({ error: 'The selected configuration is outside this package. Review your answers.' }, { status: 400 });
    }
    const { paquete, resumen, extras } = resolved;
    const calificacion = parsed.data.calificacion;
    const configuracion_snapshot = buildConfigurationSnapshot(resolved, locale);

    const fila = {
      paquete: paquete.slug,
      extras,
      total_usd: resumen.totalUsd ?? 0,
      mensual_usd: resumen.recurrenteUsd,
      locale,
      calificacion,
      configuracion_snapshot,
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
