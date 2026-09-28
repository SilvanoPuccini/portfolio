import { afterEach, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AgendarPage from './page';

vi.mock('@/components/site/QuickIntake', () => ({ default: ({ service, paquete }: { service?: string; paquete?: string }) => <div data-testid="intake">{service} / {paquete}</div> }));
afterEach(() => vi.unstubAllEnvs());

it('carries a package-only consultation into the matching service and intake', async () => {
  vi.stubEnv('NEXT_PUBLIC_CALCOM_LINK', '');
  render(await AgendarPage({ params: Promise.resolve({ locale: 'es' }), searchParams: Promise.resolve({ paquete: 'landing' }) }));
  expect(screen.getByTestId('intake')).toHaveTextContent('web / landing');
  expect(screen.getByText(/no es una reserva automática/)).toBeInTheDocument();
});

it('does not attach an incompatible or retired package to a consultation', async () => {
  render(await AgendarPage({ params: Promise.resolve({ locale: 'en' }), searchParams: Promise.resolve({ service: 'web', paquete: 'catalogo-cobro' }) }));
  expect(screen.getByTestId('intake')).toHaveTextContent('web /');
  expect(screen.getByTestId('intake')).not.toHaveTextContent('catalogo-cobro');
});
