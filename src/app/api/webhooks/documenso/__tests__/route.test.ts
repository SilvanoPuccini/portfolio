import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHmac } from 'crypto';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin: vi.fn() }));
vi.mock('@/lib/resend', () => ({ sendCrmEmail: vi.fn() }));

import { getSupabaseAdmin } from '@/lib/supabase';
import { sendCrmEmail } from '@/lib/resend';
import { POST } from '@/app/api/webhooks/documenso/route';

const SECRET = 'secreto-documenso';

function supabaseWithLead(estado: string | null, extra: Record<string, unknown> = {}) {
  const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  const from = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: estado === null ? null : {
            id: 'lead-1', nombre: 'Ferrelon', email: 'hola@ferrelon.com',
            estado, monto_presupuestado: 4800, sena_pct: null,
            sena_monto: null, pago_unico: null, ...extra,
          },
          error: null,
        }),
      }),
    }),
    update,
  });
  vi.mocked(getSupabaseAdmin).mockReturnValue({ from } as never);
  return update;
}

function signed(body: unknown, secret = SECRET) {
  const raw = JSON.stringify(body);
  return new NextRequest('http://localhost/api/webhooks/documenso', {
    method: 'POST',
    headers: {
      'x-documenso-secret': createHmac('sha256', secret).update(raw).digest('hex'),
      'Content-Type': 'application/json',
    },
    body: raw,
  });
}

const completed = (email = 'hola@ferrelon.com') => ({
  event: 'DOCUMENT_COMPLETED',
  payload: { recipients: [{ email, signingStatus: 'SIGNED' }] },
});

describe('webhook de Documenso — la firma mueve la venta sola', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DOCUMENSO_WEBHOOK_SECRET = SECRET;
    vi.mocked(sendCrmEmail).mockResolvedValue(undefined as never);
  });

  it('rechaza una firma inválida sin tocar la base', async () => {
    supabaseWithLead('contrato_enviado');

    const response = await POST(signed(completed(), 'otro-secreto'));

    // Este webhook mueve una venta y le escribe a un cliente: sin firma
    // válida no se procesa.
    expect(response.status).toBe(401);
    expect(getSupabaseAdmin).not.toHaveBeenCalled();
  });

  it('marca la firma y pide el pago', async () => {
    const update = supabaseWithLead('contrato_enviado');

    const body = await (await POST(signed(completed()))).json();

    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      estado: 'contrato_firmado',
      contrato_firmado_at: expect.any(String),
    }));
    expect(sendCrmEmail).toHaveBeenCalledOnce();
    expect(body.action).toBe('firmado_y_pago_pedido');
  });

  it('usa la seña acordada y no la de la plantilla', async () => {
    supabaseWithLead('contrato_enviado', { sena_pct: 30, sena_monto: 1440 });

    await POST(signed(completed()));

    const html = vi.mocked(sendCrmEmail).mock.calls[0][2];
    expect(html).toContain('Seña del 30%');
    expect(html).toContain('$1.440');
  });

  it('un aviso repetido no vuelve a pedirle plata al cliente', async () => {
    // Documenso puede reenviar el mismo evento. La venta ya avanzó, así que
    // no corresponde un segundo pedido de pago.
    const update = supabaseWithLead('cerrado');

    const body = await (await POST(signed(completed()))).json();

    expect(update).toHaveBeenCalledWith(
      expect.not.objectContaining({ estado: expect.anything() }),
    );
    expect(sendCrmEmail).not.toHaveBeenCalled();
    expect(body.action).toBe('firma_registrada');
  });

  it('ignora los eventos que no son la firma completa', async () => {
    const update = supabaseWithLead('contrato_enviado');

    const body = await (await POST(signed({
      event: 'DOCUMENT_OPENED', payload: { recipients: [{ email: 'hola@ferrelon.com' }] },
    }))).json();

    expect(body.action).toBe('ignored');
    expect(update).not.toHaveBeenCalled();
  });

  it('no falla si el firmante no corresponde a ningún lead', async () => {
    supabaseWithLead(null);

    const response = await POST(signed(completed('desconocido@ejemplo.com')));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.action).toBe('lead_not_found');
  });

  it('la firma queda registrada aunque el correo falle', async () => {
    const update = supabaseWithLead('contrato_enviado');
    vi.mocked(sendCrmEmail).mockRejectedValue(new Error('Resend caído'));

    const body = await (await POST(signed(completed()))).json();

    // Firmó de verdad: eso no se deshace porque el mail no salió.
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ estado: 'contrato_firmado' }));
    expect(body.action).toBe('firmado_sin_correo');
  });

  it('rechaza un aviso sin correo de firmante', async () => {
    supabaseWithLead('contrato_enviado');

    const response = await POST(signed({ event: 'DOCUMENT_COMPLETED', payload: { recipients: [] } }));

    expect(response.status).toBe(400);
  });
});
