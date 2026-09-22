import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: vi.fn().mockReturnValue(true) }));
vi.mock('@/lib/resend', () => ({ sendCrmEmail: vi.fn() }));

import { getSupabaseAdmin } from '@/lib/supabase';
import { rateLimit } from '@/lib/rate-limit';
import { sendCrmEmail } from '@/lib/resend';
import { hashDeCodigo, sesionValida } from '@/lib/leads/acceso-cliente';
import { POST } from './route';

const PEDIDO = { id: 'pedido-1', lead_id: 'lead-1' };
const LEAD = { id: 'lead-1', nombre: 'Estefanía', email: 'este@ejemplo.com' };

const insert = vi.fn();
const update = vi.fn();
let accesoVigente: Record<string, unknown> | null = null;

function supabase(pedido: unknown = PEDIDO, lead: unknown = LEAD) {
  insert.mockResolvedValue({ error: null });
  update.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });

  vi.mocked(getSupabaseAdmin).mockReturnValue({
    from: vi.fn((tabla: string) => {
      if (tabla === 'accesos_cliente') {
        return {
          insert,
          update,
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: accesoVigente, error: null }),
                }),
              }),
            }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: tabla === 'pedidos' ? pedido : lead, error: null,
            }),
          }),
        }),
      };
    }),
  } as never);
}

const post = (body: unknown = {}, id = 'pedido-1') =>
  POST(
    new NextRequest('http://localhost/x', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  );

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(rateLimit).mockReturnValue(true);
  process.env.ADMIN_SESSION_SECRET = 'secreto-de-prueba-largo';
  accesoVigente = null;
  supabase();
});

describe('pedir el código', () => {
  it('manda un código al mail de la venta, no al que pidan', async () => {
    const res = await post();

    expect(res.status).toBe(200);
    const [para, asunto, html] = vi.mocked(sendCrmEmail).mock.calls[0];
    expect(para).toBe('este@ejemplo.com');
    expect(asunto).toMatch(/código/i);
    expect(html).toMatch(/\d{6}/);
  });

  it('guarda el hash y no el código', async () => {
    await post();

    const guardado = insert.mock.calls[0][0] as { codigo_hash: string };
    // Del asunto, que no tiene números de estilos alrededor.
    const codigo = /(\d{6})/.exec(vi.mocked(sendCrmEmail).mock.calls[0][1] as string)![1];

    expect(guardado.codigo_hash).not.toContain(codigo);
    expect(guardado.codigo_hash).toBe(hashDeCodigo(codigo, 'lead-1'));
  });

  it('nunca devuelve el código ni el mail completo', async () => {
    const body = await (await post()).json();
    const texto = JSON.stringify(body);

    expect(texto).not.toMatch(/\d{6}/);
    expect(texto).not.toContain('este@ejemplo.com');
    // Sí una pista para que el cliente sepa a qué casilla mirar.
    expect(body.pista).toMatch(/@ejemplo\.com/);
  });

  it('un pedido que no existe no manda nada', async () => {
    supabase(null);
    expect((await post()).status).toBe(404);
    expect(sendCrmEmail).not.toHaveBeenCalled();
  });

  it('frena a quien pide códigos en serie', async () => {
    vi.mocked(rateLimit).mockReturnValue(false);
    expect((await post()).status).toBe(429);
    expect(sendCrmEmail).not.toHaveBeenCalled();
  });
});

describe('verificar el código', () => {
  const vigente = (codigo: string) => ({
    id: 'acceso-1',
    codigo_hash: hashDeCodigo(codigo, 'lead-1'),
    intentos: 0,
    expira_at: new Date(Date.now() + 600_000).toISOString(),
    usado_at: null,
  });

  it('con el código correcto entrega la sesión de ese pedido', async () => {
    accesoVigente = vigente('123456');

    const res = await post({ codigo: '123456' });
    const cookie = res.headers.get('set-cookie') ?? '';

    expect(res.status).toBe(200);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toMatch(/SameSite=Lax/i);

    const valor = /pedido_acceso=([^;]+)/.exec(cookie)![1];
    expect(sesionValida(decodeURIComponent(valor), 'pedido-1', 'secreto-de-prueba-largo')).toBe(true);
  });

  it('el código se quema: no sirve dos veces', async () => {
    accesoVigente = vigente('123456');
    await post({ codigo: '123456' });
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ usado_at: expect.any(String) }));
  });

  it('con el código equivocado no entra y cuenta el intento', async () => {
    accesoVigente = vigente('123456');

    const res = await post({ codigo: '000000' });

    expect(res.status).toBe(401);
    expect(res.headers.get('set-cookie')).toBeNull();
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ intentos: 1 }));
  });

  it('después de cinco intentos hay que pedir otro código', async () => {
    accesoVigente = { ...vigente('123456'), intentos: 5 };
    expect((await post({ codigo: '123456' })).status).toBe(429);
  });

  it('un código vencido no entra', async () => {
    accesoVigente = { ...vigente('123456'), expira_at: new Date(Date.now() - 1000).toISOString() };
    expect((await post({ codigo: '123456' })).status).toBe(401);
  });

  it('un código ya usado no entra', async () => {
    accesoVigente = { ...vigente('123456'), usado_at: new Date().toISOString() };
    expect((await post({ codigo: '123456' })).status).toBe(401);
  });

  it('sin código pedido, verificar no entra', async () => {
    accesoVigente = null;
    expect((await post({ codigo: '123456' })).status).toBe(401);
  });
});
