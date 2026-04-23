import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

function getIp(req: NextRequest) {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);

  // Rate limit: 5 intentos por minuto por IP
  if (!rateLimit(`login:${ip}`, 5, 60_000)) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Esperá un minuto.' },
      { status: 429 }
    );
  }

  let password: string;
  try {
    const body = await req.json() as { password?: unknown };
    password = typeof body.password === 'string' ? body.password : '';
  } catch {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
  }

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Contraseña incorrecta.' }, { status: 401 });
  }

  const secret = process.env.NOTIFY_SECRET;
  if (!secret) {
    console.error('[login] NOTIFY_SECRET not configured');
    return NextResponse.json({ error: 'Error de configuración.' }, { status: 500 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set('admin_session', secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 8, // 8 horas
    path: '/',
  });
  return response;
}
