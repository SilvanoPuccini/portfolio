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

  it('tiene los divs balanceados (el footer va dentro del contenedor)', () => {
    const html = buildEmail(baseOpts());
    const opens = (html.match(/<div[\s>]/g) || []).length;
    const closes = (html.match(/<\/div>/g) || []).length;
    expect(closes).toBe(opens);
    expect(html.indexOf('FOOTER')).toBeGreaterThan(html.indexOf('CONTENT'));
    expect(html).toContain('color-scheme');
  });

  it('el texto es sólido sin opacidades en el color de letra', () => {
    const html = buildEmail(baseOpts());
    // Los únicos rgba son bordes/fondos, no colores de texto
    const textMatches = html.match(/color:rgba\([^)]+\)/g) || [];
    expect(textMatches).toEqual([]);
  });

  it('el keyword del cover es oscuro sobre fondo brillante (legible siempre)', () => {
    const html = buildEmail(baseOpts({ keyword: 'React' }));
    expect(html).toContain('REACT');
    expect(html).toContain('color:#050810');
  });

  it('muestra el keyword versus como texto', () => {
    const html = buildEmail(baseOpts({ keyword: 'React vs Angular / Vite vs Next.js' }));
    expect(html).toContain('<span style="white-space:nowrap;">REACT VS ANGULAR</span>');
    expect(html).toContain('<span style="white-space:nowrap;">VITE VS NEXT.JS</span>');
  });

  it('el versus no corta palabras: cada comparativa va en nowrap', () => {
    const html = buildEmail(baseOpts({ keyword: 'Django vs Node.js / Go vs Rust' }));
    expect(html).toContain('<span style="white-space:nowrap;">DJANGO VS NODE.JS</span>');
    expect(html).toContain('<span style="white-space:nowrap;">GO VS RUST</span>');
  });

  it('usa el color de la categoría en pill y borde', () => {
    const html = buildEmail(baseOpts({ category: 'Automatización' }));
    expect(html).toContain('#fbbf24');
  });
});
