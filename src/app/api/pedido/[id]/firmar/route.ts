import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

import { readRevision } from '@/lib/leads/contract-revision';
import { paquetePorSlug, servicioPorSlug, totalPedido } from '@/content/servicios';
import { boton, emailLayout, nota, panelDestacado, parrafo, bloqueDatos } from '@/lib/email-templates/layout';
import { asuntoDeAviso, avisoAdmin } from '@/lib/email-templates/aviso-admin';
import { buildContractPdf } from '@/lib/contrato-pdf';
import { COOKIE_VERIFICADO, tieneVerificacion } from '@/lib/leads/acceso-cliente';
import { nombreCoincide } from '@/lib/leads/firma-propia';
import { nombreConExtension, tipoDeDocumento } from '@/lib/leads/tipo-de-archivo';
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

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!rateLimit(`firmar:${getIp(req)}`, 5, 60_000)) {
      return NextResponse.json({ error: 'Probá de nuevo en un minuto.' }, { status: 429 });
    }

    if (!tieneVerificacion(req.cookies.get(COOKIE_VERIFICADO)?.value, id)) {
      return NextResponse.json({ error: 'Verify your email before signing.' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const nombre = typeof body?.nombre === 'string' ? body.nombre.trim() : '';

    if (body?.acepta !== true) {
      return NextResponse.json({ error: 'Tenés que aceptar el contrato para firmarlo.' }, { status: 400 });
    }

    const db = getSupabaseAdmin();

    const { data: fila } = await db
      .from('pedidos')
      .select('id, lead_id, paquete, extras, total_usd, mensual_usd, locale, contrato_snapshot')
      .eq('id', id)
      .maybeSingle();

    const pedido = fila as {
      id: string; lead_id: string | null; paquete: string; extras: string[] | null;
      total_usd: number; locale: string | null; contrato_snapshot: unknown;
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

    // El nombre escrito tiene que ser el del contrato: es lo único que hace
    // que escribirlo signifique algo.
    if (!nombreCoincide(nombre, lead.nombre)) {
      return NextResponse.json(
        { error: 'El nombre tiene que coincidir con el del contrato.' },
        { status: 422 },
      );
    }

    const snapshot = pedido.contrato_snapshot ? readRevision(pedido.contrato_snapshot) : null;
    if (snapshot && (body?.revision !== snapshot.revision || !nombreCoincide(nombre, snapshot.datos.clientName))) {
      return NextResponse.json({ error: 'The contract revision changed. Reload and review it before signing.' }, { status: 409 });
    }
    const persistenceArgs = {
      p_order_id: pedido.id,
      p_lead_id: lead.id,
      p_expected_state: lead.estado,
      p_next_state: advanceOn('contrato_firmado', lead.estado ?? ''),
    };
    // A retry repairs old partial writes using the original evidence and timestamp.
    const { data: previous, error: recoveryError } = await db.rpc('persist_order_signature', {
      ...persistenceArgs, p_evidence: null,
    });
    if (recoveryError) throw recoveryError;
    if (previous) return signedResponse(pedido.id, previous.firmadoAt);
    if (lead.contrato_firmado_at) {
      return NextResponse.json({ error: 'Este contrato ya está firmado.' }, { status: 409 });
    }

    const paquete = paquetePorSlug(pedido.paquete);
    if (!paquete) return NextResponse.json({ error: 'Unknown package.' }, { status: 404 });

    const servicio = servicioPorSlug(paquete.servicio);
    const resumen = totalPedido(paquete, pedido.extras ?? [], servicio?.extras ?? []);
    if (!snapshot || pedido.total_usd <= 0) {
      return NextResponse.json({ error: 'Review an available contract and confirmed payment terms before signing.' }, { status: 409 });
    }
    const contrato = snapshot.datos;
    const evidencia = { nombre: snapshot.datos.clientName, firmadoAt: new Date().toISOString(),
      ip: getIp(req).slice(0, 60), navegador: (req.headers.get('user-agent') ?? 'unknown').slice(0, 300),
      texto: snapshot.texto, huella: snapshot.revision };

    // El documento sale con la evidencia adentro: tiene que sostenerse solo,
    // sin que haya que cruzarlo con la base para saber si vale.
    //
    // Y sale en PDF. Durante un tiempo se generaba con `docx` y se servía
    // diciendo que era un PDF, así que no abría en ningún lado. Pero el
    // arreglo no era etiquetarlo bien y dejarlo en Word: un contrato firmado
    // en .docx es un documento editable, y lo que este documento tiene que
    // sostener es justamente que dice lo que decía.
    const documento = await buildContractPdf({
      ...contrato,
      firmaCliente: {
        nombre: evidencia.nombre,
        firmadoAt: evidencia.firmadoAt,
        ip: evidencia.ip,
        huella: evidencia.huella,
      },
    }, snapshot.clausulas);

    // El tipo se mira, no se declara. Durante un tiempo todo este camino dijo
    // «application/pdf» porque la variable se llamaba `pdf`, y lo que sale de
    // `Packer` es un .docx: el cliente recibía un archivo de Word diciendo que
    // era un PDF y no lo podía abrir, ni desde la página ni desde el correo.
    const tipo = tipoDeDocumento(documento);

    const pdfPath = `${lead.id}/${pedido.id}/${randomUUID()}${tipo.extension}`;
    const { error: errorPdf } = await db.storage.from(BUCKET).upload(
      pdfPath,
      new Uint8Array(documento),
      { contentType: tipo.mime, upsert: false },
    );
    if (errorPdf) throw errorPdf;

    const { data: saved, error } = await db.rpc('persist_verified_order_signature', {
      ...persistenceArgs,
      p_revision: snapshot.revision,
      p_evidence: {
        lead_id: lead.id,
        pedido_id: pedido.id,
        nombre: evidencia.nombre,
        ip: evidencia.ip,
        navegador: evidencia.navegador,
        texto: evidencia.texto,
        huella: evidencia.huella,
        pdf_path: pdfPath,
        firmado_at: evidencia.firmadoAt,
      },
    });

    if (error || !saved) {
      console.error('[api/pedido/firmar] No se pudo registrar la firma:', error);
      return NextResponse.json({ error: 'No se pudo registrar la firma.' }, { status: 500 });
    }

    // A competing request may already have committed; never email the losing PDF.
    if (!saved.created) return signedResponse(pedido.id, saved.firmadoAt);

    // Su copia y cómo pagar, en un solo correo: el que firmó quiere pagar
    // ahora, no esperar un segundo mensaje.
    const cotizacion = await quoteFor(lead.pais, pedido.total_usd);
    const monto = `USD ${pedido.total_usd.toLocaleString('es-AR')}`;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://silvanopuccini.dev';
    const locale = pedido.locale === 'en' ? 'en' : 'es';
    const urlDelPedido = `${siteUrl}/${locale}/pedido/${pedido.id}`;

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
            parrafo('Cuando transfieras, avisame desde tu pedido y te confirmo la acreditación.'),

            // El link de vuelta. Decía «avisame desde tu página» sin dar
            // ninguna: el cliente quedaba con los datos para transferir y sin
            // forma de volver a su pedido. Es un uuid que vive en la barra
            // del navegador, así que si cerró la pestaña se le fue.
            boton('Volver a mi pedido', urlDelPedido),
            nota('Guardá este correo: este link es el camino a tu pedido, al contrato y al material del proyecto.'),

            nota('Si algo no coincide con lo que acordamos, respondé este correo antes de pagar.'),
          ].join(''),
        }),
        [{
          filename: nombreConExtension(`Contrato · ${lead.nombre}`, tipo),
          content: documento,
        }],
      );
    } catch (reason) {
      // La firma ya ocurrió: no se deshace porque falle un correo.
      console.warn('[api/pedido/firmar] El correo no salió:', reason);
    }

    const admin = process.env.ADMIN_EMAIL;
    if (admin) {
      try {
        const loQueCompro = [paquete.nombre.es, ...resumen.extras.map((extra) => extra.label.es)].join(' + ');
        await sendCrmEmail(
          admin,
          asuntoDeAviso('firma', lead.nombre, `${paquete.nombre.es} · ${monto}`),
          avisoAdmin({
            tipo: 'firma',
            titulo: `${lead.nombre} firmó el contrato`,
            resumen: `Firmó ${loQueCompro} por ${monto}. Ya tiene los datos para pagar.`,
            filas: [
              { label: 'Cliente', valor: `${lead.nombre} · ${lead.email}` },
              { label: 'Compró', valor: loQueCompro },
              { label: 'Total', valor: monto },
              ...(contrato.plazoDiasHabiles ? [{ label: 'Plazo', valor: `${contrato.plazoDiasHabiles} días hábiles` }] : []),
            ],
            siguiente: 'Te va a llegar el aviso de pago con el comprobante.',
            urlFicha: `${siteUrl}/admin/leads/${lead.id}`,
          }),
        );
      } catch {
        // Un aviso que no llega no cambia nada de lo que pasó.
      }
    }

    return signedResponse(pedido.id, saved.firmadoAt);
  } catch (err) {
    console.error('[api/pedido/firmar] POST error:', err);
    return NextResponse.json({ error: 'No se pudo firmar.' }, { status: 500 });
  }
}


function signedResponse(_pedidoId: string, firmadoAt: string) {
  const res = NextResponse.json({ ok: true, firmadoAt });
  return res;
}
