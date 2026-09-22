import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: vi.fn().mockReturnValue(true) }));
vi.mock('@/lib/resend', () => ({ sendCrmEmail: vi.fn() }));

import { getSupabaseAdmin } from '@/lib/supabase';
import { rateLimit } from '@/lib/rate-limit';
import { sendCrmEmail } from '@/lib/resend';
import { POST } from './route';

const PEDIDO = {
  id: 'pedido-1', lead_id: 'lead-1', paquete: 'landing', extras: [],
  total_usd: 450, mensual_usd: 0, locale: 'es', firmado_at: null as string | null,
};

const LEAD = {
  id: 'lead-1', nombre: 'Estefanía Ortigosa', email: 'este@ejemplo.com',
  pais: 'Argentina', localidad: 'Córdoba', estado: 'contrato_enviado',
  contrato_firmado_at: null as string | null,
};

const insertFirma = vi.fn();
const updateLead = vi.fn();
const updatePedido = vi.fn();
const upload = vi.fn();

function supabase(pedido: unknown = PEDIDO, lead: unknown = LEAD) {
  insertFirma.mockResolvedValue({ error: null });
  updateLead.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  updatePedido.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  upload.mockResolvedValue({ error: null });

  vi.mocked(getSupabaseAdmin).mockReturnValue({
    from: vi.fn((tabla: string) => {
      if (tabla === 'firmas') return { insert: insertFirma };
      if (tabla === 'pedidos') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: pedido }) }),
          }),
          update: updatePedido,
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: lead }) }),
        }),
        update: updateLead,
      };
    }),
    storage: { from: vi.fn(() => ({ upload })) },
  } as never);
}

const post = (body: unknown, id = 'pedido-1') =>
  POST(
    new NextRequest('http://localhost/x', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '190.1.2.3', 'user-agent': 'Chrome' },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  );

const FIRMA = { nombre: 'Estefanía Ortigosa', acepta: true };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(rateLimit).mockReturnValue(true);
  process.env.ADMIN_EMAIL = 'silvano@ejemplo.com';
  supabase();
});

describe('POST /api/pedido/[id]/firmar', () => {
  it('registra la firma con toda su evidencia', async () => {
    const res = await post(FIRMA);

    expect(res.status).toBe(200);

    const guardada = insertFirma.mock.calls[0][0] as Record<string, string>;
    expect(guardada.nombre).toBe('Estefanía Ortigosa');
    expect(guardada.ip).toBe('190.1.2.3');
    expect(guardada.navegador).toContain('Chrome');
    expect(guardada.huella).toHaveLength(64);
    expect(guardada.texto).toContain('PARTES');
  });

  it('mueve la venta y marca el pedido como firmado', async () => {
    await post(FIRMA);

    expect(updateLead).toHaveBeenCalledWith(expect.objectContaining({
      contrato_firmado_at: expect.any(String),
      estado: 'contrato_firmado',
    }));
    expect(updatePedido).toHaveBeenCalledWith(expect.objectContaining({
      firmado_at: expect.any(String),
    }));
  });

  it('archiva el PDF firmado y le manda la copia con los datos de pago', async () => {
    await post(FIRMA);

    expect(upload).toHaveBeenCalled();
    const [para, asunto, , adjuntos] = vi.mocked(sendCrmEmail).mock.calls[0];
    expect(para).toBe('este@ejemplo.com');
    expect(asunto).toMatch(/firmado/i);
    expect((adjuntos as { filename: string }[])[0].filename).toMatch(/\.pdf$/);
  });

  it('el nombre tiene que ser el del contrato', async () => {
    const res = await post({ nombre: 'Juan Pérez', acepta: true });

    expect(res.status).toBe(422);
    expect(insertFirma).not.toHaveBeenCalled();
  });

  it('sin aceptar no hay firma', async () => {
    expect((await post({ nombre: 'Estefanía Ortigosa', acepta: false })).status).toBe(400);
    expect(insertFirma).not.toHaveBeenCalled();
  });

  it('un contrato ya firmado no se firma dos veces', async () => {
    supabase(PEDIDO, { ...LEAD, contrato_firmado_at: '2026-09-22T10:00:00Z' });

    const res = await post(FIRMA);

    expect(res.status).toBe(409);
    expect(insertFirma).not.toHaveBeenCalled();
  });

  it('si el correo falla, la firma no se deshace', async () => {
    vi.mocked(sendCrmEmail).mockRejectedValueOnce(new Error('Resend caído'));

    expect((await post(FIRMA)).status).toBe(200);
    expect(insertFirma).toHaveBeenCalled();
  });

  it('un pedido sin venta no se puede firmar', async () => {
    supabase({ ...PEDIDO, lead_id: null });
    expect((await post(FIRMA)).status).toBe(404);
  });

  it('frena a quien insiste', async () => {
    vi.mocked(rateLimit).mockReturnValue(false);
    expect((await post(FIRMA)).status).toBe(429);
  });
});
