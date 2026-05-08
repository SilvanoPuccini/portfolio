import { NextRequest } from 'next/server';

/**
 * Verifica autenticación admin por dos vías:
 * 1. Cookie `admin_session` — usada por el admin UI (browser)
 * 2. Bearer token en Authorization header — usado por llamadas externas (cron, scripts)
 */
export function isAuthorized(req: NextRequest): boolean {
  // Bearer token (llamadas externas — cron, scripts)
  const apiKey = process.env.ADMIN_API_KEY;
  const bearer = req.headers.get('authorization');
  if (apiKey && bearer === `Bearer ${apiKey}`) return true;

  // Cookie de sesión (admin UI)
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;
  if (!sessionSecret) return false;
  const cookie = req.cookies.get('admin_session')?.value;
  return cookie === sessionSecret;
}
