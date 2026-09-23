import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/rate-limit', () => ({ rateLimit: vi.fn().mockReturnValue(true) }));
vi.mock('@/lib/leads/cargar-pedido', () => ({ cargarPedidoCompleto: vi.fn() }));

import { rateLimit } from '@/lib/rate-limit';
import { cargarPedidoCompleto } from '@/lib/leads/cargar-pedido';
import { GET } from './route';

/**
 * El paso actual, para que la pantalla del cliente avance sola.
 *
 * Silvano aprobaba el pago desde el panel y el cliente seguía mirando «recibí
 * tu aviso» hasta que recargaba a mano, si se le ocurría.
 */

const get = (id = 'pedido-1') =>
  GET(new NextRequest('http://localhost/x'), { params: Promise.resolve({ id }) });

const conEtapa = (etapa: string) =>
  vi.mocked(cargarPedidoCompleto).mockResolvedValue({ etapa } as never);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(rateLimit).mockReturnValue(true);
});

describe('GET /api/pedido/[id]/estado', () => {
  it('dice en qué paso está', async () => {
    conEtapa('pago');

    const body = await (await get()).json() as { paso: string };

    expect(body.paso).toBe('pagar');
  });

  it('avisa cuando el pago ya se confirmó', async () => {
    conEtapa('listo');

    const body = await (await get()).json() as { paso: string };

    expect(body.paso).toBe('listo');
  });

  it('el que avisó y espera sigue en el mismo paso', async () => {
    conEtapa('esperando');

    const body = await (await get()).json() as { paso: string };

    expect(body.paso).toBe('pagar');
  });

  it('no pasea los datos del cliente por la red', async () => {
    // Se consulta cada pocos segundos: no tiene por qué llevar el nombre, el
    // monto ni el contrato para decir «seguís igual».
    conEtapa('pago');

    const body = await (await get()).json() as Record<string, unknown>;

    expect(Object.keys(body).sort()).toEqual(['etapa', 'paso']);
  });

  it('no se cachea: el punto es justamente que cambie', async () => {
    conEtapa('pago');

    expect((await get()).headers.get('cache-control')).toContain('no-store');
  });

  it('un pedido que no existe no inventa un paso', async () => {
    vi.mocked(cargarPedidoCompleto).mockResolvedValue(null);

    expect((await get()).status).toBe(404);
  });

  it('corta si alguien consulta de más', async () => {
    vi.mocked(rateLimit).mockReturnValue(false);

    expect((await get()).status).toBe(429);
    expect(cargarPedidoCompleto).not.toHaveBeenCalled();
  });
});
