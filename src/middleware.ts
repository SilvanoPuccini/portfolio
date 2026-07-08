import { NextRequest, NextResponse } from 'next/server';

// Auth is handled by each API route handler individually (isAuthorized).
// Middleware runs in Edge Runtime which doesn't support Node.js 'crypto',
// so we only handle locale injection here.

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Locale header injection for /(es|en)/:path* routes
  if (pathname.startsWith('/es') || pathname.startsWith('/en')) {
    const locale = pathname.startsWith('/en') ? 'en' : 'es';
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-locale', locale);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/(es|en)/:path*'],
};
