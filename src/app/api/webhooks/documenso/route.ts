import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase';
import { advanceOn } from '@/lib/leads/pipeline';
import { sendCrmEmail } from '@/lib/resend';
import { paymentRequestHtml } from '@/lib/email-templates/payment-request';
import { paymentInstructionsFor } from '@/lib/leads/payment-instructions';
import { quoteFor } from '@/lib/leads/exchange-rate';
import { archiveSignedContract } from '@/lib/leads/contract-archive';
import { packageForTemplate, type FixedPackage } from '@/content/packages';
import { descargarContratoFirmado } from '@/lib/leads/documenso-contract';
import { paquetePorSlug, servicioPorSlug } from '@/content/servicios';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Lo que Documenso cuenta de un contrato, convertido en pasos de la venta.
 *
 *   DOCUMENT_SENT      → «Contrato enviado». Con esto el cliente recibe UN
 *                         solo mail, el de Documenso, que ya trae el contrato
 *                         para leer y firmar; el botón del panel queda de
 *                         respaldo.
 *   RECIPIENT_EXPIRED  → marca el contrato como vencido sin firmar. Sin esto
 *                         el lead quedaba en «Contrato enviado» para siempre.
 *   DOCUMENT_OPENED    → el cliente lo leyó. Si pasan días sin firma, es el
 *                         momento de llamar: tiene una duda que no escribió.
 *   DOCUMENT_REJECTED  → dijo que no, con su motivo. NO es una venta perdida:
 *                         muchas veces es una negociación. Se guarda el motivo
 *                         y el tablero lo reclama; perderla lo decide Silvano.
 *   DOCUMENT_COMPLETED → «Contrato firmado», pedido de pago y archivo del PDF
 *                         firmado con su registro de auditoría.
 *
 * El lead se identifica por el mail del firmante. Es lo único que los dos
 * sistemas comparten sin guardar un id de Documenso en cada fila.
 */

interface DocumensoRecipient {
  email?: string;
  name?: string;
  signingStatus?: string;
  readStatus?: string;
  rejectionReason?: string | null;
}

type DocumensoPayload = {
  event?: string;
  payload?: {
    id?: number | string;
    envelopeId?: string;
    /** «TEMPLATE_DIRECT_LINK» cuando se firmó desde el link directo de una plantilla. */
    source?: string;
    templateId?: number | string | null;
    /** El pedido que se enganchó al link de firma. */
    externalId?: string | null;
    recipients?: DocumensoRecipient[];
  };
};

interface LeadForSignature {
  id: string;
  nombre: string;
  email: string;
  pais: string | null;
  estado: string | null;
  monto_presupuestado: number | null;
  sena_pct: number | null;
  sena_monto: number | null;
  pago_unico: boolean | null;
  contrato_pdf_path: string | null;
  contrato_abierto_at: string | null;
}

const LEAD_COLUMNS =
  'id, nombre, email, pais, estado, monto_presupuestado, sena_pct, sena_monto, pago_unico, contrato_pdf_path, contrato_abierto_at';

/**
 * Documenso NO firma el cuerpo: manda el secreto configurado, tal cual, en
 * `X-Documenso-Secret`. Distinto de Cal.com, que manda un HMAC. La primera
 * versión de esto calculaba un HMAC y habría rechazado todos los avisos reales.
 * La comparación sigue siendo en tiempo constante.
 */
function verifySecret(received: string | null): boolean {
  const secret = process.env.DOCUMENSO_WEBHOOK_SECRET;
  if (!secret || !received) return false;

  const a = Buffer.from(received);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * El lead que corresponde a alguno de los firmantes.
 *
 * Un contrato puede tener más de un firmante —Silvano mismo, por ejemplo—.
 * Tomar el primero de la lista podía caer en el correo equivocado: se busca
 * el que corresponda a un lead.
 */
async function findLead(emails: string[]): Promise<{ lead: LeadForSignature | null; error?: string }> {
  const db = getSupabaseAdmin();
  for (const email of emails) {
    const { data, error } = await db.from('leads').select(LEAD_COLUMNS).eq('email', email).maybeSingle();
    if (error) return { lead: null, error: error.message };
    if (data) return { lead: data as LeadForSignature };
  }
  return { lead: null };
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Este webhook mueve una venta y dispara un correo a un cliente: sin el
  // secreto correcto no se procesa, igual que el de Cal.com.
  if (!verifySecret(req.headers.get('x-documenso-secret'))) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  let event: DocumensoPayload;
  try {
    event = JSON.parse(rawBody) as DocumensoPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Documenso lo manda en mayúsculas; se acepta también «document.completed».
  const kind = (event.event ?? '').toUpperCase().replace('.', '_');
  if (!HANDLED.includes(kind)) {
    return NextResponse.json({ ok: true, action: 'ignored' });
  }

  const emails = (event.payload?.recipients ?? [])
    .map((recipient) => recipient.email?.trim().toLowerCase())
    .filter((email): email is string => Boolean(email));

  if (emails.length === 0) {
    return NextResponse.json({ error: 'No signer email' }, { status: 400 });
  }

  const found = await findLead(emails);
  if (found.error) return NextResponse.json({ error: found.error }, { status: 500 });
  let lead = found.lead;

  // Un paquete de precio fijo se firma sin haber pasado por el formulario: no
  // hay lead. Se crea solo al completar la firma, y solo si la plantilla es la
  // de un paquete activo; abrir el link o firmar otro documento no crea nada.
  let origen: string | undefined;
  if (!lead && kind === 'DOCUMENT_COMPLETED' && event.payload?.source === 'TEMPLATE_DIRECT_LINK') {
    // Primero el pedido: trae el total real, con los extras que eligió. La
    // plantilla quedó como respaldo para los links directos viejos, que no
    // saben nada de extras.
    const pedido = await pedidoDe(event.payload.externalId);
    if (pedido) {
      const created = await createLeadFromPedido(pedido, event.payload.recipients ?? []);
      if (created.error) return NextResponse.json({ error: created.error }, { status: 500 });
      lead = created.lead;
      origen = `pedido:${pedido.paquete}`;
      if (lead) await cerrarPedido(pedido.id, lead.id);
    } else {
      const pkg = packageForTemplate(event.payload.templateId);
      if (pkg) {
        const created = await createLeadFromPackage(pkg, event.payload.recipients ?? []);
        if (created.error) return NextResponse.json({ error: created.error }, { status: 500 });
        lead = created.lead;
        origen = `paquete:${pkg.slug}`;
      }
    }
  }
  if (!lead) return NextResponse.json({ ok: true, action: 'lead_not_found' });

  // El firmante que corresponde al lead: sus estados son los que importan, no
  // los de Silvano si también figura en el sobre.
  const recipient = (event.payload?.recipients ?? [])
    .find((r) => r.email?.trim().toLowerCase() === lead.email.trim().toLowerCase());

  if (kind === 'DOCUMENT_SENT') return onSent(lead);
  if (kind === 'RECIPIENT_EXPIRED') return onExpired(lead);
  if (kind === 'DOCUMENT_OPENED') return onOpened(lead, recipient);
  if (kind === 'DOCUMENT_REJECTED') return onRejected(lead, recipient);
  return onCompleted(lead, event.payload?.envelopeId, origen);
}

interface PedidoRow {
  id: string;
  paquete: string;
  extras: string[];
  total_usd: number;
  mensual_usd: number;
}

/** El pedido que viajó con el sobre. Sin él, se cae a la plantilla. */
async function pedidoDe(externalId: string | null | undefined): Promise<PedidoRow | null> {
  if (!externalId) return null;

  const { data, error } = await getSupabaseAdmin()
    .from('pedidos')
    .select('id, paquete, extras, total_usd, mensual_usd')
    .eq('id', externalId)
    .maybeSingle();

  if (error) {
    console.error('[webhook/documenso] No se pudo leer el pedido:', error);
    return null;
  }
  return (data as PedidoRow | null) ?? null;
}

/** El pedido deja de estar abierto: ya tiene firma y dueño. */
async function cerrarPedido(pedidoId: string, leadId: string) {
  const { error } = await getSupabaseAdmin()
    .from('pedidos')
    .update({ lead_id: leadId, firmado_at: new Date().toISOString() })
    .eq('id', pedidoId);

  if (error) console.error('[webhook/documenso] No se pudo cerrar el pedido:', error);
}

/**
 * La venta de un pedido: el monto es el que el cliente vio cuando eligió, con
 * sus extras, y no el precio de lista del paquete.
 */
async function createLeadFromPedido(
  pedido: PedidoRow,
  recipients: DocumensoRecipient[],
): Promise<{ lead: LeadForSignature | null; error?: string }> {
  const signer = recipients.find((r) => r.email) ?? {};
  const email = (signer.email ?? '').trim().toLowerCase();
  const paquete = paquetePorSlug(pedido.paquete);
  const servicio = paquete ? servicioPorSlug(paquete.servicio) : null;

  const etiquetas = (pedido.extras ?? [])
    .map((id) => servicio?.extras.find((extra) => extra.id === id)?.label.es ?? id);

  const { data, error } = await getSupabaseAdmin()
    .from('leads')
    .insert({
      nombre: signer.name?.trim() || email,
      email,
      tipo_proyecto: paquete?.nombre.es ?? pedido.paquete,
      que_construir: paquete?.resumen.es ?? null,
      estado: 'contrato_enviado',
      monto_presupuestado: pedido.total_usd,
      mantenimiento_mensual: pedido.mensual_usd || null,
      pago_unico: paquete?.pagoUnico ?? true,
      service: paquete?.servicio ?? null,
      pedido_snapshot: {
        paquete: pedido.paquete,
        extras: pedido.extras ?? [],
        totalUsd: pedido.total_usd,
        mensualUsd: pedido.mensual_usd,
        congeladoAt: new Date().toISOString(),
      },
      // El alcance cotizado, para que la propuesta y el contrato lo listen.
      modulos_seleccionados: [
        ...(paquete ? [{ slug: paquete.slug, label: paquete.nombre.es, precioUsd: paquete.precioUsd }] : []),
        ...(pedido.extras ?? []).map((id, i) => ({
          slug: id,
          label: etiquetas[i],
          precioUsd: servicio?.extras.find((extra) => extra.id === id)?.precioUsd,
        })),
      ],
    })
    .select(LEAD_COLUMNS)
    .single();

  if (error) {
    console.error('[webhook/documenso] No se pudo crear la venta del pedido:', error);
    return { lead: null, error: error.message };
  }
  return { lead: data as LeadForSignature };
}

/**
 * La venta de un paquete: nace en «contrato enviado» para que la firma la
 * avance como a cualquier otra, con el precio del paquete y no uno a mano.
 */
async function createLeadFromPackage(
  pkg: FixedPackage,
  recipients: DocumensoRecipient[],
): Promise<{ lead: LeadForSignature | null; error?: string }> {
  const signer = recipients.find((r) => r.email) ?? {};
  const email = (signer.email ?? '').trim().toLowerCase();

  const { data, error } = await getSupabaseAdmin()
    .from('leads')
    .insert({
      nombre: signer.name?.trim() || email,
      email,
      tipo_proyecto: pkg.name.es,
      que_construir: pkg.summary.es,
      estado: 'contrato_enviado',
      monto_presupuestado: pkg.priceUsd,
      pago_unico: pkg.singlePayment,
    })
    .select(LEAD_COLUMNS)
    .single();

  if (error) {
    console.error('[webhook/documenso] No se pudo crear la venta del paquete:', error);
    return { lead: null, error: error.message };
  }
  return { lead: data as LeadForSignature };
}

const HANDLED = [
  'DOCUMENT_SENT', 'RECIPIENT_EXPIRED', 'DOCUMENT_OPENED', 'DOCUMENT_REJECTED', 'DOCUMENT_COMPLETED',
];

/**
 * Lo abrió. Se guarda solo la primera vez: la pregunta que importa es «hace
 * cuánto lo leyó y no firma», y cada reapertura correría ese reloj.
 */
async function onOpened(lead: LeadForSignature, recipient: DocumensoRecipient | undefined) {
  // Si quien lo abrió fue otro firmante, el cliente no lo leyó todavía.
  if (recipient?.readStatus && recipient.readStatus !== 'OPENED') {
    return NextResponse.json({ ok: true, action: 'ignored_not_client' });
  }
  if (lead.contrato_abierto_at || lead.estado !== 'contrato_enviado') {
    return NextResponse.json({ ok: true, action: 'apertura_ya_registrada' });
  }

  const error = await update(lead.id, { contrato_abierto_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: 'DB update failed' }, { status: 500 });

  return NextResponse.json({ ok: true, action: 'contrato_abierto' });
}

/**
 * Lo rechazó. El estado queda en «contrato enviado»: un rechazo con motivo
 * suele ser una negociación («cambiemos la cláusula 7»), y darla por perdida
 * automáticamente cerraría una venta que todavía se puede salvar.
 */
async function onRejected(lead: LeadForSignature, recipient: DocumensoRecipient | undefined) {
  if (recipient?.signingStatus && recipient.signingStatus !== 'REJECTED') {
    return NextResponse.json({ ok: true, action: 'ignored_not_client' });
  }

  const motivo = recipient?.rejectionReason?.trim() || null;
  const error = await update(lead.id, {
    contrato_rechazado_at: new Date().toISOString(),
    contrato_rechazo_motivo: motivo,
  });
  if (error) return NextResponse.json({ error: 'DB update failed' }, { status: 500 });

  return NextResponse.json({ ok: true, action: 'contrato_rechazado' });
}

async function update(leadId: string, fields: Record<string, unknown>) {
  const { error } = await getSupabaseAdmin().from('leads').update(fields).eq('id', leadId);
  if (error) console.error('[webhook/documenso] DB update error:', error);
  return error;
}

/** El contrato salió: la venta avanza y deja de figurar como propuesta sin respuesta. */
async function onSent(lead: LeadForSignature) {
  const nextState = advanceOn('contrato_enviado', lead.estado ?? '');

  // Un reenvío —después de vencido o de un rechazo negociado— vuelve a
  // contar desde cero: lo que hizo con el contrato anterior ya no aplica.
  const error = await update(lead.id, {
    contract_sent_at: new Date().toISOString(),
    contrato_vencido_at: null,
    contrato_abierto_at: null,
    contrato_rechazado_at: null,
    contrato_rechazo_motivo: null,
    ...(nextState ? { estado: nextState } : {}),
  });
  if (error) return NextResponse.json({ error: 'DB update failed' }, { status: 500 });

  return NextResponse.json({ ok: true, action: nextState ? 'contrato_enviado' : 'envio_registrado' });
}

/**
 * Venció sin firma. No cambia el estado —la venta no se perdió, se enfrió—,
 * pero lo marca para que el tablero lo reclame.
 */
async function onExpired(lead: LeadForSignature) {
  if (lead.estado !== 'contrato_enviado') {
    return NextResponse.json({ ok: true, action: 'ignored_not_pending' });
  }

  const error = await update(lead.id, { contrato_vencido_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: 'DB update failed' }, { status: 500 });

  return NextResponse.json({ ok: true, action: 'contrato_vencido' });
}

async function onCompleted(lead: LeadForSignature, envelopeId: string | undefined, origen?: string) {
  const nextState = advanceOn('contrato_firmado', lead.estado ?? '');

  const error = await update(lead.id, {
    contrato_firmado_at: new Date().toISOString(),
    contrato_vencido_at: null,
    contrato_rechazado_at: null,
    ...(nextState ? { estado: nextState } : {}),
  });
  if (error) return NextResponse.json({ error: 'DB update failed' }, { status: 500 });

  // El pedido de pago solo sale si la venta avanzó: un aviso repetido no
  // vuelve a pedirle plata al cliente.
  let mail = 'no_corresponde';
  if (nextState) {
    try {
      const total = lead.monto_presupuestado ?? 0;
      const pct = lead.sena_pct ?? 50;
      const single = lead.pago_unico === true;

      const amount = single ? total : (lead.sena_monto ?? Math.round(total * pct) / 100);
      // En pesos para Argentina y Chile; si la cotización no llega, sale solo en USD.
      const localQuote = await quoteFor(lead.pais, amount);

      // Su copia firmada, adjunta a NUESTRO correo. Antes la recibía de
      // Documenso, con la marca de ellos y suelta de todo lo demás.
      const copia = envelopeId ? await descargarContratoFirmado(envelopeId) : null;

      await sendCrmEmail(lead.email, 'Contrato firmado · datos para el pago', paymentRequestHtml({
        name: lead.nombre,
        amount,
        total,
        pct: single ? 100 : pct,
        singlePayment: single,
        paymentInstructions: paymentInstructionsFor(lead.pais),
        localQuote,
      }), copia
        ? [{ filename: 'Contrato firmado.pdf', content: copia }]
        : undefined);
      mail = 'enviado';
    } catch (reason) {
      // La firma ocurrió: no se deshace porque el correo falló.
      mail = reason instanceof Error ? reason.message : String(reason);
      console.warn('[webhook/documenso] El pedido de pago no salió:', mail);
    }
  }

  // El archivo va último: es lo más lento y lo menos urgente para el cliente.
  // Si ya estaba archivado (aviso repetido), no se baja de nuevo.
  let archivo = 'ya_archivado';
  if (!lead.contrato_pdf_path) {
    if (!envelopeId) {
      archivo = 'sin_envelope_id';
    } else {
      const result = await archiveSignedContract(envelopeId, lead.id);
      if (result.ok) {
        await update(lead.id, { contrato_pdf_path: result.paths[0] });
        archivo = 'guardado';
      } else {
        archivo = result.detail;
      }
    }
  }

  return NextResponse.json({
    ok: true,
    action: nextState ? 'contrato_firmado' : 'firma_registrada',
    mail,
    archivo,
    ...(origen ? { origen } : {}),
  });
}
