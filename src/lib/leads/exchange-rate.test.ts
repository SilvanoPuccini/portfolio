import { afterEach, describe, expect, it, vi } from 'vitest';
import { FX_MARGIN, fetchUsdRate, localAmount, quoteFor } from './exchange-rate';

const NOW = new Date('2026-09-19T15:00:00.000Z');

function mockFetch(body: unknown, ok = true) {
  const fetchMock = vi.fn().mockResolvedValue({ ok, json: async () => body });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => { vi.unstubAllGlobals(); });

describe('localAmount', () => {
  it('suma el margen y redondea para arriba a la decena de mil', () => {
    // 2400 × 1540,1 × 1,03 = 3.807.127 → 3.810.000
    expect(localAmount(2400, 1540.1)).toBe(3_810_000);
  });

  it('nunca redondea para abajo, aunque falte un peso', () => {
    // 1000 × 1000 × 1,03 = 1.030.000 exacto: se queda donde está.
    expect(localAmount(1000, 1000)).toBe(1_030_000);
    expect(localAmount(1000, 1000.01)).toBe(1_040_000);
  });

  it('el margen es del 3 %', () => {
    expect(FX_MARGIN).toBe(0.03);
  });
});

describe('fetchUsdRate', () => {
  it('Argentina usa el dólar MEP (bolsa), precio de venta', async () => {
    const fetchMock = mockFetch({ casa: 'bolsa', compra: 1530.2, venta: 1540.1, fechaActualizacion: '2026-09-19T14:58:00.000Z' });

    const rate = await fetchUsdRate('ARS');

    expect(fetchMock.mock.calls[0][0]).toBe('https://dolarapi.com/v1/dolares/bolsa');
    expect(rate).toEqual({ currency: 'ARS', rate: 1540.1, source: 'Dólar MEP', updatedAt: '2026-09-19T14:58:00.000Z' });
  });

  it('Chile usa el dólar observado del Banco Central', async () => {
    mockFetch({ serie: [{ fecha: '2026-09-17T03:00:00.000Z', valor: 954.85 }] });

    expect(await fetchUsdRate('CLP')).toEqual({
      currency: 'CLP', rate: 954.85, source: 'Dólar observado', updatedAt: '2026-09-17T03:00:00.000Z',
    });
  });

  it('devuelve null si la API falla, en vez de romper', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout')));
    expect(await fetchUsdRate('ARS')).toBeNull();
  });

  it('devuelve null si la API responde con error', async () => {
    mockFetch({}, false);
    expect(await fetchUsdRate('CLP')).toBeNull();
  });

  it('descarta una cotización absurda', async () => {
    mockFetch({ venta: 0 });
    expect(await fetchUsdRate('ARS')).toBeNull();
  });
});

describe('quoteFor', () => {
  it('cotiza en pesos argentinos para un cliente de Argentina, válido 72 h', async () => {
    mockFetch({ venta: 1540.1, fechaActualizacion: '2026-09-19T14:58:00.000Z' });

    const quote = await quoteFor('Argentina', 2400, NOW);

    expect(quote).toMatchObject({ currency: 'ARS', amount: 3_810_000, rate: 1540.1 });
    expect(quote?.validUntil).toBe('2026-09-22T15:00:00.000Z');
  });

  it('cotiza en pesos chilenos para un cliente de Chile', async () => {
    mockFetch({ serie: [{ fecha: '2026-09-17T03:00:00.000Z', valor: 954.85 }] });

    // 2400 × 954,85 × 1,03 = 2.360.389 → 2.370.000
    expect(await quoteFor('Chile', 2400, NOW)).toMatchObject({ currency: 'CLP', amount: 2_370_000 });
  });

  it('otro país paga en USD: no consulta ninguna API', async () => {
    const fetchMock = mockFetch({});
    expect(await quoteFor('España', 2400, NOW)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sin cotización no inventa un monto', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')));
    expect(await quoteFor('Argentina', 2400, NOW)).toBeNull();
  });
});
