import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: vi.fn().mockReturnValue(true) }));

import { getSupabaseAdmin } from '@/lib/supabase';
import { rateLimit } from '@/lib/rate-limit';
import { firmarSesion } from '@/lib/leads/acceso-cliente';
import { POST } from './route';

const upload = vi.fn();

function supabase(pedido: unknown = { id: 'pedido-1', lead_id: 'lead-1' }) {
  upload.mockResolvedValue({ error: null });

  vi.mocked(getSupabaseAdmin).mockReturnValue({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: pedido, error: null }),
        }),
      }),
    })),
    storage: { from: vi.fn(() => ({ upload })) },
  } as never);
}

const SESION = () => `pedido_acceso=${encodeURIComponent(firmarSesion('pedido-1', 'secreto-de-prueba'))}`;

function post(archivo: File | null, campo = 'logo', cookie = SESION()) {
  const form = new FormData();
  if (archivo) form.append('archivo', archivo);
  form.append('campo', campo);

  return POST(
    new NextRequest('http://localhost/x', { method: 'POST', headers: { cookie }, body: form }),
    { params: Promise.resolve({ id: 'pedido-1' }) },
  );
}

const imagen = (nombre = 'logo.png', tipo = 'image/png', bytes = 1000) =>
  new File([new Uint8Array(bytes)], nombre, { type: tipo });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(rateLimit).mockReturnValue(true);
  process.env.ADMIN_SESSION_SECRET = 'secreto-de-prueba';
  supabase();
});

describe('POST /api/pedido/[id]/archivo', () => {
  it('guarda el archivo y devuelve dónde quedó', async () => {
    const res = await post(imagen());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.path).toContain('lead-1/');
    expect(body.nombre).toBe('logo.png');
    expect(upload).toHaveBeenCalled();
  });

  it('el nombre del archivo no decide dónde se guarda', async () => {
    // «../../otra-carpeta/x.png» no puede escribir fuera de lo suyo.
    await post(imagen('../../../etc/passwd.png'));

    const destino = upload.mock.calls[0][0] as string;
    expect(destino).not.toContain('..');
    expect(destino.startsWith('lead-1/')).toBe(true);
  });

  it('rechaza lo que no es imagen ni documento', async () => {
    const res = await post(new File(['x'], 'virus.exe', { type: 'application/x-msdownload' }));
    expect(res.status).toBe(415);
    expect(upload).not.toHaveBeenCalled();
  });

  it('rechaza un archivo demasiado grande', async () => {
    const res = await post(imagen('enorme.png', 'image/png', 11 * 1024 * 1024));
    expect(res.status).toBe(413);
    expect(upload).not.toHaveBeenCalled();
  });

  it('sin archivo no inventa nada', async () => {
    expect((await post(null)).status).toBe(400);
  });

  it('sin verificar el correo no se sube nada', async () => {
    expect((await post(imagen(), 'logo', '')).status).toBe(401);
    expect(upload).not.toHaveBeenCalled();
  });

  it('un pedido que no existe no recibe archivos', async () => {
    supabase(null);
    expect((await post(imagen())).status).toBe(404);
  });

  it('frena a quien sube en serie', async () => {
    vi.mocked(rateLimit).mockReturnValue(false);
    expect((await post(imagen())).status).toBe(429);
  });
});
