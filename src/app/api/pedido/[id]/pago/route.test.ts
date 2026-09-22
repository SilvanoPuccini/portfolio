import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: vi.fn().mockReturnValue(true) }));
vi.mock('@/lib/resend', () => ({ sendCrmEmail: vi.fn() }));

import { getSupabaseAdmin } from '@/lib/supabase';
import { rateLimit } from '@/lib/rate-limit';
import { sendCrmEmail } from '@/lib/resend';
import { POST } from './route';

const PEDIDO = { id: 'pedido-1', lead_id: 'lead-1', firmado_at: '2026-09-22T10:00:00Z', total_usd: 940 };
const LEAD = {
  id: 'lead-1', nombre: 'Estefanía', email: 'este@ejemplo.com',
  estado: 'contrato_firmado', contrato_firmado_at: 'ya', pago_estado: null,
  contrato_firma_token: 'tok',
};

const updateLead = vi.fn();

function supabase(pedido: unknown = PEDIDO, lead: unknown = LEAD) {
  updateLead.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });

  vi.mocked(getSupabaseAdmin).mockReturnValue({
    from: vi.fn((tabla: string) => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: tabla === 'pedidos' ? pedido : lead, error: null }),
        }),
      }),
      update: updateLead,
    })),
  } as never);
}

const post = (id = 'pedido-1') =>
  POST(new NextRequest('http://localhost/x', { method: 'POST' }), { params: Promise.resolve({ id }) });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(rateLimit).mockReturnValue(true);
  process.env.ADMIN_EMAIL = 'silvano@ejemplo.com';
  supabase();
});

describe('POST /api/pedido/[id]/pago', () => {
  it('deja el pago informado y avisa a Silvano', async () => {
    const res = await post();

    expect(res.status).toBe(200);
    expect(updateLead).toHaveBeenCalledWith(expect.objectContaining({ pago_estado: 'informado' }));

    const [para, asunto] = vi.mocked(sendCrmEmail).mock.calls[0];
    expect(para).toBe('silvano@ejemplo.com');
    expect(asunto).toMatch(/Estefanía/);
  });

  it('no deja informar un pago de algo que no se firmó', async () => {
    supabase(PEDIDO, { ...LEAD, contrato_firmado_at: null });
    expect((await post()).status).toBe(409);
    expect(updateLead).not.toHaveBeenCalled();
  });

  it('avisar dos veces no molesta a nadie de nuevo', async () => {
    supabase(PEDIDO, { ...LEAD, pago_estado: 'informado' });

    const res = await post();

    expect(res.status).toBe(200);
    expect(sendCrmEmail).not.toHaveBeenCalled();
  });

  it('un pago ya confirmado no vuelve para atrás', async () => {
    supabase(PEDIDO, { ...LEAD, pago_estado: 'pagado' });

    await post();

    expect(updateLead).not.toHaveBeenCalled();
  });

  it('un pedido que no existe no informa nada', async () => {
    supabase(null);
    expect((await post()).status).toBe(404);
  });

  it('si el aviso a Silvano falla, el pago igual queda informado', async () => {
    vi.mocked(sendCrmEmail).mockRejectedValueOnce(new Error('Resend caído'));
    expect((await post()).status).toBe(200);
    expect(updateLead).toHaveBeenCalled();
  });

  it('frena a quien insiste', async () => {
    vi.mocked(rateLimit).mockReturnValue(false);
    expect((await post()).status).toBe(429);
  });
});
