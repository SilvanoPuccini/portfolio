import { NextRequest, NextResponse } from 'next/server';

// La autenticación la resuelve cada route handler (isAuthorized), no acá.
// El middleware solo inyecta el locale y arma la CSP por request.

/**
 * Directivas que no dependen del nonce. `script-src` se arma aparte porque
 * necesita el valor de cada request.
 */
const STATIC_CSP = [
  "default-src 'self'",
  "worker-src 'self' blob:",
  // Los estilos inline son inevitables acá: React inyecta `style` y todo el
  // panel admin está escrito con estilos inline. A diferencia de los scripts,
  // un estilo inyectado no ejecuta código.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://cdn.jsdelivr.net https://cdn.simpleicons.org https://res.cloudinary.com",
  "font-src 'self'",
  // Documenso entra acá porque el contrato se firma embebido: el componente
  // habla con su API desde el navegador del cliente mientras firma.
  "connect-src 'self' https://*.supabase.co https://generativelanguage.googleapis.com https://app.documenso.com",
  "frame-src 'self' https://www.openstreetmap.org https://cal.com https://app.documenso.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
];

const ARCHIVO_DE_COMPROBANTE = /^\/api\/admin\/leads\/[^/]+\/comprobante\/archivo$/;

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // El comprobante que se mira dentro del panel trae su propia política: la
  // del sitio dice `frame-ancestors 'none'` y no dejaría ver un PDF embebido
  // en la ficha. Esa ruta exige sesión de admin y sirve solo imágenes o PDF.
  if (ARCHIVO_DE_COMPROBANTE.test(pathname)) return NextResponse.next();

  // Un nonce por request. Con esto se puede sacar 'unsafe-inline' de
  // script-src: sin sacarlo, la CSP no protege de nada, porque cualquier
  // script inyectado se ejecutaría igual. Next.js lee el nonce del header y
  // se lo pone solo a sus propios scripts; 'strict-dynamic' cubre los chunks
  // que esos scripts cargan después.
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = [`script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`, ...STATIC_CSP].join('; ');

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-nonce', nonce);
  // Next.js necesita verla en el request para propagar el nonce a sus scripts.
  requestHeaders.set('content-security-policy', csp);

  if (pathname.startsWith('/es') || pathname.startsWith('/en')) {
    requestHeaders.set('x-locale', pathname.startsWith('/en') ? 'en' : 'es');
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('content-security-policy', csp);
  return response;
}

export const config = {
  matcher: [
    /*
     * Todo excepto los assets estáticos, que no ejecutan scripts y no
     * necesitan un nonce distinto en cada pedido.
     */
    {
      source: '/((?!_next/static|_next/image|favicon.svg|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|mjs)$).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
