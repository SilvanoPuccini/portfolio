import { NextRequest, NextResponse } from 'next/server';

import { boton, emailLayout, nota, parrafo } from '@/lib/email-templates/layout';
import { etapaDelPedido } from '@/lib/leads/etapa-pedido';
import { pasoDeEtapa, rutaDelPaso } from '@/lib/leads/pedido-pasos';
import { RESPUESTA_UNICA, pedidoParaRetomar, type PedidoAbierto } from '@/lib/leads/recuperar-pedido';
import { rateLimit } from '@/lib/rate-limit';
import { sendCrmEmail } from '@/lib/resend';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * «Perdí el link de mi pedido».
 *
 * El link es un uuid: si se pierde y el correo también, el cliente no tiene
 * camino de vuelta. Lo que hacía era empezar de cero, y ahí nacía un segundo
 * lead del mismo cliente con otro pedido a medias — dos ventas donde hay una
 * y ninguna completa.
 *
 * El link va SIEMPRE al correo, nunca en la respuesta. Devolverlo en pantalla
 * convertiría este formulario en una forma de abrir el pedido de cualquiera
 * con solo saber su dirección: su contrato, su precio y su domicilio.
 *
 * Y la respuesta es la misma exista o no el correo. Si cambiara, probando
 * direcciones ajenas se podría averiguar quién te compró.
 */

export const dynamic = 'force-dynamic';

function getIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
}

const mismoSiempre = () => NextResponse.json({ ok: true, mensaje: RESPUESTA_UNICA });

export async function POST(req: NextRequest) {
  try {
    // Ajustado: no es un formulario que se complete muchas veces seguidas, y
    // el límite es lo que evita que alguien barra direcciones.
    if (!rateLimit(`recuperar:${getIp(req)}`, 5, 10 * 60_000)) {
      return NextResponse.json({ error: 'Probá de nuevo en unos minutos.' }, { status: 429 });
    }

    const body = await req.json().catch(() => null);
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Escribí tu correo.' }, { status: 400 });
    }

    const encontrado = await buscarPedido(email);
    if (encontrado) await mandarElLink(email, encontrado.nombre, encontrado.url);

    return mismoSiempre();
  } catch (err) {
    console.error('[api/pedido/recuperar] POST error:', err);
    // Ni siquiera un error nuestro puede cambiar la respuesta: la diferencia
    // sería la señal que alguien estaría buscando.
    return mismoSiempre();
  }
}

/** El pedido de ese correo que conviene retomar, ya convertido en link. */
async function buscarPedido(email: string): Promise<{ nombre: string; url: string } | null> {
  const db = getSupabaseAdmin();

  const { data: leads } = await db
    .from('leads')
    .select('id, nombre, estado, pago_estado, contrato_firmado_at')
    .ilike('email', email);

  const ventas = (leads ?? []) as {
    id: string; nombre: string; estado: string | null;
    pago_estado: string | null; contrato_firmado_at: string | null;
  }[];

  if (ventas.length === 0) return null;

  const { data: filas } = await db
    .from('pedidos')
    .select('id, lead_id, firmado_at, created_at, locale')
    .in('lead_id', ventas.map((v) => v.id));

  const pedidos = (filas ?? []) as {
    id: string; lead_id: string; firmado_at: string | null;
    created_at: string; locale: string | null;
  }[];

  const abiertos: (PedidoAbierto & { locale: string })[] = pedidos.map((p) => {
    const venta = ventas.find((v) => v.id === p.lead_id)!;
    return {
      pedidoId: p.id,
      creadoAt: p.created_at,
      locale: p.locale === 'en' ? 'en' : 'es',
      etapa: etapaDelPedido(
        { lead_id: p.lead_id, firmado_at: p.firmado_at },
        {
          estado: venta.estado,
          contrato_firmado_at: venta.contrato_firmado_at,
          pago_estado: venta.pago_estado,
        },
      ),
    };
  });

  const elegido = pedidoParaRetomar(abiertos);
  if (!elegido) return null;

  const suyo = abiertos.find((p) => p.pedidoId === elegido.pedidoId)!;
  const venta = ventas.find((v) => pedidos.some((p) => p.id === elegido.pedidoId && p.lead_id === v.id))!;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://silvanopuccini.dev';

  return {
    nombre: venta.nombre,
    url: `${siteUrl}${rutaDelPaso(suyo.locale, elegido.pedidoId, pasoDeEtapa(elegido.etapa))}`,
  };
}

async function mandarElLink(email: string, nombre: string, url: string): Promise<void> {
  try {
    await sendCrmEmail(
      email,
      'El link de tu pedido',
      emailLayout({
        preheader: 'Seguí desde donde lo dejaste.',
        eyebrow: 'Silvano Puccini Dev',
        titulo: `Hola, ${nombre.split(' ')[0]}`,
        cuerpo: [
          parrafo('Acá está el link de tu pedido. Te deja exactamente en el paso donde quedaste.'),
          boton('Volver a mi pedido', url),
          nota('Guardá este correo: es el camino a tu pedido, a tu contrato y al material del proyecto.'),
          nota('Si no lo pediste vos, ignoralo: nadie más puede ver tu pedido con esto.'),
        ].join(''),
      }),
    );
  } catch (reason) {
    console.warn('[api/pedido/recuperar] El correo no salió:', reason);
  }
}
