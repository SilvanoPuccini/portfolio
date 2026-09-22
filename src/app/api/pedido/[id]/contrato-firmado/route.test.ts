import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: vi.fn().mockReturnValue(true) }));
vi.mock('@/lib/leads/documenso-contract', () => ({ descargarContratoFirmado: vi.fn() }));

import { getSupabaseAdmin } from '@/lib/supabase';
import { descargarContratoFirmado } from '@/lib/leads/documenso-contract';
import { firmarSesion } from '@/lib/leads/acceso-cliente';
import { GET } from './route';

const PEDIDO = { id: 'pedido-1', lead_id: 'lead-1' };
const LEAD = {
  nombre: 'Estefanía Ortigosa',
  contrato_envelope_id: 'envelope_abc',
  contrato_firmado_at: '2026-09-22T10:00:00Z',
};

function supabase(pedido: unknown = PEDIDO, lead: unknown = LEAD) {
  vi.mocked(getSupabaseAdmin).mockReturnValue({
    from: vi.fn((tabla: string) => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: tabla === 'pedidos' ? pedido : lead, error: null }),
        }),
      }),
    })),
  } as never);
}

const conSesion = (id: string) =>
  `pedido_acceso=${encodeURIComponent(firmarSesion(id, 'secreto-de-prueba-largo'))}`;

const get = (id = 'pedido-1', cookie = conSesion('pedido-1')) =>
  GET(
    new NextRequest('http://localhost/x', { headers: { cookie } }),
    { params: Promise.resolve({ id }) },
  );

beforeEach(() => {
  vi.clearAllMocks();
  process.env.ADMIN_SESSION_SECRET = 'secreto-de-prueba-largo';
  supabase();
  vi.mocked(descargarContratoFirmado).mockResolvedValue(Buffer.from('%PDF firmado'));
});

describe('GET /api/pedido/[id]/contrato-firmado', () => {
  it('devuelve el PDF con un nombre legible', async () => {
    const res = await get();

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/pdf');
    expect(res.headers.get('content-disposition')).toContain('Contrato');
    expect(Buffer.from(await res.arrayBuffer()).toString()).toContain('firmado');
  });

  it('no entrega el contrato de algo que todavía no se firmó', async () => {
    supabase(PEDIDO, { ...LEAD, contrato_firmado_at: null });
    expect((await get()).status).toBe(404);
    expect(descargarContratoFirmado).not.toHaveBeenCalled();
  });

  it('sin verificar el correo no entrega el contrato', async () => {
    // Lleva el nombre, el domicilio y el precio del cliente.
    expect((await get('pedido-1', '')).status).toBe(401);
    expect(descargarContratoFirmado).not.toHaveBeenCalled();
  });

  it('un pedido que no existe no entrega nada', async () => {
    supabase(null);
    expect((await get()).status).toBe(404);
  });

  it('si Documenso no lo devuelve, lo dice en vez de entregar un archivo vacío', async () => {
    vi.mocked(descargarContratoFirmado).mockResolvedValue(null);
    expect((await get()).status).toBe(502);
  });
});
