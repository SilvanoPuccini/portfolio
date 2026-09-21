import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: vi.fn().mockReturnValue(true) }));

import { getSupabaseAdmin } from '@/lib/supabase';
import { rateLimit } from '@/lib/rate-limit';
import { POST } from './route';

const insert = vi.fn();

function supabase(error: unknown = null) {
  insert.mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: error ? null : { id: 'pedido-1' }, error }),
    }),
  });
  vi.mocked(getSupabaseAdmin).mockReturnValue({ from: vi.fn(() => ({ insert })) } as never);
}

const post = (body: unknown) =>
  POST(new NextRequest('http://localhost/api/pedido', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(rateLimit).mockReturnValue(true);
  supabase();
});

describe('POST /api/pedido', () => {
  it('guarda el total del catálogo, no el que manda el cliente', async () => {
    const res = await post({ paquete: 'web-cinco-secciones', extras: ['agenda'], totalUsd: 1 });

    expect(res.status).toBe(200);
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      paquete: 'web-cinco-secciones',
      extras: ['agenda'],
      total_usd: 940,
    }));
  });

  it('descarta un extra que no es de ese servicio', async () => {
    await post({ paquete: 'web-cinco-secciones', extras: ['agenda', 'envios', 'inventado'] });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ extras: ['agenda'], total_usd: 940 }));
  });

  it('lleva al detalle del pedido, que es donde se firma', async () => {
    const body = await (await post({ paquete: 'web-cinco-secciones', extras: [] })).json();
    expect(body.pedidoId).toBe('pedido-1');
    expect(body.url).toBe('/es/pedido/pedido-1');
  });

  it('respeta el idioma en el que estaba comprando', async () => {
    const body = await (await post({ paquete: 'web-cinco-secciones', extras: [], locale: 'en' })).json();
    expect(body.url).toBe('/en/pedido/pedido-1');
  });

  it('un paquete que no existe no crea nada', async () => {
    const res = await post({ paquete: 'inventado', extras: [] });
    expect(res.status).toBe(400);
    expect(insert).not.toHaveBeenCalled();
  });

  it('un paquete que se cotiza no se puede pedir: va a la llamada', async () => {
    const res = await post({ paquete: 'tienda-a-medida', extras: [] });
    expect(res.status).toBe(400);
    expect(insert).not.toHaveBeenCalled();
  });

  it('guarda el mensual aparte del total del proyecto', async () => {
    await post({ paquete: 'tres-automatizaciones', extras: ['plan-automatizacion'] });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ total_usd: 890, mensual_usd: 60 }));
  });

  it('frena a quien insiste', async () => {
    vi.mocked(rateLimit).mockReturnValue(false);
    expect((await post({ paquete: 'web-cinco-secciones', extras: [] })).status).toBe(429);
  });

  it('si la base falla lo dice y no inventa un link', async () => {
    supabase({ message: 'boom' });
    const res = await post({ paquete: 'web-cinco-secciones', extras: [] });
    expect(res.status).toBe(500);
  });
});
