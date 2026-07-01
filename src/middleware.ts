import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/admin-auth';

// Endpoints públicos dentro de /api/admin — no requieren sesión
const PUBLIC_ADMIN_PATHS = [
  '/api/admin/login',
  '/api/admin/session',
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

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
  matcher: ['/api/admin/:path*'],
};
