import crypto from 'crypto';

const EXPIRY_MS = 365 * 24 * 60 * 60 * 1000; // 1 año

function hmac(email: string, exp: number): string {
  const secret = process.env.NOTIFY_SECRET;
  if (!secret) throw new Error('NOTIFY_SECRET not configured');
  return crypto
    .createHmac('sha256', secret)
    .update(`${email.toLowerCase()}:${exp}`)
    .digest('hex');
}

export function generateUnsubToken(email: string): { token: string; exp: number } {
  const exp = Date.now() + EXPIRY_MS;
  return { token: hmac(email, exp), exp };
}

export function verifyUnsubToken(email: string, token: string, exp: number): boolean {
  try {
    if (Date.now() > exp) return false;
    const expected = hmac(email, exp);
    const a = Buffer.from(token, 'hex');
    const b = Buffer.from(expected, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
