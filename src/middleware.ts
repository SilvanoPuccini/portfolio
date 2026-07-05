import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/admin-auth';

// Endpoints públicos dentro de /api/admin — no requieren sesión
const PUBLIC_ADMIN_PATHS = [
  '/api/admin/login',
  '/api/admin/session',
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Locale header injection for /(es|en)/:path* routes
  if (pathname.startsWith('/es') || pathname.startsWith('/en')) {
    const locale = pathname.startsWith('/en') ? 'en' : 'es';
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-locale', locale);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Solo protegemos rutas de API admin
  if (!pathname.startsWith('/api/admin')) {
    return NextResponse.next();
  }

  // Permitir endpoints públicos
  if (PUBLIC_ADMIN_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // Validar auth (timing-safe, supports cookie + bearer)
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/admin/:path*', '/(es|en)/:path*'],
};
