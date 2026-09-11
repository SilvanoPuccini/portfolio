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

  it('usa monospace (JetBrains Mono) en el cover', () => {
    const html = buildEmail(baseOpts());
    expect(html).toContain("'JetBrains Mono',monospace");
    expect(html).not.toContain("'Georgia','Times New Roman',serif");
  });

  it('muestra la fecha arriba y el botón como bloque debajo', () => {
    const html = buildEmail(baseOpts());
    expect(html).toContain('min');
    expect(html).toContain('Ago');
    expect(html).toContain('Leer el post completo');
    expect(html).toContain('display:block');
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
