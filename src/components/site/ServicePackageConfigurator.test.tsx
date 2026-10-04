import { fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { PUBLIC_SERVICIOS, servicioPorSlug } from '@/content/servicios';
import ServicePackageConfigurator from './ServicePackageConfigurator';

const web = servicioPorSlug('web')!;
afterEach(() => vi.unstubAllGlobals());

it('shows three fixed packages with one Buy button each and no inline demo or extras', () => {
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  render(<ServicePackageConfigurator locale="es" servicio={web} />);
  expect(screen.getAllByRole('button', { name: /Comprar/ })).toHaveLength(3);
  expect(screen.getByText('USD 450')).toBeInTheDocument();
  expect(screen.getByText('USD 790')).toBeInTheDocument();
  expect(screen.getByText('USD 1.090')).toBeInTheDocument();
  expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  expect(fetchMock).not.toHaveBeenCalled();
});

it('Buy opens one qualification panel and never silently answers required questions', () => {
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  render(<ServicePackageConfigurator locale="es" servicio={web} />);
  fireEvent.click(screen.getByRole('button', { name: 'Comprar Landing' }));
  expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled();
  expect(screen.getAllByRole('radio').every((radio) => !(radio as HTMLInputElement).checked)).toBe(true);
  expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Comprar Web de cinco/ }));
  expect(screen.getAllByRole('button', { name: 'Continuar' })).toHaveLength(1);
  expect(fetchMock).not.toHaveBeenCalled();
});

it('preserves the safe order flow with actual qualification and no optional extras', async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) });
  vi.stubGlobal('fetch', fetchMock);
  render(<ServicePackageConfigurator locale="es" servicio={web} />);
  fireEvent.click(screen.getByRole('button', { name: 'Comprar Landing' }));
  const pkg = web.paquetes[0];
  const answers: Record<string, string> = {};
  for (const question of pkg.calificacion) {
    const answer = question.opciones.find((option) => option.califica)!;
    answers[question.id] = answer.valor;
    fireEvent.click(screen.getByRole('radio', { name: answer.label.es }));
  }
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
  expect(fetchMock.mock.calls[0][0]).toBe('/api/pedido');
  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ paquete: pkg.slug, extras: [], locale: 'es', calificacion: answers });
  expect(await screen.findByRole('alert')).toBeInTheDocument();
});

it('keeps out-of-scope answers on the existing consultation route', () => {
  render(<ServicePackageConfigurator locale="es" servicio={web} />);
  fireEvent.click(screen.getByRole('button', { name: 'Comprar Landing' }));
  const outside = web.paquetes[0].calificacion[0].opciones.find((option) => !option.califica)!;
  fireEvent.click(screen.getByRole('radio', { name: outside.label.es }));
  expect(screen.queryByRole('button', { name: 'Continuar' })).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Agendar/ })).toBeInTheDocument();
});

it('shows material costs before purchase and keeps full scope collapsed', () => {
  render(<ServicePackageConfigurator locale="en" servicio={web} />);
  expect(screen.getAllByText(/USD 40 every 3 months/).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/USD 60 per month/).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/USD 90 per month/).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/^Initial hosting and warranty/).length).toBe(3);
  expect(screen.getAllByText(/Annual domain/).length).toBe(3);
  for (const summary of screen.getAllByText('Scope and terms')) expect(summary.closest('details')).not.toHaveAttribute('open');
});

it('uses the compact configurator for automation while preserving mandatory extras', () => {
  render(<ServicePackageConfigurator locale="es" servicio={servicioPorSlug('automatizacion')!} />);
  const group = screen.getByRole('group', { name: /Paquetes de Automatización/ });
  fireEvent.click(within(group).getByRole('button', { name: /Comprar Una automatización/ }));
  expect(screen.getByRole('checkbox', { name: /Plan de automatización/ })).toBeChecked();
  expect(screen.getByRole('checkbox', { name: /Plan de automatización/ })).toBeDisabled();
  expect(screen.getByRole('button', { name: /Continuar/ })).toBeInTheDocument();
});

it.each(PUBLIC_SERVICIOS.filter((service) => service.paquetes.length > 0))('renders only the real %s package actions without an automatic order', (service) => {
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  render(<ServicePackageConfigurator locale="es" servicio={service} />);
  for (const pkg of service.paquetes) {
    const card = screen.getByRole('heading', { name: pkg.nombre.es }).closest('article')!;
    if (pkg.precioUsd === null || pkg.recurrente) {
      expect(within(card).getByRole('link', { name: 'Solicitar cotización' })).toHaveAttribute('href', `/es/services/agendar?service=${service.slug}&paquete=${pkg.slug}`);
    } else {
      expect(screen.getByRole('button', { name: `Comprar ${pkg.nombre.es}` })).toBeInTheDocument();
    }
  }
  expect(fetchMock).not.toHaveBeenCalled();
});
