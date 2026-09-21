import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: vi.fn().mockReturnValue(true) }));
vi.mock('@/lib/leads/documenso-contract', () => ({
  createContract: vi.fn().mockResolvedValue({
    envelopeId: 'env_1', signingUrl: 'https://app.documenso.com/sign/abc', token: 'abc',
  }),
}));

import { getSupabaseAdmin } from '@/lib/supabase';
import { rateLimit } from '@/lib/rate-limit';
import { createContract } from '@/lib/leads/documenso-contract';
import { POST } from './route';

const PEDIDO = {
  id: 'pedido-1',
  paquete: 'web-cinco-secciones',
  extras: ['agenda'],
  total_usd: 940,
  mensual_usd: 0,
  lead_id: null,
  firmado_at: null,
  locale: 'es',
};

const insertLead = vi.fn();
const updatePedido = vi.fn();
const updateLead = vi.fn();

function supabase(pedido: unknown = PEDIDO) {
  insertLead.mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: { id: 'lead-1' }, error: null }),
    }),
  });
  updatePedido.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  updateLead.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });

  vi.mocked(getSupabaseAdmin).mockReturnValue({
    from: vi.fn((tabla: string) => (tabla === 'pedidos'
      ? {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: pedido, error: null }) }),
        }),
        update: updatePedido,
      }
      : { insert: insertLead, update: updateLead })),
  } as never);
}

const post = (body: unknown, id = 'pedido-1') =>
  POST(
    new NextRequest('http://localhost/x', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  );

const DATOS = { nombre: 'Estefanía Ortigosa', email: 'este@ejemplo.com', pais: 'Argentina' };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(rateLimit).mockReturnValue(true);
  supabase();
});

describe('POST /api/pedido/[id]/contrato', () => {
  it('crea el contrato con el precio del pedido y el alcance del paquete', async () => {
    const res = await post(DATOS);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({ token: 'abc', signingUrl: 'https://app.documenso.com/sign/abc' });

    const [data, , externalId] = vi.mocked(createContract).mock.calls[0];
    expect(data).toMatchObject({
      nombre: 'Estefanía Ortigosa',
      email: 'este@ejemplo.com',
      total: 940,
      domicilio: 'Argentina',
    });
    expect(data.alcance).toContain('Agenda de turnos');
    expect(data.plazo).toContain('10');
    expect(data.pago).toMatch(/único/i);
    expect(data.jurisdiccion).toMatch(/Argentina/);
    // El pedido viaja con el sobre: así la firma se reconoce sin adivinar.
    expect(externalId).toBe('pedido-1');
  });

  it('después de firmar lo manda a una página que existe', async () => {
    // `/gracias` sin idioma es un 404, y el cliente lo ve justo después de
    // firmar: el peor momento posible para una pantalla rota.
    await post(DATOS);
    expect(vi.mocked(createContract).mock.calls[0][1]).toMatch(/\/es\/gracias$/);
  });

  it('deja la venta creada y enganchada al pedido', async () => {
    await post(DATOS);

    expect(insertLead).toHaveBeenCalledWith(expect.objectContaining({
      email: 'este@ejemplo.com',
      monto_presupuestado: 940,
      estado: 'contrato_enviado',
    }));
    expect(updatePedido).toHaveBeenCalledWith(expect.objectContaining({ lead_id: 'lead-1' }));
  });

  it('sin nombre o sin mail no crea nada', async () => {
    expect((await post({ ...DATOS, email: '' })).status).toBe(400);
    expect((await post({ ...DATOS, email: 'no-es-un-mail' })).status).toBe(400);
    expect((await post({ ...DATOS, nombre: '  ' })).status).toBe(400);
    expect(createContract).not.toHaveBeenCalled();
  });

  it('un pedido que no existe no crea contrato', async () => {
    supabase(null);
    expect((await post(DATOS)).status).toBe(404);
    expect(createContract).not.toHaveBeenCalled();
  });

  it('un pedido ya firmado no se vuelve a firmar', async () => {
    supabase({ ...PEDIDO, firmado_at: '2026-09-21T10:00:00Z' });
    expect((await post(DATOS)).status).toBe(409);
  });

  it('si Documenso falla lo dice, y el pedido igual quedó registrado', async () => {
    vi.mocked(createContract).mockRejectedValueOnce(new Error('Documenso 500'));
    const res = await post(DATOS);
    expect(res.status).toBe(502);
  });

  it('frena a quien insiste', async () => {
    vi.mocked(rateLimit).mockReturnValue(false);
    expect((await post(DATOS)).status).toBe(429);
  });
});
