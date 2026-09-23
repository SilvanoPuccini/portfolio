import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: vi.fn().mockReturnValue(true) }));
vi.mock('@/lib/resend', () => ({ sendCrmEmail: vi.fn() }));

import { getSupabaseAdmin } from '@/lib/supabase';
import { rateLimit } from '@/lib/rate-limit';
import { sendCrmEmail } from '@/lib/resend';
import { POST } from './route';

/**
 * «Perdí el link de mi pedido».
 *
 * Sin esto el cliente empezaba de cero y nacía un segundo lead del mismo
 * cliente con otro pedido a medias. Lo que más importa acá es lo que NO se
 * responde: la respuesta tiene que ser idéntica exista o no el correo.
 */

const LEAD = {
  id: 'lead-1', nombre: 'Estefanía Ortigosa', estado: 'contrato_firmado',
  pago_estado: null, contrato_firmado_at: 'ya',
};
const PEDIDO = {
  id: 'pedido-1', lead_id: 'lead-1', firmado_at: 'ya',
  created_at: '2026-09-20T10:00:00Z', locale: 'es',
};

function supabase(leads: unknown[] = [LEAD], pedidos: unknown[] = [PEDIDO]) {
  vi.mocked(getSupabaseAdmin).mockReturnValue({
    from: vi.fn((tabla: string) => (tabla === 'leads'
      ? { select: vi.fn().mockReturnValue({ ilike: vi.fn().mockResolvedValue({ data: leads }) }) }
      : { select: vi.fn().mockReturnValue({ in: vi.fn().mockResolvedValue({ data: pedidos }) }) })),
  } as never);
}

const post = (email: unknown) =>
  POST(new NextRequest('http://localhost/x', {
    method: 'POST',
    body: JSON.stringify({ email }),
    headers: { 'content-type': 'application/json' },
  }));

const htmlDelCorreo = () => (vi.mocked(sendCrmEmail).mock.calls[0]?.[2] ?? '') as string;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(rateLimit).mockReturnValue(true);
  process.env.NEXT_PUBLIC_SITE_URL = 'https://silvanopuccini.dev';
  supabase();
});

describe('POST /api/pedido/recuperar — lo que no cuenta', () => {
  it('contesta lo mismo exista o no el correo', async () => {
    const conPedido = await (await post('este@ejemplo.com')).json();

    supabase([], []);
    const sinPedido = await (await post('nadie@ejemplo.com')).json();

    // Si la respuesta cambiara, probando direcciones ajenas se podría
    // averiguar quién te compró.
    expect(sinPedido).toEqual(conPedido);
  });

  it('nunca devuelve el link en la respuesta', async () => {
    // Devolverlo en pantalla abriría el pedido de cualquiera con solo saber
    // su dirección: su contrato, su precio y su domicilio.
    const crudo = await (await post('este@ejemplo.com')).text();

    expect(crudo).not.toContain('pedido-1');
    expect(crudo).not.toContain('http');
  });

  it('ni siquiera un error nuestro cambia la respuesta', async () => {
    const esperada = await (await post('este@ejemplo.com')).json();

    vi.mocked(getSupabaseAdmin).mockImplementation(() => { throw new Error('se cayó'); });
    const conError = await post('este@ejemplo.com');

    expect(conError.status).toBe(200);
    expect(await conError.json()).toEqual(esperada);
  });

  it('no manda nada a un correo que no compró', async () => {
    supabase([], []);

    await post('nadie@ejemplo.com');

    expect(sendCrmEmail).not.toHaveBeenCalled();
  });
});

describe('POST /api/pedido/recuperar — el link que manda', () => {
  it('lleva al paso donde quedó', async () => {
    await post('este@ejemplo.com');

    // Firmado y sin pagar: le toca el pago.
    expect(htmlDelCorreo()).toContain('/es/pedido/pedido-1/pagar');
  });

  it('manda el pedido a medias y no el que ya terminó', async () => {
    supabase(
      [LEAD, { ...LEAD, id: 'lead-2', pago_estado: 'pagado' }],
      [
        { ...PEDIDO, id: 'terminado', lead_id: 'lead-2', created_at: '2026-09-22T10:00:00Z' },
        { ...PEDIDO, id: 'a-medias', created_at: '2026-09-01T10:00:00Z' },
      ],
    );

    await post('este@ejemplo.com');

    expect(htmlDelCorreo()).toContain('a-medias');
  });

  it('respeta el idioma en el que compró', async () => {
    supabase([LEAD], [{ ...PEDIDO, locale: 'en' }]);

    await post('este@ejemplo.com');

    expect(htmlDelCorreo()).toContain('/en/pedido/');
  });

  it('encuentra el correo aunque lo escriba con mayúsculas', async () => {
    await post('  ESTE@Ejemplo.com  ');

    expect(sendCrmEmail).toHaveBeenCalled();
  });

  it('le avisa que nadie más puede entrar con eso', async () => {
    await post('este@ejemplo.com');

    expect(htmlDelCorreo()).toMatch(/nadie más puede/i);
  });
});

describe('POST /api/pedido/recuperar — los límites', () => {
  it('pide un correo de verdad', async () => {
    expect((await post('no-es-un-correo')).status).toBe(400);
    expect((await post('')).status).toBe(400);
    expect((await post(42)).status).toBe(400);
  });

  it('corta al que prueba direcciones de a montones', async () => {
    vi.mocked(rateLimit).mockReturnValue(false);

    expect((await post('este@ejemplo.com')).status).toBe(429);
    expect(getSupabaseAdmin).not.toHaveBeenCalled();
  });
});
