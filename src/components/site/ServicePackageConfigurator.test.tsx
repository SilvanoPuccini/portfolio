import { fireEvent, render, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { servicioPorSlug } from '@/content/servicios';
import ServicePackageConfigurator from './ServicePackageConfigurator';

const web = servicioPorSlug('web')!;

it('keeps recommendation separate from selection and renders only one checkout', () => {
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  render(<ServicePackageConfigurator locale="es" servicio={web} />);
  expect(screen.queryByRole('button', { name: /Contratar y firmar/ })).not.toBeInTheDocument();
  const group = screen.getByRole('group', { name: /Elegí un paquete/ });
  const recommended = within(group).getByRole('button', { name: /Web de cinco secciones/ });
  expect(recommended).toHaveTextContent('Recomendado');
  const landing = within(group).getByRole('button', { name: /Landing/ });
  fireEvent.click(landing);
  expect(landing).toHaveAttribute('aria-pressed', 'true');
  expect(recommended).toHaveTextContent('Recomendado');
  expect(screen.getAllByRole('button', { name: /Contratar y firmar/ })).toHaveLength(1);
  expect(fetchMock).not.toHaveBeenCalled();
  fireEvent.click(recommended);
  expect(recommended).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getAllByRole('button', { name: /Contratar y firmar/ })).toHaveLength(1);
  expect(fetchMock).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
});

it('identifies the scope preview as illustrative, not a working demo', () => {
  render(<ServicePackageConfigurator locale="en" servicio={web} />);
  fireEvent.click(screen.getByRole('button', { name: /Landing/ }));
  expect(screen.getByText(/not a working demo/)).toBeInTheDocument();
});

it('preserves compatible extras when the selected package changes', () => {
  render(<ServicePackageConfigurator locale="es" servicio={web} />);
  const group = screen.getByRole('group', { name: /Elegí un paquete/ });
  fireEvent.click(within(group).getByRole('button', { name: /Landing/ }));
  const agenda = screen.getByRole('checkbox', { name: /Agenda/ });
  fireEvent.click(agenda);
  expect(agenda).toBeChecked();
  fireEvent.click(within(group).getByRole('button', { name: /Web de cinco secciones/ }));
  expect(screen.getByRole('checkbox', { name: /Agenda/ })).toBeChecked();
});

it('keeps material ongoing costs outside disclosure and detailed terms readable', () => {
  render(<ServicePackageConfigurator locale="en" servicio={web} />);
  fireEvent.click(screen.getByRole('button', { name: /Landing/ }));
  const costs = screen.getByLabelText('Price and ongoing costs');
  expect(costs).toHaveTextContent('USD 40 every 3 months');
  expect(costs).toHaveTextContent('30 days from delivery');
  expect(costs).toHaveTextContent('explicit acceptance');
  expect(costs).toHaveTextContent('annual domain');
  expect(costs).toHaveTextContent('AI/API');
  const details = costs.querySelector('details')!;
  expect(details).toHaveTextContent('source copy');
  expect(details).not.toHaveTextContent('USD 40 every 3 months');
  expect(details).not.toHaveTextContent('annual domain');
});
