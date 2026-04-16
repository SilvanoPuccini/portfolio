import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/resend';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Email inválido.' },
        { status: 400 }
      );
    }

    const { error } = await sendWelcomeEmail(email);

    if (error) {
      console.error('[subscribe] Resend error:', error);
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
