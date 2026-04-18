import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { sendWelcomeEmail } from '@/lib/resend';
import { rateLimit } from '@/lib/rate-limit';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

export async function POST(req: NextRequest) {
  try {
    const ip = getIp(req);

    if (!rateLimit(ip, 5, 60_000)) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Esperá un minuto y volvé a intentar.' },
        { status: 429 }
      );
    }

    const body = await req.json();

    // Honeypot: bots llenan campos ocultos, humanos no
    if (body?.website) {
      return NextResponse.json({ success: true });
    }

    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Email inválido.' },
        { status: 400 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const audienceId = process.env.RESEND_AUDIENCE_ID;

    // Guardar en Resend Audiences
    if (audienceId) {
      const { error: contactError } = await resend.contacts.create({
        email,
        audienceId,
        unsubscribed: false,
      });

      // Si el contacto ya existe, avisamos sin mandar el welcome de nuevo
      if (contactError) {
        const isDuplicate = contactError.name === 'validation_error' ||
          contactError.message?.toLowerCase().includes('already exists');

        if (isDuplicate) {
          return NextResponse.json(
            { error: 'Este email ya está suscrito.' },
            { status: 409 }
          );
        }

        console.error('[subscribe] Resend contacts error:', contactError);
      }
    }

    // Mandar email de bienvenida
    const { error } = await sendWelcomeEmail(email);

    if (error) {
      console.error('[subscribe] Resend email error:', error);
      return NextResponse.json(
        { error: 'No pudimos enviarte el email. Intentá de nuevo.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[subscribe] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Error inesperado. Intentá de nuevo.' },
      { status: 500 }
    );
  }
}
