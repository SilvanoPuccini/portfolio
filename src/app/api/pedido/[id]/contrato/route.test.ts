import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: vi.fn().mockReturnValue(true) }));
vi.mock('@/lib/resend', () => ({ sendCrmEmail: vi.fn() }));
vi.mock('@/lib/leads/documenso-contract', () => ({
  createContract: vi.fn().mockResolvedValue({
    envelopeId: 'env_1', signingUrl: 'https://app.documenso.com/sign/abc', token: 'abc',
  }),
}));

import { getSupabaseAdmin } from '@/lib/supabase';
import { rateLimit } from '@/lib/rate-limit';
import { createContract } from '@/lib/leads/documenso-contract';
import { sendCrmEmail } from '@/lib/resend';
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
  process.env.ADMIN_EMAIL = 'silvano@ejemplo.com';
  process.env.FIRMA_CON_DOCUMENSO = '1';
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
    expect(data.plazo).toContain('15');
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

  it('manda el respaldo desde nuestro dominio, con el link a la página', async () => {
    await post(DATOS);

    const [para, asunto, html] = vi.mocked(sendCrmEmail).mock.calls[0];
    expect(para).toBe('este@ejemplo.com');
    expect(asunto).toMatch(/firmar/i);
    expect(html).toContain('/es/pedido/pedido-1');
    expect(html).toContain('Web de cinco secciones');
  });

  it('si el correo de respaldo falla, la firma sigue en pie', async () => {
    vi.mocked(sendCrmEmail).mockRejectedValueOnce(new Error('Resend caído'));

    const res = await post(DATOS);

    expect(res.status).toBe(200);
    expect((await res.json()).token).toBe('abc');
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

  it('si Documenso falla, la venta no se pierde: queda para mandar a mano', async () => {
    // El lead ya está creado con todo lo que eligió. Lo que falla es el
    // papel, no la venta: se le avisa al cliente y a Silvano, y el contrato
    // sale por mail en cuanto se pueda.
    vi.mocked(createContract).mockRejectedValueOnce(new Error('Documenso 500'));

    const res = await post(DATOS);
    const body = await res.json();

    expect(res.status).toBe(202);
    expect(body.demorado).toBe(true);
    expect(insertLead).toHaveBeenCalled();

    // Al cliente le llega un aviso, y a Silvano el pedido de mandarlo a mano.
    const destinatarios = vi.mocked(sendCrmEmail).mock.calls.map((c) => c[0]);
    expect(destinatarios).toContain('este@ejemplo.com');
    expect(destinatarios).toContain('silvano@ejemplo.com');
  });

  it('frena a quien insiste', async () => {
    vi.mocked(rateLimit).mockReturnValue(false);
    expect((await post(DATOS)).status).toBe(429);
  });
});

describe('con la firma propia, Documenso no se usa', () => {
  beforeEach(() => {
    delete process.env.FIRMA_CON_DOCUMENSO;
    supabase();
  });

  it('crea la venta y devuelve que se firma en la página', async () => {
    const res = await post(DATOS);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.modo).toBe('propia');
    expect(createContract).not.toHaveBeenCalled();
    expect(insertLead).toHaveBeenCalledWith(expect.objectContaining({
      email: 'este@ejemplo.com',
      monto_presupuestado: 940,
    }));
  });

  it('engancha el pedido con la venta antes de devolver', async () => {
    // Sin esto el pedido queda sin dueño y al firmar no encuentra nada: el
    // cliente llega a la pantalla de firma y recibe un 404.
    await post(DATOS);
    expect(updatePedido).toHaveBeenCalledWith(expect.objectContaining({ lead_id: 'lead-1' }));
  });

  /**
   * El link del pedido tiene que viajar al correo apenas hay a dónde mandarlo.
   *
   * Acá vivía la decisión contraria: «no manda el correo, el cliente ya está
   * en la pantalla». Es cierto hasta que cierra la pestaña. El link del
   * pedido es un uuid que solo vive en la barra del navegador: si se pierde,
   * se pierde una venta que ya estaba decidida, y el cliente no tiene ningún
   * modo de volver.
   *
   * Se manda en cuanto deja su correo, antes de firmar, que es justo el
   * momento en que todavía puede perderlo todo.
   */
  it('le manda el link de su pedido apenas deja sus datos', async () => {
    await post(DATOS);

    const [para, asunto, html] = vi.mocked(sendCrmEmail).mock.calls[0];
    expect(para).toBe('este@ejemplo.com');
    expect(asunto).toContain('firmar');
    expect(html).toContain('/es/pedido/pedido-1');
  });

  it('el correo no puede tirar abajo la firma que el cliente está haciendo', async () => {
    vi.mocked(sendCrmEmail).mockRejectedValueOnce(new Error('Resend caído'));

    const res = await post(DATOS);

    expect(res.status).toBe(200);
    expect((await res.json()).modo).toBe('propia');
  });

  it('manda el link antes de contestar, no después', async () => {
    // Si se contestara primero y se mandara después, una respuesta cortada
    // dejaría al cliente en la pantalla de firma sin correo de respaldo.
    await post(DATOS);

    expect(sendCrmEmail).toHaveBeenCalled();
    expect(updatePedido).toHaveBeenCalledWith(expect.objectContaining({ lead_id: 'lead-1' }));
  });
});
