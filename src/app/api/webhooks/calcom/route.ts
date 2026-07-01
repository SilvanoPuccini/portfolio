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

  if (event.triggerEvent === 'BOOKING_CREATED') {
    const fechaLlamada = event.payload.startTime ?? new Date().toISOString();

    const { error } = await supabase
      .from('leads')
      .update({ estado: 'llamada_agendada', fecha_llamada: fechaLlamada })
      .eq('email', email);

    if (error) {
      console.error('[webhook/calcom] BOOKING_CREATED update error:', error);
      return NextResponse.json({ error: 'DB update failed' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, action: 'llamada_agendada' });
  }

  if (event.triggerEvent === 'BOOKING_CANCELLED') {
    const { error } = await supabase
      .from('leads')
      .update({ estado: 'nuevo', fecha_llamada: null })
      .eq('email', email);

    if (error) {
      console.error('[webhook/calcom] BOOKING_CANCELLED update error:', error);
      return NextResponse.json({ error: 'DB update failed' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, action: 'reverted_to_nuevo' });
  }

  return NextResponse.json({ ok: true, action: 'ignored' });
}
