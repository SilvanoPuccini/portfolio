import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase';
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
    .from('leads').select('estado').eq('email', email).maybeSingle();

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

  return NextResponse.json({ ok: true, action });
}
