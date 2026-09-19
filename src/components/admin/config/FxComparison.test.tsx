import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import FxComparison from './FxComparison';

function mockRates(rates: unknown[]) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ rates, margin: 0.03, roundStep: 10_000, validHours: 72 }),
  }));
}

afterEach(() => { vi.unstubAllGlobals(); });

describe('FxComparison', () => {
  it('muestra cuánto se cobra en cada moneda por un monto en USD', async () => {
    mockRates([
      { currency: 'ARS', rate: 1540.1, source: 'Dólar MEP', updatedAt: null },
      { currency: 'CLP', rate: 954.85, source: 'Dólar observado', updatedAt: null },
    ]);

    render(<FxComparison />);
    fireEvent.change(screen.getByLabelText(/monto en usd/i), { target: { value: '2400' } });

    expect(await screen.findByText('ARS 3.810.000')).toBeTruthy();
    expect(screen.getByText('CLP 2.370.000')).toBeTruthy();
    expect(screen.getByText(/dólar mep/i)).toBeTruthy();
  });

  it('avisa cuando una cotización no está disponible', async () => {
    mockRates([
      { currency: 'ARS', unavailable: true },
      { currency: 'CLP', rate: 954.85, source: 'Dólar observado', updatedAt: null },
    ]);

    render(<FxComparison />);

    expect(await screen.findByText(/sin cotización/i)).toBeTruthy();
  });
});
