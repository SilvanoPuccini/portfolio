import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/admin-auth', () => ({ isAuthorized: vi.fn() }));
vi.mock('@/lib/leads/exchange-rate', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/leads/exchange-rate')>()),
  fetchUsdRate: vi.fn(),
}));

import { isAuthorized } from '@/lib/admin-auth';
import { fetchUsdRate } from '@/lib/leads/exchange-rate';
import { GET } from './route';

const request = () => new NextRequest('http://localhost/api/admin/fx');

describe('GET /api/admin/fx', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('pide sesión de admin', async () => {
    vi.mocked(isAuthorized).mockReturnValue(false);
    expect((await GET(request())).status).toBe(401);
    expect(fetchUsdRate).not.toHaveBeenCalled();
  });

  it('devuelve las dos cotizaciones con el margen y el redondeo que usa el cobro', async () => {
    vi.mocked(isAuthorized).mockReturnValue(true);
    vi.mocked(fetchUsdRate).mockImplementation(async (currency) => (
      { currency, rate: currency === 'ARS' ? 1540.1 : 954.85, source: 'x', updatedAt: null }
    ));

    const body = await (await GET(request())).json();

    expect(body.margin).toBe(0.03);
    expect(body.roundStep).toBe(10_000);
    expect(body.validHours).toBe(72);
    expect(body.rates.map((r: { currency: string }) => r.currency)).toEqual(['ARS', 'CLP']);
  });

  it('una API caída no tira abajo la otra', async () => {
    vi.mocked(isAuthorized).mockReturnValue(true);
    vi.mocked(fetchUsdRate).mockImplementation(async (currency) => (
      currency === 'ARS' ? null : { currency, rate: 954.85, source: 'x', updatedAt: null }
    ));

    const body = await (await GET(request())).json();

    expect(body.rates).toEqual([
      { currency: 'ARS', unavailable: true },
      expect.objectContaining({ currency: 'CLP', rate: 954.85 }),
    ]);
  });
});
