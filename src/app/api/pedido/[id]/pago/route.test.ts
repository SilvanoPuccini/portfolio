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
const updatePedido = vi.fn();
const upload = vi.fn();

function supabase(pedido: unknown = PEDIDO, lead: unknown = LEAD) {
  updateLead.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  updatePedido.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  upload.mockResolvedValue({ error: null });

  vi.mocked(getSupabaseAdmin).mockReturnValue({
    from: vi.fn((tabla: string) => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: tabla === 'pedidos' ? pedido : lead, error: null }),
        }),
      }),
      update: tabla === 'pedidos' ? updatePedido : updateLead,
    })),
    storage: { from: vi.fn().mockReturnValue({ upload }) },
  } as never);
}

/** El aviso con el comprobante adjunto, como lo manda el navegador. */
function conComprobante(archivo: File, id = 'pedido-1') {
  const form = new FormData();
  form.set('comprobante', archivo);
  return POST(
    new NextRequest('http://localhost/x', { method: 'POST', body: form }),
    { params: Promise.resolve({ id }) },
  );
}

const captura = (over: { type?: string; bytes?: number; name?: string } = {}) =>
  new File(
    [new Uint8Array(over.bytes ?? 1024)],
    over.name ?? 'comprobante.png',
    { type: over.type ?? 'image/png' },
  );

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

/**
 * El comprobante.
 *
 * «Ya transferí» dejaba a Silvano con un aviso y nada que mirar: había que
 * entrar al banco, buscar el movimiento y adivinar cuál de todos era. Esa es
 * la traba real del cobro.
 */
describe('POST /api/pedido/[id]/pago — con el comprobante adjunto', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rateLimit).mockReturnValue(true);
    process.env.ADMIN_EMAIL = 'silvano@ejemplo.com';
    supabase();
  });

  it('guarda el comprobante contra el pedido que se está pagando', async () => {
    const res = await conComprobante(captura());

    expect(res.status).toBe(200);
    expect(upload).toHaveBeenCalled();
    expect(updatePedido).toHaveBeenCalledWith(expect.objectContaining({
      comprobante_nombre: 'comprobante.png',
    }));
  });

  it('lo guarda bajo la venta y el pedido, no donde diga el nombre del archivo', async () => {
    await conComprobante(captura({ name: '../../otra/x.png' }));

    const [ruta] = upload.mock.calls[0] as [string];
    expect(ruta.startsWith('lead-1/pedido-1/')).toBe(true);
    expect(ruta).not.toContain('..');
  });

  it('avisa que hay un comprobante para revisar, no solo que avisó', async () => {
    await conComprobante(captura());

    const [, asunto] = vi.mocked(sendCrmEmail).mock.calls[0];
    expect(asunto).toContain('comprobante');
  });

  it('rechaza lo que no es un comprobante, y lo explica', async () => {
    const res = await conComprobante(captura({ type: 'application/zip', name: 'x.zip' }));
    const body = await res.json() as { error: string };

    expect(res.status).toBe(415);
    expect(body.error).toContain('imagen o un PDF');
    expect(upload).not.toHaveBeenCalled();
  });

  it('rechaza lo que pesa de más sin registrar nada a medias', async () => {
    const res = await conComprobante(captura({ bytes: 9 * 1024 * 1024 }));

    expect(res.status).toBe(413);
    expect(updateLead).not.toHaveBeenCalled();
  });

  it('el aviso sin comprobante sigue funcionando como siempre', async () => {
    // El que ya transfirió y no encuentra el comprobante no puede quedar
    // trabado: avisar sin adjuntar sigue valiendo.
    const res = await post();

    expect(res.status).toBe(200);
    expect(updateLead).toHaveBeenCalledWith(expect.objectContaining({ pago_estado: 'informado' }));
  });

  it('si el comprobante no se puede guardar, el aviso igual queda', async () => {
    upload.mockResolvedValue({ error: { message: 'bucket caído' } });

    const res = await conComprobante(captura());

    // El cliente ya transfirió: perder su aviso porque falló nuestro storage
    // sería castigarlo por un problema nuestro.
    expect(res.status).toBe(200);
    expect(updateLead).toHaveBeenCalledWith(expect.objectContaining({ pago_estado: 'informado' }));
  });
});
