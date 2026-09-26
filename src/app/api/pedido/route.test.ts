import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: vi.fn().mockReturnValue(true) }));

import { getSupabaseAdmin } from '@/lib/supabase';
import { rateLimit } from '@/lib/rate-limit';
import { paquetePorSlug } from '@/content/servicios';
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

const post = (body: Record<string, unknown>) => {
  const pkg = paquetePorSlug(String(body.paquete));
  const defaults = Object.fromEntries((pkg?.calificacion ?? []).map((q) => [q.id, q.opciones.find((o) => o.califica)!.valor]));
  return POST(new NextRequest('http://localhost/api/pedido', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ calificacion: defaults, ...body }),
  }));
};

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

  it('rejects extras outside the service', async () => {
    const res = await post({ paquete: 'web-cinco-secciones', extras: ['agenda', 'envios', 'inventado'] });
    expect(res.status).toBe(400);
    expect(insert).not.toHaveBeenCalled();
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

  it('guarda lo que el cliente contestó antes de comprar', async () => {
    await post({ paquete: 'auditoria-web', extras: [], calificacion: { paginas: 'hasta-quince', login: 'no' } });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      calificacion: { paginas: 'hasta-quince', login: 'no' },
    }));
  });

  it('descarta una respuesta inventada: viene del navegador del cliente', async () => {
    await post({
      paquete: 'auditoria-web',
      extras: [],
      calificacion: { paginas: 'mil', inventada: 'x', login: 'no' },
    });
    expect(insert).not.toHaveBeenCalled();
  });

  it('sin respuestas guarda un objeto vacío, no null', async () => {
    const res = await post({ paquete: 'web-cinco-secciones', extras: [], calificacion: {} });
    expect(res.status).toBe(400);
    expect(insert).not.toHaveBeenCalled();
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


describe('new order mandatory charges', () => {
  it.each(['una-automatizacion', 'tres-automatizaciones'])('cannot omit monitoring for %s', async (paquete) => {
    const response = await post({ paquete, extras: [], mensualUsd: 0, totalUsd: 1 });
    expect(response.status).toBe(200);
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ extras: ['plan-automatizacion'], mensual_usd: 60 }));
    expect(await response.json()).toMatchObject({ mensualUsd: 60 });
  });

  it('charges repeated monitoring only once', async () => {
    await post({ paquete: 'tres-automatizaciones', extras: ['plan-automatizacion', 'plan-automatizacion'] });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ extras: ['plan-automatizacion'], mensual_usd: 60, total_usd: 890 }));
  });

  it('charges repeated optional extras only once', async () => {
    await post({ paquete: 'web-cinco-secciones', extras: ['agenda', 'agenda'] });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ extras: ['agenda'], total_usd: 940, mensual_usd: 0 }));
  });

  it('does not add automation monitoring to a care plan', async () => {
    expect((await post({ paquete: 'cuidado-basico', extras: [] })).status).toBe(409);
    expect(insert).not.toHaveBeenCalled();
  });
});


it('rejects out-of-scope answers even when directly posting', async () => {
  const pkg = paquetePorSlug('auditoria-web')!;
  const answers = Object.fromEntries(pkg.calificacion.map((q) => [q.id, q.opciones[0].valor]));
  const question = pkg.calificacion.find((q) => q.opciones.some((o) => !o.califica))!;
  answers[question.id] = question.opciones.find((o) => !o.califica)!.valor;
  expect((await post({ paquete: pkg.slug, calificacion: answers })).status).toBe(400);
  expect(insert).not.toHaveBeenCalled();
});
it.each([['agenda', 5], 'agenda', null])('rejects malformed extra selections %j', async (extras) => {
  expect((await post({ paquete: 'landing', extras })).status).toBe(400);
  expect(insert).not.toHaveBeenCalled();
});

it.each([
  { paquete: 'tienda-a-medida', extras: [] },
  { paquete: 'catalogo-whatsapp', extras: ['stock'] },
])('rejects retired new-sale configuration $paquete $extras', async (body) => {
  const response = await post(body);
  expect(response.status).toBe(400);
  expect(insert).not.toHaveBeenCalled();
});
