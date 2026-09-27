import { NextRequest, NextResponse } from 'next/server';

import { paquetePorSlug, servicioPorSlug, totalPedido } from '@/content/servicios';
import { contractToSignHtml } from '@/lib/email-templates/contract-to-sign';
import { emailLayout, nota, parrafo } from '@/lib/email-templates/layout';
import { escapeHtml } from '@/lib/html-escape';
import { createContract } from '@/lib/leads/documenso-contract';
import { sendCrmEmail } from '@/lib/resend';
import { jurisdiccionCorta } from '@/lib/leads/legal-clause';
import { rateLimit } from '@/lib/rate-limit';
import { getSupabaseAdmin } from '@/lib/supabase';
import { parseConfigurationSnapshot } from '@/lib/order-configuration-snapshot';

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
  locale: string | null;
  configuracion_snapshot?: unknown;
}

/** Cuando el contrato no se pudo crear: el cliente no tiene la culpa. */
function contratoDemoradoHtml(nombre: string, paquete: string): string {
  return emailLayout({
    preheader: 'Tu contrato llega por correo en unos minutos.',
    eyebrow: 'Silvano Puccini Dev',
    titulo: `Gracias, ${nombre}`,
    paso: 1,
    cuerpo: [
      parrafo(`Tu pedido de ${paquete} quedó registrado. El contrato tuvo una demora `
        + 'técnica de mi lado y te lo mando por este mismo correo en unos minutos.'),
      nota('No hace falta que hagas nada. Si en un rato no te llegó, respondé este correo.'),
    ].join(''),
  });
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
      .select('id, paquete, extras, total_usd, mensual_usd, firmado_at, locale, configuracion_snapshot')
      .eq('id', id)
      .maybeSingle();

    if (!pedido) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });

    const fila = pedido as PedidoRow;
    if (fila.total_usd <= 0) return NextResponse.json({ error: 'Activation and initial payment terms require confirmation.' }, { status: 409 });
    if (fila.firmado_at) {
      return NextResponse.json({ error: 'Este pedido ya está firmado.' }, { status: 409 });
    }

    // A non-null archive is authoritative. Never turn malformed historical
    // data into a promise based on today's catalog.
    const archived = fila.configuracion_snapshot == null
      ? null
      : parseConfigurationSnapshot(fila.configuracion_snapshot);
    if (fila.configuracion_snapshot != null && !archived) {
      return NextResponse.json({ error: 'The frozen order configuration is unavailable.' }, { status: 409 });
    }

    const paquete = paquetePorSlug(fila.paquete);
    if (!paquete) return NextResponse.json({ error: 'Unknown package.' }, { status: 404 });

    const servicio = servicioPorSlug(paquete.servicio);
    const resumen = totalPedido(paquete, fila.extras ?? [], servicio?.extras ?? []);

    // Lo que dice el contrato: el paquete con sus extras, tal como lo eligió.
    const alcance = archived
      ? [...archived.package.included, ...archived.extras.map((extra) => extra.label)].join(', ')
      : [...paquete.incluye.es, ...resumen.extras.map((extra) => extra.label.es)].join(', ');

    const modulos = archived ? [
      { slug: archived.package.id, label: archived.package.label, precioUsd: archived.package.oneTimeUsd || archived.package.recurringUsd },
      ...archived.extras.map((extra) => ({ slug: extra.id, label: extra.label, precioUsd: extra.amountUsd })),
    ] : [
      { slug: paquete.slug, label: paquete.nombre.es, precioUsd: paquete.precioUsd ?? undefined },
      ...resumen.extras.map((extra) => ({
        slug: extra.id, label: extra.label.es, precioUsd: extra.precioUsd,
      })),
    ];
    const totalCongelado = archived?.charges.oneTimeUsd ?? fila.total_usd;

    // Creation and association commit together, serialized by the order row lock.
    const { data: lead, error: leadError } = await db.rpc('prepare_order_contract', {
      p_order_id: fila.id,
      p_external: process.env.FIRMA_CON_DOCUMENSO === '1',
      p_details: {
        nombre, email, pais: pais || null,
      tipo_proyecto: archived?.package.label ?? paquete.nombre.es,
      que_construir: archived?.package.description ?? paquete.resumen.es,
      pago_unico: archived ? archived.package.recurringUsd === 0 : paquete.pagoUnico,
        service: paquete.servicio,
        modulos_seleccionados: modulos,
      },
    });
    if (leadError || !lead) {
      const conflict = ['buyer_conflict', 'order_signed'].includes(leadError?.message ?? '');
      if (conflict) return NextResponse.json({ error: 'This order is already associated with a buyer or signed.' }, { status: 409 });
      console.error('[api/pedido/contrato] Could not prepare the sale:', leadError);
      return NextResponse.json({ error: 'Could not create the sale.' }, { status: 500 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://silvanopuccini.dev';
    const locale = fila.locale === 'en' ? 'en' : 'es';

    // Por defecto el contrato se firma en nuestro sitio: sin tope de
    // documentos, sin correos de terceros y con el diseño nuestro. Documenso
    // queda detrás de esta variable para cuando un contrato lo justifique.
    if (process.env.FIRMA_CON_DOCUMENSO !== '1') {
      if (lead.created) {
        await mandarElLink({ email, nombre, paquete: paquete.nombre.es, totalUsd: fila.total_usd, url: `${siteUrl}/${locale}/pedido/${fila.id}` });
      }

      return NextResponse.json({ modo: 'propia', leadId: lead.id });
    }

    if (lead.signingUrl && lead.token) {
      return NextResponse.json({ modo: 'externa' });
    }
    // Another request claimed provisioning, or its external result is uncertain.
    // Keep the buyer association and require reconciliation instead of duplicating envelopes.
    if (!lead.provision) return NextResponse.json({ demorado: true }, { status: 202 });

    let contrato;
    try {
      contrato = await createContract(
        {
          nombre,
          email,
          total: totalCongelado,
          alcance,
          objeto: archived?.package.description ?? paquete.resumen.es,
          plazo: `${archived?.package.deliveryDays ?? paquete.plazoDias} días hábiles`,
          pago: (archived ? archived.package.recurringUsd === 0 : paquete.pagoUnico)
          ? `Pago único de USD ${totalCongelado.toLocaleString('es-AR')} por adelantado.`
            : 'Seña del 50% para comenzar y el saldo contra entrega.',
          domicilio: pais,
          jurisdiccion: jurisdiccionCorta(pais || null),
        },
        // Con el idioma adelante: `/gracias` sin idioma es un 404, y el
        // cliente lo ve justo después de firmar, que es el peor momento.
        `${siteUrl}/${locale}/gracias`,
        fila.id,
      );
    } catch (reason) {
      const detalle = reason instanceof Error ? reason.message : String(reason);
      console.error('[api/pedido/contrato] Documenso falló:', detalle);

      // La venta ya está creada con todo lo que eligió: lo que falló es el
      // papel, no la compra. En vez de mostrarle un error al cliente que
      // acaba de decidir comprarte, se le avisa que el contrato llega por
      // mail y se te pide que lo mandes a mano.
      const admin = process.env.ADMIN_EMAIL;
      await Promise.allSettled([
        sendCrmEmail(
          email,
          'Tu contrato llega en unos minutos',
          contratoDemoradoHtml(nombre, paquete.nombre.es),
        ),
        admin
          ? sendCrmEmail(
            admin,
            `URGENTE: mandale el contrato a ${nombre}`,
            `<p>No se pudo crear el contrato en Documenso de ${escapeHtml(nombre)} `
            + `(${escapeHtml(email)}), por ${escapeHtml(paquete.nombre.es)}.</p>`
            + `<p>Motivo: ${escapeHtml(detalle.slice(0, 300))}</p>`
            + '<p>La venta está creada en el panel. Mandale el contrato desde ahí.</p>',
          )
          : Promise.resolve(),
      ]);

      return NextResponse.json({ demorado: true }, { status: 202 });
    }

    const { data: persisted, error: persistError } = await db.from('leads').update({
      contrato_signing_url: contrato.signingUrl,
      contrato_firma_token: contrato.token,
      contrato_envelope_id: contrato.envelopeId,
    }).eq('id', lead.id).select('id').single();
    if (persistError || !persisted) {
      console.error('[api/pedido/contrato] Provider result requires reconciliation:', persistError);
      return NextResponse.json({ error: 'Could not save the signing link.' }, { status: 500 });
    }

    await mandarElLink({ email, nombre, paquete: archived?.package.label ?? paquete.nombre.es, totalUsd: totalCongelado, url: `${siteUrl}/${locale}/pedido/${fila.id}` });

    return NextResponse.json({ modo: 'externa' });
  } catch (err) {
    console.error('[api/pedido/contrato] POST error:', err);
    return NextResponse.json({ error: 'Could not prepare the contract.' }, { status: 500 });
  }
}

/**
 * El link del pedido, al correo del cliente.
 *
 * Es el único respaldo que tiene: el link es un uuid que vive en la barra del
 * navegador y en ningún otro lado. Si cierra la pestaña sin esto, pierde una
 * venta que ya había decidido y no tiene cómo volver.
 *
 * Sale apenas deja su correo, antes de firmar, que es justo cuando todavía
 * puede perderlo todo. Durante un tiempo salió solo por el camino de
 * Documenso: el `return` de la firma propia estaba antes, así que en el
 * circuito que se usa de verdad no se mandaba nunca.
 *
 * Que falle el envío no puede tirar abajo la firma, que es lo que el cliente
 * está haciendo ahora mismo.
 */
async function mandarElLink(datos: {
  email: string; nombre: string; paquete: string; totalUsd: number; url: string;
}): Promise<void> {
  try {
    await sendCrmEmail(
      datos.email,
      'Tu contrato está listo para firmar',
      contractToSignHtml({
        name: datos.nombre,
        paquete: datos.paquete,
        totalUsd: datos.totalUsd,
        url: datos.url,
      }),
    );
  } catch (reason) {
    console.warn('[api/pedido/contrato] El correo con el link no salió:', reason);
  }
}
