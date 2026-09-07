/**
 * Logos oficiales y paleta compartida por los diagramas del blog.
 *
 * Los SVG salen de devicon por CDN (los dominios ya están habilitados en
 * next.config.ts). Los logos monocromos oscuros necesitan invert para
 * leerse sobre el fondo navy del sitio.
 */

import Image from 'next/image';

export const INK = '#eef2f5';
export const MUTED = '#8b94a3';
export const LINE = '#1e2937';
export const PANEL = '#0c1219';
export const ACCENT = '#22d3d3';
export const CARD = '#0a0e14';

const DEVICON = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons';

export type Logo = { src: string; alt: string; invert?: boolean };

export const LOGOS = {
  react: { src: `${DEVICON}/react/react-original.svg`, alt: 'React' },
  vite: { src: `${DEVICON}/vitejs/vitejs-original.svg`, alt: 'Vite' },
  next: { src: `${DEVICON}/nextjs/nextjs-original.svg`, alt: 'Next.js', invert: true },
  angular: { src: `${DEVICON}/angularjs/angularjs-original.svg`, alt: 'Angular' },
  ts: { src: `${DEVICON}/typescript/typescript-original.svg`, alt: 'TypeScript' },
  django: { src: `${DEVICON}/django/django-plain.svg`, alt: 'Django', invert: true },
  python: { src: `${DEVICON}/python/python-original.svg`, alt: 'Python' },
  node: { src: `${DEVICON}/nodejs/nodejs-original.svg`, alt: 'Node.js' },
  go: { src: `${DEVICON}/go/go-original-wordmark.svg`, alt: 'Go' },
  postgres: { src: `${DEVICON}/postgresql/postgresql-original.svg`, alt: 'PostgreSQL' },
  docker: { src: `${DEVICON}/docker/docker-original.svg`, alt: 'Docker' },
  vercel: { src: `${DEVICON}/vercel/vercel-original.svg`, alt: 'Vercel', invert: true },
  supabase: { src: `${DEVICON}/supabase/supabase-original.svg`, alt: 'Supabase' },
} satisfies Record<string, Logo>;

/** Alto fijo, ancho automático: un logo deformado se nota más que uno chico. */
export function TechLogo({ logo, size = 30 }: { logo: Logo; size?: number }) {
  return (
    <Image
      src={logo.src}
      alt={logo.alt}
      width={size}
      height={size}
      unoptimized
      style={{
        height: `${size}px`,
        width: 'auto',
        display: 'block',
        filter: logo.invert ? 'invert(1)' : undefined,
      }}
    />
  );
}
