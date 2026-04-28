import { NextRequest } from 'next/server';

/**
 * Verifica autenticación admin por dos vías:
 * 1. Cookie `admin_session` — usada por el admin UI (browser)
 * 2. Bearer token en Authorization header — usado por llamadas externas (cron, scripts)
 */
export function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.NOTIFY_SECRET;
  if (!secret) return false;

  // Bearer token (llamadas externas)
  const bearer = req.headers.get('authorization');
  if (bearer === `Bearer ${secret}`) return true;

  // Cookie de sesión (admin UI)
  const cookie = req.cookies.get('admin_session')?.value;
  return cookie === secret;
}
