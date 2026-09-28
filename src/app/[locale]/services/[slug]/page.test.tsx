import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => { throw new Error('NEXT_NOT_FOUND'); }),
  redirect: vi.fn(() => { throw new Error('NEXT_REDIRECT'); }),
}));

import { redirect } from 'next/navigation';
import ServicioPage from './page';
import { servicioPorSlug } from '@/content/servicios';

const render_ = async (slug: string, locale = 'es') =>
  render(await ServicioPage({ params: Promise.resolve({ locale, slug }) }));

describe('la ficha de un servicio', () => {
  it('shows a compact product header without the inline demo or promotional sections', async () => {
    await render_('web');
    expect(screen.getByRole('heading', { level: 1, name: 'Una web para tu negocio' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Comprar/ })).toHaveLength(3);
    expect(screen.queryByText(/Bruma/)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Ver ejemplo|Explorar/ })).not.toBeInTheDocument();
  });

  it('muestra los paquetes de ese servicio y ninguno de otro', async () => {
    await render_('web');
    expect(screen.getByText('Web de cinco secciones')).toBeInTheDocument();
    expect(screen.queryByText('Catálogo con cobro')).toBeNull();
  });

  it('un servicio sin paquetes explica por qué se cotiza y ofrece agendar', async () => {
    await render_('sistema');
    const servicio = servicioPorSlug('sistema')!;
    expect(screen.getByText(servicio.porQueNoTienePrecio!.es)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /agendar/i }).length).toBeGreaterThan(0);
  });

  it('dice a dónde ir si este servicio no es el que necesita', async () => {
    await render_('web');
    const servicio = servicioPorSlug('web')!;
    expect(screen.getByRole('link', { name: new RegExp(servicio.derivaciones[0].caso.es) })).toBeInTheDocument();
  });

  it('en inglés se lee en inglés', async () => {
    await render_('web', 'en');
    expect(screen.getByRole('heading', { name: 'A website for your business' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Buy/ })).toHaveLength(3);
  });

  it('un slug viejo redirige al nuevo en vez de romper los links publicados', async () => {
    await expect(render_('automation-ai')).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/es/services/automatizacion');
  });

  it('un slug inventado es 404', async () => {
    await expect(render_('no-existe')).rejects.toThrow('NEXT_NOT_FOUND');
  });
});
