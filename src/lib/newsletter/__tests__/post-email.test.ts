import { describe, expect, it } from 'vitest';
import { buildEmail } from '@/lib/newsletter/send-post-newsletter';

function baseOpts(overrides: Record<string, string> = {}) {
  return {
    title: 'Título de prueba',
    excerpt: 'Resumen de prueba.',
    category: 'Criterio',
    issue: '08',
    readingTime: '7 min',
    date: 'Ago 2026',
    postUrl: 'https://silvanopuccini.dev/es/blog/prueba',
    unsubUrl: 'https://silvanopuccini.dev/unsubscribe?email=a@b.c',
    keyword: 'Arquitectura',
    ...overrides,
  };
}

describe('buildEmail', () => {
  it('muestra el eyebrow centrado sin línea de keyword repetida', () => {
    const html = buildEmail(baseOpts());
    expect(html).toContain('Nuevo post');
    expect(html).toContain('Nº 08');
  });

  it('no incluye imágenes ni fondos que Gmail elimina (cero botón de descarga)', () => {
    const html = buildEmail(baseOpts());
    expect(html).not.toContain('<img');
    expect(html).not.toContain('radial-gradient');
    expect(html).not.toContain('background-image');
  });

  it('usa un solo font (Inter) en todo el template', () => {
    const html = buildEmail(baseOpts());
    expect(html).toContain('Inter,sans-serif');
    expect(html).not.toContain('Space Grotesk');
    expect(html).not.toContain('JetBrains Mono');
    expect(html).not.toContain('Georgia');
  });

  it('el texto es sólido sin opacidades en el color de letra', () => {
    const html = buildEmail(baseOpts());
    // Los únicos rgba son bordes/fondos, no colores de texto
    const textMatches = html.match(/color:rgba\([^)]+\)/g) || [];
    expect(textMatches).toEqual([]);
  });

  it('pinta el keyword tech con su color', () => {
    const html = buildEmail(baseOpts({ keyword: 'React' }));
    expect(html).toContain('#61DAFB');
    expect(html).toContain('REACT');
  });

  it('muestra el keyword versus como texto', () => {
    const html = buildEmail(baseOpts({ keyword: 'React vs Angular / Vite vs Next.js' }));
    expect(html).toContain('REACT VS ANGULAR / VITE VS NEXT.JS');
  });

  it('usa el color de la categoría en pill y borde', () => {
    const html = buildEmail(baseOpts({ category: 'Automatización' }));
    expect(html).toContain('#fbbf24');
  });
});
