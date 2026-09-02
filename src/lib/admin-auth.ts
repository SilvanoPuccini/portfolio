import { NextRequest } from 'next/server';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

/** Constant-time string comparison (safe against timing attacks) */
function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Max session age: 8 hours (matches cookie maxAge) */
const MAX_SESSION_AGE_MS = 8 * 60 * 60 * 1000;

/**
 * Create a signed session token (never exposes raw secret).
 * Format: nonce:issued:hmac
 */
export function createSessionToken(secret: string): string {
  const nonce = randomBytes(16).toString('hex');
  const issued = Date.now().toString();
  const payload = `${nonce}:${issued}`;
  const sig = createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}:${sig}`;
}

/** Verify a signed session token */
export function verifySessionToken(token: string, secret: string): boolean {
  const parts = token.split(':');
  if (parts.length !== 3) return false;

  const [nonce, issued, sig] = parts;
  if (!nonce || !issued || !sig) return false;

  // Check token age
  const issuedMs = parseInt(issued, 10);
  if (isNaN(issuedMs) || Date.now() - issuedMs > MAX_SESSION_AGE_MS) return false;

  const payload = `${nonce}:${issued}`;
  const expected = createHmac('sha256', secret).update(payload).digest('hex');
  return safeCompare(sig, expected);
}

/**
 * Verifica autenticación admin por dos vías:
 * 1. Cookie `admin_session` — usada por el admin UI (browser)
 * 2. Bearer token en Authorization header — usado por llamadas externas (cron, scripts)
 */
export function isAuthorized(req: NextRequest): boolean {
  // Bearer token (llamadas externas — cron, scripts)
  const apiKey = process.env.ADMIN_API_KEY;
  const bearer = req.headers.get('authorization');
  if (apiKey && bearer) {
    const provided = bearer.replace(/^Bearer\s+/, '');
    if (safeCompare(provided, apiKey)) return true;
  }

  // Cookie de sesión (admin UI) — signed token, NOT the raw secret
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;
  if (!sessionSecret) return false;
  const cookie = req.cookies.get('admin_session')?.value;
  if (!cookie) return false;
  return verifySessionToken(cookie, sessionSecret);
}

/**
 * Verifica el header que Vercel Cron agrega automáticamente
 * (`Authorization: Bearer $CRON_SECRET`) en cada invocación programada.
 */
export function isCronAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  const bearer = req.headers.get('authorization');
  if (!secret || !bearer) return false;
  const provided = bearer.replace(/^Bearer\s+/, '');
  return safeCompare(provided, secret);
}
