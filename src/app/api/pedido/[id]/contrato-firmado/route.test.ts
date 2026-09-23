import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: vi.fn().mockReturnValue(true) }));
vi.mock('@/lib/leads/documenso-contract', () => ({ descargarContratoFirmado: vi.fn() }));

import { getSupabaseAdmin } from '@/lib/supabase';
import { descargarContratoFirmado } from '@/lib/leads/documenso-contract';
import { firmarSesion } from '@/lib/leads/acceso-cliente';
import { GET } from './route';

/**
 * El contrato firmado, descargable desde la página.
 *
 * Buscaba el PDF en Documenso por su `contrato_envelope_id`. Desde que se
 * firma en nuestro sitio ese campo queda null y el archivo vive en nuestro
 * Storage: el cliente firmaba, pedía su copia y recibía un error. Tenía el
 * contrato en el correo y no lo podía abrir desde su propia página.
 */

const PEDIDO = { id: 'pedido-1', lead_id: 'lead-1' };
const LEAD = {
  nombre: 'Estefanía Ortigosa',
  contrato_envelope_id: null as string | null,
  contrato_firmado_at: '2026-09-22T10:00:00Z',
};
const FIRMA = { pdf_path: 'lead-1/pedido-1.pdf' };

function supabase({
  pedido = PEDIDO as unknown,
  lead = LEAD as unknown,
  firma = FIRMA as unknown,
  archivo = new Blob([Buffer.from('%PDF nuestro')]) as Blob | null,
} = {}) {
  const download = vi.fn().mockResolvedValue(
    archivo ? { data: archivo, error: null } : { data: null, error: { message: 'no está' } },
  );

  vi.mocked(getSupabaseAdmin).mockReturnValue({
    from: vi.fn((tabla: string) => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: tabla === 'pedidos' ? pedido : tabla === 'firmas' ? firma : lead,
            error: null,
          }),
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: firma, error: null }),
            }),
          }),
        }),
      }),
    })),
    storage: { from: vi.fn().mockReturnValue({ download }) },
  } as never);

  return { download };
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
  vi.mocked(descargarContratoFirmado).mockResolvedValue(Buffer.from('%PDF de documenso'));
});

describe('GET /api/pedido/[id]/contrato-firmado', () => {
  it('entrega el PDF que archivamos al firmar', async () => {
    const res = await get();

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/pdf');
    expect(Buffer.from(await res.arrayBuffer()).toString()).toContain('nuestro');
  });

  it('no sale a buscarlo a Documenso teniendo el nuestro', async () => {
    await get();

    expect(descargarContratoFirmado).not.toHaveBeenCalled();
  });

  it('lo abre en el navegador en vez de bajarlo a ciegas', async () => {
    // Descargar un archivo que no se puede previsualizar es pedirle al
    // cliente que confíe. Que lo vea, y que lo guarde si quiere.
    const res = await get();

    expect(res.headers.get('content-disposition')).toContain('inline');
    expect(res.headers.get('content-disposition')).toContain('Contrato');
  });

  it('cae en Documenso para los contratos viejos firmados allá', async () => {
    supabase({ firma: null, lead: { ...LEAD, contrato_envelope_id: 'envelope_abc' } });

    const res = await get();

    expect(res.status).toBe(200);
    expect(Buffer.from(await res.arrayBuffer()).toString()).toContain('documenso');
  });

  it('si el archivo no está en el Storage, cae en Documenso antes de rendirse', async () => {
    supabase({ archivo: null, lead: { ...LEAD, contrato_envelope_id: 'envelope_abc' } });

    expect((await get()).status).toBe(200);
    expect(descargarContratoFirmado).toHaveBeenCalled();
  });

  it('no entrega el contrato de algo que todavía no se firmó', async () => {
    supabase({ lead: { ...LEAD, contrato_firmado_at: null } });

    expect((await get()).status).toBe(404);
    expect(descargarContratoFirmado).not.toHaveBeenCalled();
  });

  it('sin verificar el correo no entrega el contrato', async () => {
    // Lleva el nombre, el domicilio y el precio del cliente.
    expect((await get('pedido-1', '')).status).toBe(401);
    expect(descargarContratoFirmado).not.toHaveBeenCalled();
  });

  it('un pedido que no existe no entrega nada', async () => {
    supabase({ pedido: null });

    expect((await get()).status).toBe(404);
  });

  it('sin archivo por ningún lado lo dice, en vez de entregar algo vacío', async () => {
    supabase({ archivo: null, firma: null });
    vi.mocked(descargarContratoFirmado).mockResolvedValue(null);

    expect((await get()).status).toBe(502);
  });
});
