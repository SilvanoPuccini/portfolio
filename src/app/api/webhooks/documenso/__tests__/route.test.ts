import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin: vi.fn() }));
vi.mock('@/lib/resend', () => ({ sendCrmEmail: vi.fn() }));
vi.mock('@/lib/leads/contract-archive', () => ({ archiveSignedContract: vi.fn() }));

import { getSupabaseAdmin } from '@/lib/supabase';
import { sendCrmEmail } from '@/lib/resend';
import { archiveSignedContract } from '@/lib/leads/contract-archive';
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
      // Documenso manda el secreto tal cual, no un HMAC del cuerpo.
      'x-documenso-secret': secret,
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
  it('acepta el secreto en texto plano, como lo manda Documenso', async () => {
    supabaseWithLead('contrato_enviado');
    const response = await POST(signed(completed()));
    expect(response.status).toBe(200);
  });

  it('encuentra al cliente aunque no sea el primer firmante', async () => {
    // Si Silvano también firma y figura primero, no puede tomarse su correo:
    // la base solo reconoce el del cliente.
    const looked: string[] = [];
    const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    const from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn((_col: string, email: string) => {
          looked.push(email);
          return {
            maybeSingle: vi.fn().mockResolvedValue({
              data: email === 'hola@ferrelon.com'
                ? { id: 'lead-1', nombre: 'Ferrelon', email, estado: 'contrato_enviado',
                    monto_presupuestado: 4800, sena_pct: null, sena_monto: null, pago_unico: null }
                : null,
              error: null,
            }),
          };
        }),
      }),
      update,
    });
    vi.mocked(getSupabaseAdmin).mockReturnValue({ from } as never);

    const body = await (await POST(signed({
      event: 'DOCUMENT_COMPLETED',
      payload: { recipients: [{ email: 'silvano@ejemplo.com' }, { email: 'hola@ferrelon.com' }] },
    }))).json();

    expect(looked).toEqual(['silvano@ejemplo.com', 'hola@ferrelon.com']);
    expect(vi.mocked(sendCrmEmail).mock.calls[0][0]).toBe('hola@ferrelon.com');
    expect(body.action).toBe('contrato_firmado');
    expect(body.mail).toBe('enviado');
  });

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
    expect(body.action).toBe('contrato_firmado');
    expect(body.mail).toBe('enviado');
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

  it('ignora los eventos que el panel no usa', async () => {
    const update = supabaseWithLead('contrato_enviado');

    const body = await (await POST(signed({
      event: 'DOCUMENT_CREATED', payload: { recipients: [{ email: 'hola@ferrelon.com' }] },
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
    expect(body.action).toBe('contrato_firmado');
    expect(body.mail).toContain('Resend caído');
  });

  it('rechaza un aviso sin correo de firmante', async () => {
    supabaseWithLead('contrato_enviado');

    const response = await POST(signed({ event: 'DOCUMENT_COMPLETED', payload: { recipients: [] } }));

    expect(response.status).toBe(400);
  });
});

describe('webhook de Documenso — envío, vencimiento y archivo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DOCUMENSO_WEBHOOK_SECRET = SECRET;
    vi.mocked(sendCrmEmail).mockResolvedValue(undefined as never);
    vi.mocked(archiveSignedContract).mockResolvedValue({
      ok: true, paths: ['lead-1/env_1/contrato-firmado.pdf', 'lead-1/env_1/registro-de-auditoria.pdf'],
    });
  });

  const event = (name: string, extra: Record<string, unknown> = {}) => ({
    event: name,
    payload: { recipients: [{ email: 'hola@ferrelon.com' }], ...extra },
  });

  it('el envío mueve la venta a «contrato enviado» sin mandar ningún mail', async () => {
    // El cliente ya recibe el de Documenso: un segundo mail lo confundiría.
    const update = supabaseWithLead('presupuestado');

    const body = await (await POST(signed(event('DOCUMENT_SENT')))).json();

    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      estado: 'contrato_enviado',
      contract_sent_at: expect.any(String),
      contrato_vencido_at: null,
    }));
    expect(sendCrmEmail).not.toHaveBeenCalled();
    expect(body.action).toBe('contrato_enviado');
  });

  it('marca el contrato vencido sin cambiar el estado', async () => {
    const update = supabaseWithLead('contrato_enviado');

    const body = await (await POST(signed(event('RECIPIENT_EXPIRED')))).json();

    expect(update).toHaveBeenCalledWith({ contrato_vencido_at: expect.any(String) });
    expect(body.action).toBe('contrato_vencido');
  });

  it('no marca vencido un contrato que ya se firmó', async () => {
    const update = supabaseWithLead('contrato_firmado');

    const body = await (await POST(signed(event('RECIPIENT_EXPIRED')))).json();

    expect(update).not.toHaveBeenCalled();
    expect(body.action).toBe('ignored_not_pending');
  });

  it('archiva el PDF firmado y guarda dónde quedó', async () => {
    const update = supabaseWithLead('contrato_enviado');

    const body = await (await POST(signed(event('DOCUMENT_COMPLETED', { envelopeId: 'env_1' })))).json();

    expect(archiveSignedContract).toHaveBeenCalledWith('env_1', 'lead-1');
    expect(update).toHaveBeenCalledWith({ contrato_pdf_path: 'lead-1/env_1/contrato-firmado.pdf' });
    expect(body.archivo).toBe('guardado');
  });

  it('no vuelve a bajar un contrato ya archivado', async () => {
    supabaseWithLead('contrato_firmado', { contrato_pdf_path: 'lead-1/env_1/contrato-firmado.pdf' });

    const body = await (await POST(signed(event('DOCUMENT_COMPLETED', { envelopeId: 'env_1' })))).json();

    expect(archiveSignedContract).not.toHaveBeenCalled();
    expect(body.archivo).toBe('ya_archivado');
  });

  it('si el archivo falla, la firma y el pedido de pago quedan igual', async () => {
    const update = supabaseWithLead('contrato_enviado');
    vi.mocked(archiveSignedContract).mockResolvedValue({ ok: false, detail: 'Falta DOCUMENSO_API_TOKEN' });

    const response = await POST(signed(event('DOCUMENT_COMPLETED', { envelopeId: 'env_1' })));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ estado: 'contrato_firmado' }));
    expect(sendCrmEmail).toHaveBeenCalledOnce();
    expect(body.archivo).toContain('DOCUMENSO_API_TOKEN');
  });
});

describe('webhook de Documenso — apertura y rechazo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DOCUMENSO_WEBHOOK_SECRET = SECRET;
  });

  const withRecipient = (name: string, recipient: Record<string, unknown>) => ({
    event: name,
    payload: { recipients: [{ email: 'hola@ferrelon.com', ...recipient }] },
  });

  it('registra la primera vez que el cliente abre el contrato', async () => {
    const update = supabaseWithLead('contrato_enviado');

    const body = await (await POST(signed(withRecipient('DOCUMENT_OPENED', { readStatus: 'OPENED' })))).json();

    expect(update).toHaveBeenCalledWith({ contrato_abierto_at: expect.any(String) });
    expect(body.action).toBe('contrato_abierto');
  });

  it('no corre el reloj en cada reapertura', async () => {
    // La pregunta es «hace cuánto lo leyó y no firma»: reabrirlo no la cambia.
    const update = supabaseWithLead('contrato_enviado', { contrato_abierto_at: '2026-09-15T10:00:00.000Z' });

    const body = await (await POST(signed(withRecipient('DOCUMENT_OPENED', { readStatus: 'OPENED' })))).json();

    expect(update).not.toHaveBeenCalled();
    expect(body.action).toBe('apertura_ya_registrada');
  });

  it('un rechazo guarda el motivo y NO da la venta por perdida', async () => {
    const update = supabaseWithLead('contrato_enviado');

    const body = await (await POST(signed(withRecipient('DOCUMENT_REJECTED', {
      signingStatus: 'REJECTED', rejectionReason: 'No estoy de acuerdo con la cláusula 7',
    })))).json();

    expect(update).toHaveBeenCalledWith({
      contrato_rechazado_at: expect.any(String),
      contrato_rechazo_motivo: 'No estoy de acuerdo con la cláusula 7',
    });
    // Un rechazo con motivo es una negociación: el estado no se toca.
    expect(update).not.toHaveBeenCalledWith(expect.objectContaining({ estado: expect.anything() }));
    expect(body.action).toBe('contrato_rechazado');
  });

  it('un reenvío limpia la apertura y el rechazo anteriores', async () => {
    const update = supabaseWithLead('contrato_enviado');

    await POST(signed({ event: 'DOCUMENT_SENT', payload: { recipients: [{ email: 'hola@ferrelon.com' }] } }));

    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      contrato_abierto_at: null,
      contrato_rechazado_at: null,
      contrato_rechazo_motivo: null,
    }));
  });
});
