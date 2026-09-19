import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase';
import { advanceOn } from '@/lib/leads/pipeline';
import { sendCrmEmail } from '@/lib/resend';
import { paymentRequestHtml } from '@/lib/email-templates/payment-request';
import { paymentInstructionsFor } from '@/lib/leads/payment-instructions';
import { archiveSignedContract } from '@/lib/leads/contract-archive';

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
 *   DOCUMENT_COMPLETED → «Contrato firmado», pedido de pago y archivo del PDF
 *                         firmado con su registro de auditoría.
 *
 * El lead se identifica por el mail del firmante. Es lo único que los dos
 * sistemas comparten sin guardar un id de Documenso en cada fila.
 */

type DocumensoPayload = {
  event?: string;
  payload?: {
    id?: number | string;
    envelopeId?: string;
    recipients?: { email?: string; signingStatus?: string }[];
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
}

const LEAD_COLUMNS =
  'id, nombre, email, pais, estado, monto_presupuestado, sena_pct, sena_monto, pago_unico, contrato_pdf_path';

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
  if (!['DOCUMENT_SENT', 'RECIPIENT_EXPIRED', 'DOCUMENT_COMPLETED'].includes(kind)) {
    return NextResponse.json({ ok: true, action: 'ignored' });
  }

  const emails = (event.payload?.recipients ?? [])
    .map((recipient) => recipient.email?.trim().toLowerCase())
    .filter((email): email is string => Boolean(email));

  if (emails.length === 0) {
    return NextResponse.json({ error: 'No signer email' }, { status: 400 });
  }

  const { lead, error } = await findLead(emails);
  if (error) return NextResponse.json({ error }, { status: 500 });
  if (!lead) return NextResponse.json({ ok: true, action: 'lead_not_found' });

  if (kind === 'DOCUMENT_SENT') return onSent(lead);
  if (kind === 'RECIPIENT_EXPIRED') return onExpired(lead);
  return onCompleted(lead, event.payload?.envelopeId);
}

async function update(leadId: string, fields: Record<string, unknown>) {
  const { error } = await getSupabaseAdmin().from('leads').update(fields).eq('id', leadId);
  if (error) console.error('[webhook/documenso] DB update error:', error);
  return error;
}

/** El contrato salió: la venta avanza y deja de figurar como propuesta sin respuesta. */
async function onSent(lead: LeadForSignature) {
  const nextState = advanceOn('contrato_enviado', lead.estado ?? '');

  // Un reenvío después de vencido vuelve a contar desde cero.
  const error = await update(lead.id, {
    contract_sent_at: new Date().toISOString(),
    contrato_vencido_at: null,
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

async function onCompleted(lead: LeadForSignature, envelopeId: string | undefined) {
  const nextState = advanceOn('contrato_firmado', lead.estado ?? '');

  const error = await update(lead.id, {
    contrato_firmado_at: new Date().toISOString(),
    contrato_vencido_at: null,
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

      await sendCrmEmail(lead.email, 'Datos para el pago', paymentRequestHtml({
        name: lead.nombre,
        amount: single ? total : (lead.sena_monto ?? Math.round(total * pct) / 100),
        total,
        pct: single ? 100 : pct,
        singlePayment: single,
        paymentInstructions: paymentInstructionsFor(lead.pais),
      }));
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
  });
}
