import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

type CalWebhookPayload = {
  triggerEvent: string;
  payload: {
    startTime?: string;
    attendees?: { email: string }[];
  };
};

function verifySignature(body: string, signature: string | null): boolean {
  const secret = process.env.CALCOM_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac('sha256', secret).update(body).digest('hex');
  return signature === expected;
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

  type UpdateData = { estado?: string; fecha_llamada?: string | null };
  let updates: UpdateData | null = null;
  let action = 'ignored';

  switch (event.triggerEvent) {
    case 'BOOKING_CREATED': {
      const fecha = event.payload.startTime ?? new Date().toISOString();
      updates = { estado: 'llamada_agendada', fecha_llamada: fecha };
      action = 'llamada_agendada';
      break;
    }
    case 'BOOKING_RESCHEDULED': {
      const fecha = event.payload.startTime ?? new Date().toISOString();
      updates = { fecha_llamada: fecha };
      action = 'rescheduled';
      break;
    }
    case 'BOOKING_CANCELLED':
    case 'BOOKING_REJECTED': {
      updates = { estado: 'nuevo', fecha_llamada: null };
      action = 'reverted_to_nuevo';
      break;
    }
    case 'BOOKING_NO_SHOW': {
      updates = { estado: 'no_show' };
      action = 'no_show';
      break;
    }
    case 'MEETING_ENDED': {
      updates = { estado: 'en conversación' };
      action = 'en_conversacion';
      break;
    }
  }

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
