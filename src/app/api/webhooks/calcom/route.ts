import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase';
import { sendCrmEmail } from '@/lib/resend';
import { llamadaAgendadaHtml } from '@/lib/email-templates/llamada-agendada';
import { asegurarCuestionario } from '@/lib/leads/cuestionario';
import { clienteUrl } from '@/lib/leads/client-stage';
import { planQuestionnaire } from '@/lib/leads/questionnaire-plan';
import { calcomEventOutcome } from '@/lib/leads/calcom-events';
import { fetchTranscript, transcriptLink } from '@/lib/leads/calcom-transcript';

export const dynamic = 'force-dynamic';

type CalWebhookPayload = {
  triggerEvent: string;
  payload: {
    startTime?: string;
    attendees?: { email: string; noShow?: boolean }[];
    downloadLink?: string;
    transcription?: { text?: string }[];
    downloadLinks?: { transcription?: { format?: string; link?: string }[] };
    metadata?: Record<string, unknown>;
    responses?: Record<string, { value: string }>;
  };
};

function verifySignature(body: string, signature: string | null): boolean {
  const secret = process.env.CALCOM_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac('sha256', secret).update(body).digest('hex');
  const bufSig = Buffer.from(signature);
  const bufExp = Buffer.from(expected);
  if (bufSig.length !== bufExp.length) return false;
  return timingSafeEqual(bufSig, bufExp);
}

interface LeadAgendado {
  id: string;
  nombre: string | null;
  lead_token: string | null;
  presupuesto_rango: string | null;
  plazo: string | null;
  problema: string | null;
  que_construir: string | null;
  service: string | null;
  service_data: Record<string, unknown> | null;
  guia_respuestas: unknown;
}

/** «jueves 25 de septiembre, 15:00 h» — en la hora del cliente no la sabemos. */
function cuandoEs(iso: string | null): string {
  if (!iso) return 'Te confirmo el horario por este medio';

  return new Date(iso).toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    weekday: 'long', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).replace(',', ',') + ' h (hora de Argentina)';
}

/**
 * El correo de la llamada agendada.
 *
 * Que falle no puede deshacer la reserva: la reunión ya existe en el
 * calendario y el lead ya se movió.
 */
async function avisarLlamadaAgendada(
  lead: LeadAgendado,
  email: string,
  startTime: string | null,
) {
  if (!lead?.id) return;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://silvanopuccini.dev';
  const token = await asegurarCuestionario(lead.id);

  // Las preguntas son las que a ESTE cliente le faltan, no una lista fija.
  const faltan = token ? planQuestionnaire(lead).length : 0;

  try {
    await sendCrmEmail(
      email,
      'Tu llamada quedó agendada',
      llamadaAgendadaHtml({
        nombre: lead.nombre?.split(' ')[0] ?? 'Hola',
        cuando: cuandoEs(startTime),
        url: clienteUrl(siteUrl, lead.lead_token, `${siteUrl}/questionnaire/${token ?? ''}`),
        preguntas: faltan,
      }),
    );
  } catch (reason) {
    console.warn('[webhook/calcom] El correo de la llamada no salió:', reason);
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-cal-signature-256');

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: CalWebhookPayload;
  try {
    event = JSON.parse(rawBody) as CalWebhookPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const email = event.payload?.attendees?.[0]?.email;
  if (!email) {
    return NextResponse.json({ error: 'No attendee email' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // La etapa del lead decide qué puede cambiar este aviso: una reunión con
  // alguien que ya firmó no es la llamada de venta. Ver calcom-events.ts.
  const { data: lead, error: readError } = await supabase
    .from('leads')
    .select('id, estado, nombre, lead_token, presupuesto_rango, plazo, problema, que_construir, service, service_data, guia_respuestas')
    .eq('email', email)
    .maybeSingle();

  if (readError) {
    console.error(`[webhook/calcom] ${event.triggerEvent} read error:`, readError);
    return NextResponse.json({ error: 'DB read failed' }, { status: 500 });
  }
  if (!lead) return NextResponse.json({ ok: true, action: 'lead_not_found' });

  // La transcripción llega como links de descarga, no como texto: se baja el
  // .txt antes de decidir, porque es lo que el panel guarda y lee la IA.
  const payload = event.payload;
  if (event.triggerEvent === 'RECORDING_TRANSCRIPTION_GENERATED' && !payload.transcription) {
    const link = transcriptLink(payload);
    const text = link ? await fetchTranscript(link) : null;
    if (text) payload.transcription = [{ text }];
  }

  const { updates, action } = calcomEventOutcome(event.triggerEvent, lead.estado ?? '', payload);

  if (!updates) {
    return NextResponse.json({ ok: true, action });
  }

  const { error } = await supabase
    .from('leads')
    .update(updates)
    .eq('email', email);

  if (error) {
    console.error(`[webhook/calcom] ${event.triggerEvent} error:`, error);
    return NextResponse.json({ error: 'DB update failed' }, { status: 500 });
  }

  // Un solo correo al agendar: confirma la reunión y lleva a las preguntas.
  // Antes eran dos, y el de las preguntas había que dispararlo a mano desde
  // el panel; el que se olvidaba llegaba a la llamada sin saber nada.
  if (action === 'llamada_agendada') {
    await avisarLlamadaAgendada(lead as LeadAgendado, email, payload.startTime ?? null);
  }

  return NextResponse.json({ ok: true, action });
}
