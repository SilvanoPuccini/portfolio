import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import PackageBanner from './PackageBanner';
import { PACKAGES, type FixedPackage } from '@/content/packages';

const live: FixedPackage = {
  ...PACKAGES[0],
  active: true,
  documensoTemplateId: 42,
  directLink: 'https://app.documenso.com/d/abc123',
};

describe('PackageBanner', () => {
  it('sin paquetes activos no muestra nada', () => {
    const { container } = render(<PackageBanner locale="es" packages={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('muestra precio cerrado, plazo y qué incluye', () => {
    render(<PackageBanner locale="es" packages={[live]} />);

    expect(screen.getByRole('heading', { name: live.name.es })).toBeTruthy();
    expect(screen.getByText('USD 250')).toBeTruthy();
    expect(screen.getByText(/5 días hábiles/i)).toBeTruthy();
    expect(screen.getByText(live.includes.es[0])).toBeTruthy();
  });

  it('el botón lleva a firmar en Documenso, en otra pestaña', () => {
    render(<PackageBanner locale="es" packages={[live]} />);

    const cta = screen.getByRole('link', { name: /contratar/i });
    expect(cta.getAttribute('href')).toBe('https://app.documenso.com/d/abc123');
    expect(cta.getAttribute('target')).toBe('_blank');
    expect(cta.getAttribute('rel')).toContain('noopener');
  });

  it('está en inglés para /en', () => {
    render(<PackageBanner locale="en" packages={[live]} />);

    expect(screen.getByRole('heading', { name: live.name.en })).toBeTruthy();
    expect(screen.getByText(/5 business days/i)).toBeTruthy();
    expect(screen.getByRole('link', { name: /get it/i })).toBeTruthy();
  });
});
