import { NextRequest, NextResponse } from 'next/server';

// Endpoints públicos dentro de /api/admin — no requieren sesión
const PUBLIC_ADMIN_PATHS = [
  '/api/admin/login',
  '/api/admin/logout',
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

  // Validar cookie de sesión
  const session = req.cookies.get('admin_session')?.value;
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!session || !secret || session !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/admin/:path*'],
};
