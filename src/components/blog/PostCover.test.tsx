import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PostCover } from './PostCover';

describe('PostCover', () => {
  it('shows every tool of a comparison, not just the first one', () => {
    // Un post que compara cuatro herramientas con el logo de una sola
    // desorienta: el lector cree que el post es sobre esa.
    const { container } = render(
      <PostCover title="Next.js, React con Vite o Angular" category="Criterio"
        keyword="React vs Angular / Vite vs Next.js" />,
    );

    expect(container.querySelectorAll('svg[viewBox="0 0 24 24"]')).toHaveLength(4);
    expect(screen.getAllByText('vs')).toHaveLength(2);
  });

  it('falls back to plain text for a tool it has no logo for', () => {
    render(<PostCover title="Algo" category="Criterio" keyword="React vs Svelte" />);
    expect(screen.getByText('Svelte')).toBeInTheDocument();
  });

  it('keeps the single-logo cover for a post about one tool', () => {
    const { container } = render(<PostCover title="Django" category="Criterio" keyword="Django" />);
    expect(container.querySelectorAll('svg[viewBox="0 0 24 24"]')).toHaveLength(1);
    expect(screen.queryByText('vs')).not.toBeInTheDocument();
  });
});

describe('los iconos compartidos', () => {
  it('los usa la misma tabla que la imagen social, para que no se desincronicen', async () => {
    const { TECH_ICONS, parseVersus, VERSUS_PATTERN } = await import('./tech-icons');

    // Los cuatro del post del domingo tienen que existir en la tabla: si
    // faltara uno, la portada mostraría tres logos y un nombre suelto.
    for (const name of ['React', 'Angular', 'Vite', 'Next.js']) {
      expect(TECH_ICONS[name], `falta el logo de ${name}`).toBeTruthy();
    }

    expect(VERSUS_PATTERN.test('React vs Angular / Vite vs Next.js')).toBe(true);
    expect(parseVersus('React vs Angular / Vite vs Next.js')).toEqual([
      ['React', 'Angular'],
      ['Vite', 'Next.js'],
    ]);
    // Un keyword común no activa la comparación.
    expect(VERSUS_PATTERN.test('Django')).toBe(false);
  });
});
