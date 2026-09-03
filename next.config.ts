import type { NextConfig } from "next";
import withMdx from '@next/mdx';

// La Content-Security-Policy NO vive acá: la arma el middleware, porque
// necesita un nonce distinto en cada request. Un header estático obligaría a
// 'unsafe-inline' para que funcionen los scripts propios de Next, y con
// 'unsafe-inline' la política no impide nada.
const securityHeaders = [
  // Previene clickjacking — la página no puede cargarse en un iframe
  { key: 'X-Frame-Options', value: 'DENY' },
  // Previene MIME sniffing — el browser respeta el Content-Type declarado
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Controla qué info de referencia se envía en requests externos
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Deshabilita features del browser que no se usan
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  // Fuerza HTTPS por 2 años, incluye subdominios
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfjs-dist", "puppeteer-core", "@sparticuz/chromium"],
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
  allowedDevOrigins: ["127.0.0.1"],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
  images: {
    dangerouslyAllowSVG: true,
    // Previene XSS desde SVGs externos — sin esto dangerouslyAllowSVG es un riesgo real
    contentSecurityPolicy: "default-src 'none'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.jsdelivr.net",
      },
      {
        protocol: "https",
        hostname: "cdn.simpleicons.org",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  reactStrictMode: true,
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'mdx'],
};

export default withMdx()(nextConfig);
