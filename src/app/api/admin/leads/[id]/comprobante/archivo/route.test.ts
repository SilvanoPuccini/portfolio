import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin: vi.fn() }));
vi.mock('@/lib/admin-auth', () => ({ isAuthorized: vi.fn() }));

import { isAuthorized } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import { GET } from './route';

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);

function supabase(archivo: Uint8Array | null, path: string | null = 'lead-1/pedido-1/x.png') {
  vi.mocked(getSupabaseAdmin).mockReturnValue({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          not: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: path ? { comprobante_path: path } : null }),
              }),
            }),
          }),
        }),
      }),
    })),
    storage: {
      from: vi.fn().mockReturnValue({
        download: vi.fn().mockResolvedValue(
          archivo ? { data: new Blob([archivo as Uint8Array<ArrayBuffer>]), error: null } : { data: null, error: { message: 'no' } },
        ),
      }),
    },
  } as never);
}

const get = () => GET(new NextRequest('http://localhost/x'), { params: Promise.resolve({ id: 'lead-1' }) });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isAuthorized).mockReturnValue(true);
});

describe('GET /api/admin/leads/[id]/comprobante/archivo', () => {
  it('sin sesión de admin no entrega nada: lleva el CBU del cliente', async () => {
    vi.mocked(isAuthorized).mockReturnValue(false);
    supabase(PNG);

    expect((await get()).status).toBe(401);
  });

  it('sirve la imagen con su tipo real, inline y en sandbox', async () => {
    supabase(PNG);
    const res = await get();

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');
    expect(res.headers.get('content-disposition')).toMatch(/^inline/);
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('content-security-policy')).toContain('sandbox');
  });

  it('no sirve lo que no es imagen ni PDF, aunque se haya guardado', async () => {
    supabase(new TextEncoder().encode('<script>alert(1)</script>'));

    expect((await get()).status).toBe(415);
  });

  it('sin comprobante, 404', async () => {
    supabase(null, null);

    expect((await get()).status).toBe(404);
  });
});
