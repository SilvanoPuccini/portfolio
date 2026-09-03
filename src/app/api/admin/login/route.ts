import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { rateLimit } from '@/lib/rate-limit';
import { createSessionToken } from '@/lib/admin-auth';
import { clearLoginFailures, isLoginBlocked, recordLoginFailure } from '@/lib/auth-throttle';
import { z } from 'zod';

const loginSchema = z.object({ password: z.string().min(1) });

export const dynamic = 'force-dynamic';

function getIp(req: NextRequest) {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
}

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);

  // Primera barrera, barata: 5 intentos por minuto por IP, en memoria. Frena
  // el ruido, pero se esquiva rotando IPs y se resetea al reciclar la lambda.
  if (!rateLimit(`login:${ip}`, 5, 60_000)) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Esperá un minuto.' },
      { status: 429 }
    );
  }

  // Segunda barrera, la que realmente frena una fuerza bruta distribuida:
  // contador global de fallos consecutivos, persistido en la base.
  const throttle = await isLoginBlocked();
  if (throttle.blocked) {
    return NextResponse.json(
      { error: `Demasiados intentos fallidos. Reintentá en ${throttle.retryAfterSeconds}s.` },
      { status: 429, headers: { 'Retry-After': String(throttle.retryAfterSeconds) } },
    );
  }

  let password: string;
  try {
    const parsed = loginSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
    }
    password = parsed.data.password;
  } catch {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || !safeCompare(password, adminPassword)) {
    await recordLoginFailure();
    return NextResponse.json({ error: 'Contraseña incorrecta.' }, { status: 401 });
  }

  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    console.error('[login] ADMIN_SESSION_SECRET not configured');
    return NextResponse.json({ error: 'Error de configuración.' }, { status: 500 });
  }

  await clearLoginFailures();

  const token = createSessionToken(secret);
  const response = NextResponse.json({ success: true });
  response.cookies.set('admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 8, // 8 horas
    path: '/',
  });
  return response;
}
