import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const MAX_NAME    = 100;
const MAX_EMAIL   = 254;
const MAX_SUBJECT = 200;
const MAX_MESSAGE = 5000;

function getIp(req: NextRequest) {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
}

export async function POST(req: NextRequest) {
  try {
    const ip = getIp(req);
    if (!rateLimit(`contact:${ip}`, 3, 60_000)) {
      return NextResponse.json(
        { error: 'Demasiados mensajes. Esperá un momento y volvé a intentar.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { name, email, subject, message } = body as {
      name: string;
      email: string;
      subject: string;
      message: string;
    };

    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Todos los campos son requeridos.' }, { status: 400 });
    }

    if (
      name.trim().length > MAX_NAME ||
      email.trim().length > MAX_EMAIL ||
      subject.trim().length > MAX_SUBJECT ||
      message.trim().length > MAX_MESSAGE
    ) {
      return NextResponse.json({ error: 'Un campo excede el largo máximo permitido.' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email inválido.' }, { status: 400 });
    }

    const { error: dbError } = await getSupabaseAdmin()
      .from('contact_messages')
      .insert({ name: name.trim(), email: email.trim().toLowerCase(), subject: subject.trim(), message: message.trim() });

    if (dbError) {
      console.error('[contact] Supabase error:', dbError);
      return NextResponse.json({ error: 'No se pudo guardar el mensaje. Intentá de nuevo o escribime directo por email.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[contact] Unexpected error:', err);
    return NextResponse.json({ error: 'Error inesperado.' }, { status: 500 });
  }
}
