import { NextRequest, NextResponse } from 'next/server';

import type { DatosDelContrato } from '@/content/contrato';
import { paquetePorSlug, servicioPorSlug, totalPedido } from '@/content/servicios';
import { emailLayout, nota, panelDestacado, parrafo, bloqueDatos } from '@/lib/email-templates/layout';
import { buildContract, Packer } from '@/lib/contract-template';
import { evidenciaDeFirma, nombreCoincide } from '@/lib/leads/firma-propia';
import { jurisdiccionCorta } from '@/lib/leads/legal-clause';
import { paymentInstructionsFor } from '@/lib/leads/payment-instructions';
import { quoteFor } from '@/lib/leads/exchange-rate';
import { advanceOn } from '@/lib/leads/pipeline';
import { rateLimit } from '@/lib/rate-limit';
import { sendCrmEmail } from '@/lib/resend';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * La firma del contrato, en nuestro propio sitio.
 *
 * El cliente leyó el contrato completo en pantalla, escribió su nombre y
 * aceptó. Acá se registra con toda la evidencia, se archiva el PDF y se le
 * manda la copia junto con los datos para pagar.
 *
 * Un solo correo para las dos cosas a propósito: el que acaba de firmar
 * quiere saber cómo pagar, y separarlo en dos mensajes es hacerlo esperar sin
 * motivo.
 */

export const dynamic = 'force-dynamic';

const BUCKET = 'contratos';

function getIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'desconocida';
}

/** El contrato de esta venta, con los datos que le tocan. */
function datosDelContrato(
  paquete: NonNullable<ReturnType<typeof paquetePorSlug>>,
  extras: { label: { es: string } }[],
  lead: { nombre: string; localidad: string | null; pais: string | null },
  totalUsd: number,
): DatosDelContrato {
  return {
    clientName: lead.nombre,
    clientLocation: lead.localidad ?? lead.pais ?? '',
    clientCountry: lead.pais ?? '',
    projectDescription: `${paquete.nombre.es}. ${paquete.resumen.es}`,
    deliverables: [...paquete.incluye.es, ...extras.map((e) => e.label.es)].join('\n'),
    excluded: paquete.noIncluye.es.join('\n'),
    totalHours: paquete.horas,
    totalPrice: totalUsd,
    hourlyRate: 30,
    paymentTerms: paquete.pagoUnico
      ? `Pago único de USD ${totalUsd.toLocaleString('es-AR')} por adelantado.`
      : 'Seña del 50% para comenzar y el saldo contra entrega.',
    estimatedWeeks: Math.max(1, Math.ceil(paquete.plazoDias / 5)),
    legalClause: jurisdiccionCorta(lead.pais),
  };
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!rateLimit(`firmar:${getIp(req)}`, 5, 60_000)) {
      return NextResponse.json({ error: 'Probá de nuevo en un minuto.' }, { status: 429 });
    }

    const body = await req.json().catch(() => null);
    const nombre = typeof body?.nombre === 'string' ? body.nombre.trim() : '';

    if (body?.acepta !== true) {
      return NextResponse.json({ error: 'Tenés que aceptar el contrato para firmarlo.' }, { status: 400 });
    }

    const db = getSupabaseAdmin();

    const { data: fila } = await db
      .from('pedidos')
      .select('id, lead_id, paquete, extras, total_usd, mensual_usd, locale')
      .eq('id', id)
      .maybeSingle();

    const pedido = fila as {
      id: string; lead_id: string | null; paquete: string; extras: string[] | null;
      total_usd: number; locale: string | null;
    } | null;

    if (!pedido?.lead_id) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

    const { data } = await db
      .from('leads')
      .select('id, nombre, email, pais, localidad, estado, contrato_firmado_at, pago_unico, sena_pct')
      .eq('id', pedido.lead_id)
      .maybeSingle();

    const lead = data as {
      id: string; nombre: string; email: string;
      pais: string | null; localidad: string | null; estado: string | null;
      contrato_firmado_at: string | null;
    } | null;

    if (!lead) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

    if (lead.contrato_firmado_at) {
      return NextResponse.json({ error: 'Este contrato ya está firmado.' }, { status: 409 });
    }

    // El nombre escrito tiene que ser el del contrato: es lo único que hace
    // que escribirlo signifique algo.
    if (!nombreCoincide(nombre, lead.nombre)) {
      return NextResponse.json(
        { error: 'El nombre tiene que coincidir con el del contrato.' },
        { status: 422 },
      );
    }

    const paquete = paquetePorSlug(pedido.paquete);
    if (!paquete) return NextResponse.json({ error: 'Unknown package.' }, { status: 404 });

    const servicio = servicioPorSlug(paquete.servicio);
    const resumen = totalPedido(paquete, pedido.extras ?? [], servicio?.extras ?? []);
    const contrato = datosDelContrato(paquete, resumen.extras, lead, pedido.total_usd);

    const evidencia = evidenciaDeFirma(contrato, lead.nombre, {
      ip: getIp(req),
      navegador: req.headers.get('user-agent') ?? 'desconocido',
    });

    // El PDF sale con la evidencia adentro: tiene que sostenerse solo, sin
    // que haya que cruzarlo con la base para saber si vale.
    const pdf = await Packer.toBuffer(buildContract({
      ...contrato,
      firmaCliente: {
        nombre: evidencia.nombre,
        firmadoAt: evidencia.firmadoAt,
        ip: evidencia.ip,
        huella: evidencia.huella,
      },
    }));

    const pdfPath = `${lead.id}/${pedido.id}.pdf`;
    const { error: errorPdf } = await db.storage.from(BUCKET).upload(
      pdfPath,
      new Uint8Array(pdf),
      { contentType: 'application/pdf', upsert: true },
    );
    if (errorPdf) console.error('[api/pedido/firmar] No se pudo archivar el PDF:', errorPdf);

    const { error } = await db.from('firmas').insert({
      lead_id: lead.id,
      pedido_id: pedido.id,
      nombre: evidencia.nombre,
      ip: evidencia.ip,
      navegador: evidencia.navegador,
      texto: evidencia.texto,
      huella: evidencia.huella,
      pdf_path: errorPdf ? null : pdfPath,
      firmado_at: evidencia.firmadoAt,
    });

    if (error) {
      console.error('[api/pedido/firmar] No se pudo registrar la firma:', error);
      return NextResponse.json({ error: 'No se pudo registrar la firma.' }, { status: 500 });
    }

    const nextState = advanceOn('contrato_firmado', lead.estado ?? '');

    await db.from('leads').update({
      contrato_firmado_at: evidencia.firmadoAt,
      ...(nextState ? { estado: nextState } : {}),
    }).eq('id', lead.id);

    await db.from('pedidos').update({ firmado_at: evidencia.firmadoAt }).eq('id', pedido.id);

    // Su copia y cómo pagar, en un solo correo: el que firmó quiere pagar
    // ahora, no esperar un segundo mensaje.
    const cotizacion = await quoteFor(lead.pais, pedido.total_usd);
    const monto = `USD ${pedido.total_usd.toLocaleString('es-AR')}`;

    try {
      await sendCrmEmail(
        lead.email,
        'Contrato firmado · datos para el pago',
        emailLayout({
          preheader: `${monto} para arrancar. Tu copia firmada va adjunta.`,
          eyebrow: 'Silvano Puccini Dev',
          titulo: `Listo, ${lead.nombre.split(' ')[0]}`,
          paso: 2,
          cuerpo: [
            parrafo('Tu contrato quedó firmado. Te adjunto la copia con el detalle de la firma.'),
            panelDestacado({
              etiqueta: 'A abonar ahora',
              valor: monto,
              detalle: cotizacion
                ? `= ${cotizacion.currency} ${cotizacion.amount.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`
                : undefined,
              nota: contrato.paymentTerms,
            }),
            bloqueDatos('Cómo pagar', paymentInstructionsFor(lead.pais)),
            parrafo('Cuando transfieras, avisame desde tu página y te confirmo la acreditación.'),
            nota('Si algo no coincide con lo que acordamos, respondé este correo antes de pagar.'),
          ].join(''),
        }),
        [{ filename: `Contrato · ${lead.nombre}.pdf`, content: Buffer.from(pdf) }],
      );
    } catch (reason) {
      // La firma ya ocurrió: no se deshace porque falle un correo.
      console.warn('[api/pedido/firmar] El correo no salió:', reason);
    }

    const admin = process.env.ADMIN_EMAIL;
    if (admin) {
      try {
        await sendCrmEmail(
          admin,
          `${lead.nombre} firmó el contrato · ${monto}`,
          `<p>Firmó ${paquete.nombre.es} por ${monto}. Ya tiene los datos para pagar.</p>`,
        );
      } catch {
        // Un aviso que no llega no cambia nada de lo que pasó.
      }
    }

    return NextResponse.json({ ok: true, firmadoAt: evidencia.firmadoAt });
  } catch (err) {
    console.error('[api/pedido/firmar] POST error:', err);
    return NextResponse.json({ error: 'No se pudo firmar.' }, { status: 500 });
  }
}
