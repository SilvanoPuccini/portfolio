import { NextRequest, NextResponse } from 'next/server';

import {
  paquetePorSlug,
  servicioPorSlug,
  totalPedido,
  type Locale,
} from '@/content/servicios';
import { rateLimit } from '@/lib/rate-limit';
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
    const slug = typeof body?.paquete === 'string' ? body.paquete : '';
    const locale: Locale = body?.locale === 'en' ? 'en' : 'es';

    const paquete = paquetePorSlug(slug);
    if (!paquete) {
      return NextResponse.json({ error: 'Unknown package.' }, { status: 400 });
    }

    // Un paquete sin precio cerrado no se pide: se habla primero.
    if (paquete.precioUsd === null) {
      return NextResponse.json(
        { error: 'This package is quoted on a call.', url: `/${locale}/services/agendar?paquete=${paquete.slug}` },
        { status: 400 },
      );
    }

    const servicio = servicioPorSlug(paquete.servicio);
    const pedidos = Array.isArray(body?.extras) ? body.extras.filter((id: unknown) => typeof id === 'string') : [];
    const resumen = totalPedido(paquete, pedidos, servicio?.extras ?? []);
    const extras = resumen.extras.map((extra) => extra.id);

    const { data, error } = await getSupabaseAdmin()
      .from('pedidos')
      .insert({
        paquete: paquete.slug,
        extras,
        total_usd: resumen.totalUsd ?? 0,
        mensual_usd: resumen.recurrenteUsd,
        locale,
      })
      .select('id')
      .single();

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
