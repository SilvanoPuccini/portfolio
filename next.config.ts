import type { NextConfig } from "next";
import withMdx from '@next/mdx';

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
  // Content Security Policy
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://unpkg.com",
      "worker-src 'self' blob: https://unpkg.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://cdn.jsdelivr.net https://cdn.simpleicons.org https://res.cloudinary.com",
      "font-src 'self'",
      "connect-src 'self' https://*.supabase.co https://generativelanguage.googleapis.com",
      "frame-src https://www.openstreetmap.org",
      "frame-ancestors 'none'",
    ].join('; '),
  },
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
