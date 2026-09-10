/**
 * Los logos de tecnología, en un solo lugar.
 *
 * Los usan la portada del blog (PostCover) y la imagen que se comparte en las
 * redes (/api/og/[slug]). Con dos copias, una terminaría mostrando cuatro
 * logos y la otra tres.
 *
 * Son SVG en línea y no imágenes de un CDN a propósito: `next/og` renderiza
 * con satori, que no baja imágenes externas de forma confiable, y un logo que
 * no carga deja un hueco en la tarjeta.
 *
 * viewBox 0 0 24 24 y `currentColor`, para que el color lo ponga quien los usa.
 */
export interface TechIcon {
  color: string;
  icon: React.ReactNode;
}

export const TECH_ICONS: Record<string, TechIcon> = {
  React: {
    color: "#61DAFB",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <circle cx="12" cy="12" r="2.4" fill="currentColor" />
        <ellipse cx="12" cy="12" rx="10" ry="3.8" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <ellipse cx="12" cy="12" rx="10" ry="3.8" stroke="currentColor" strokeWidth="1.2" fill="none" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="10" ry="3.8" stroke="currentColor" strokeWidth="1.2" fill="none" transform="rotate(120 12 12)" />
      </svg>
    ),
  },
  TypeScript: {
    color: "#3178C6",
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <rect x="2" y="2" width="20" height="20" rx="3" fill="currentColor" />
        <text x="12" y="16.5" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="white" fontFamily="monospace">TS</text>
      </svg>
    ),
  },
  Angular: {
    color: "#DD0031",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <path d="M12 2L3 6.2l1.4 12.6L12 22l7.6-3.2L21 6.2z" stroke="currentColor" strokeWidth="1.4" fill="none" />
        <path d="M12 6.5L8.2 16h1.7l.8-2h2.6l.8 2h1.7L12 6.5z" fill="currentColor" />
        <path d="M10.3 12.5l1.7-4.5 1.7 4.5h-3.4z" fill="none" stroke="currentColor" strokeWidth="0.8" />
      </svg>
    ),
  },
  "Next.js": {
    color: "#FFFFFF",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.3" fill="none" />
        <path d="M8 16V8l8 9V8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
  },
  Django: {
    color: "#44B78B",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <rect x="3" y="2" width="4" height="14" rx="1" fill="currentColor" />
        <rect x="3" y="18" width="4" height="4" rx="1" fill="currentColor" opacity="0.5" />
        <rect x="9" y="2" width="4" height="8" rx="1" fill="currentColor" />
        <path d="M9 12h4a4 4 0 0 1 0 8H9v-8z" fill="currentColor" />
      </svg>
    ),
  },
  Python: {
    color: "#3776AB",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <path d="M12 2C8.5 2 7 3.5 7 5v2h5v1H5.5C3.5 8 2 9.5 2 12s1.5 4 3.5 4H7v-2.5C7 12 8.5 11 10 11h4c1.5 0 3-1 3-3V5c0-1.5-1.5-3-5-3zm-1 2a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" fill="currentColor" />
        <path d="M12 22c3.5 0 5-1.5 5-3v-2h-5v-1h6.5c2 0 3.5-1.5 3.5-4s-1.5-4-3.5-4H17v2.5C17 12 15.5 13 14 13h-4c-1.5 0-3 1-3 3v3c0 1.5 1.5 3 5 3zm1-2a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" fill="currentColor" />
      </svg>
    ),
  },
  "React + TypeScript": {
    color: "#61DAFB",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <circle cx="12" cy="12" r="2.4" fill="currentColor" />
        <ellipse cx="12" cy="12" rx="10" ry="3.8" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <ellipse cx="12" cy="12" rx="10" ry="3.8" stroke="currentColor" strokeWidth="1.2" fill="none" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="10" ry="3.8" stroke="currentColor" strokeWidth="1.2" fill="none" transform="rotate(120 12 12)" />
      </svg>
    ),
  },
  Vite: {
    color: "#A259FF",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <path d="M2.6 5.4 12 21.8 21.4 5.4 12 7.2 2.6 5.4Z" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
        <path d="M13.6 3.1 9.4 11.3l2.7-.35-.9 4.9 4.1-7.6-2.7.42.99-5.57Z" fill="currentColor" />
      </svg>
    ),
  },
};

/** Separa "React vs Angular / Vite vs Next.js" en filas de nombres. */
export function parseVersus(keyword: string): string[][] {
  return keyword
    .split("/")
    .map((row) => row.split(/\bvs\b/i).map((name) => name.trim()).filter(Boolean))
    .filter((row) => row.length > 0);
}

export const VERSUS_PATTERN = /\bvs\b/i;
