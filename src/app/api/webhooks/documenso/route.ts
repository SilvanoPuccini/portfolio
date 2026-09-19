import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase';
import { advanceOn } from '@/lib/leads/pipeline';
import { sendCrmEmail } from '@/lib/resend';
import { paymentRequestHtml } from '@/lib/email-templates/payment-request';

export const dynamic = 'force-dynamic';

/**
 * La firma del contrato, avisada por Documenso.
 *
 * Es el único eslabón manual del circuito que se vuelve automático sin
 * esfuerzo: Documenso ya sabe cuándo se firmó, solo hacía falta escucharlo.
 * Cuando el documento queda completo, la venta pasa a `contrato_firmado` y
 * sale el pedido de pago — el mismo que hoy dispara el botón del panel.
 *
 * El lead se identifica por el correo del firmante. Es lo único que los dos
 * sistemas comparten sin necesidad de guardar un id de Documenso en cada fila.
 */

type DocumensoPayload = {
  event?: string;
  payload?: {
    recipients?: { email?: string; signingStatus?: string }[];
    documentData?: { status?: string };
    status?: string;
  };
};

interface LeadForSignature {
  id: string;
  nombre: string;
  email: string;
  estado: string | null;
  monto_presupuestado: number | null;
  sena_pct: number | null;
  sena_monto: number | null;
  pago_unico: boolean | null;
}

/** Los avisos que significan «está firmado por todos». */
const COMPLETED_EVENTS = ['DOCUMENT_COMPLETED', 'document.completed'];

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

  if (!COMPLETED_EVENTS.includes(event.event ?? '')) {
    return NextResponse.json({ ok: true, action: 'ignored' });
  }

  const emails = (event.payload?.recipients ?? [])
    .map((recipient) => recipient.email?.trim().toLowerCase())
    .filter((email): email is string => Boolean(email));

  if (emails.length === 0) {
    return NextResponse.json({ error: 'No signer email' }, { status: 400 });
  }

  // Un contrato puede tener más de un firmante — Silvano mismo, por ejemplo.
  // Tomar el primero de la lista podía caer en el correo equivocado: se busca
  // el que corresponda a un lead.
  const db = getSupabaseAdmin();
  let lead: LeadForSignature | null = null;
  for (const email of emails) {
    const { data, error } = await db
      .from('leads')
      .select('id, nombre, email, estado, monto_presupuestado, sena_pct, sena_monto, pago_unico')
      .eq('email', email).maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (data) { lead = data as LeadForSignature; break; }
  }

  if (!lead) return NextResponse.json({ ok: true, action: 'lead_not_found' });

  const nextState = advanceOn('contrato_firmado', lead.estado ?? '');
  const now = new Date().toISOString();

  const { error: updateError } = await db.from('leads').update({
    contrato_firmado_at: now,
    ...(nextState ? { estado: nextState } : {}),
  }).eq('id', lead.id);

  if (updateError) {
    console.error('[webhook/documenso] DB update error:', updateError);
    return NextResponse.json({ error: 'DB update failed' }, { status: 500 });
  }

  // Sin avance no hay correo: la venta ya estaba más adelante y el cliente ya
  // recibió el pedido de pago. Un webhook repetido no vuelve a pedirle plata.
  if (!nextState) {
    return NextResponse.json({ ok: true, action: 'firma_registrada' });
  }

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
      paymentInstructions: process.env.PAYMENT_INSTRUCTIONS
        ?? 'Te paso los datos de transferencia por este mismo medio.',
    }));
  } catch (reason) {
    // La firma ocurrió: no se deshace porque el correo falló. Queda para
    // reintentar desde el panel.
    const detail = reason instanceof Error ? reason.message : String(reason);
    console.warn('[webhook/documenso] El pedido de pago no salió:', detail);
    return NextResponse.json({ ok: true, action: 'firmado_sin_correo', detail });
  }

  return NextResponse.json({ ok: true, action: 'firmado_y_pago_pedido' });
}
