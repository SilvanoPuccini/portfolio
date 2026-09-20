import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin: vi.fn() }));
vi.mock('@/lib/resend', () => ({ sendCrmEmail: vi.fn() }));
vi.mock('./send-contract', () => ({ sendContractToLead: vi.fn() }));
vi.mock('./documenso-contract', () => ({ createContract: vi.fn() }));

import { getSupabaseAdmin } from '@/lib/supabase';
import { sendCrmEmail } from '@/lib/resend';
import { sendContractToLead } from './send-contract';
import { createContract } from './documenso-contract';
import { recordProposalResponse } from './proposal-response';

const LEAD = {
  id: 'lead-1', nombre: 'Ferrelon', email: 'hola@ferrelon.com', propuesta_respuesta: null,
};

function supabase(lead: Record<string, unknown> | null) {
  const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  const from = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: lead, error: null }) }),
    }),
    update,
  });
  vi.mocked(getSupabaseAdmin).mockReturnValue({ from } as never);
  return update;
}

describe('recordProposalResponse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_EMAIL = 'silvano@ejemplo.com';
    vi.mocked(sendCrmEmail).mockResolvedValue(undefined as never);
    vi.mocked(sendContractToLead).mockResolvedValue({ ok: true, estado: 'contrato_enviado' });
    vi.mocked(createContract).mockResolvedValue({
      envelopeId: 'env_1', signingUrl: 'https://app.documenso.com/sign/abc', token: 'abc',
    });
  });

  it('aceptar crea el contrato y lo deja listo para firmar ahí mismo', async () => {
    // El hueco entre el «sí» y la firma es donde se enfría una venta.
    const update = supabase({
      ...LEAD,
      propuesta_snapshot: { inversion: { total: 4800 }, incluye: [{ titulo: 'Catálogo' }] },
    });

    const result = await recordProposalResponse('tok-1', 'aceptada', undefined, undefined, 'https://x/propuesta/tok-1');

    expect(createContract).toHaveBeenCalledWith(
      { nombre: 'Ferrelon', email: 'hola@ferrelon.com', total: 4800, alcance: 'Catálogo' },
      'https://x/propuesta/tok-1',
    );
    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      contrato_firma_token: 'abc',
      contrato_signing_url: 'https://app.documenso.com/sign/abc',
      estado: 'contrato_enviado',
    }));
    expect(sendContractToLead).not.toHaveBeenCalled();
    expect(result).toMatchObject({ ok: true, contrato: 'para_firmar' });
  });

  it('si Documenso falla, cae al correo con el contrato adjunto', async () => {
    // Que Documenso esté caído no puede costar la venta.
    supabase(LEAD);
    vi.mocked(createContract).mockRejectedValue(new Error('Documenso 500'));

    const result = await recordProposalResponse('tok-1', 'aceptada');

    expect(sendContractToLead).toHaveBeenCalledWith('lead-1');
    expect(result).toMatchObject({ ok: true, contrato: 'enviado' });
  });

  it('le avisa a Silvano que aceptaron', async () => {
    supabase(LEAD);

    await recordProposalResponse('tok-1', 'aceptada');

    expect(vi.mocked(sendCrmEmail).mock.calls[0][0]).toBe('silvano@ejemplo.com');
    expect(vi.mocked(sendCrmEmail).mock.calls[0][1]).toContain('aceptó la propuesta');
  });

  it('rechazar guarda el motivo y NO manda contrato', async () => {
    const update = supabase(LEAD);

    const result = await recordProposalResponse('tok-1', 'rechazada', '  Se me fue de presupuesto  ');

    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      propuesta_respuesta: 'rechazada',
      propuesta_rechazo_motivo: 'Se me fue de presupuesto',
    }));
    expect(sendContractToLead).not.toHaveBeenCalled();
    expect(result).toMatchObject({ ok: true, contrato: 'no_corresponde' });
  });

  it('un «no» sin motivo se guarda igual', async () => {
    const update = supabase(LEAD);

    await recordProposalResponse('tok-1', 'rechazada', '   ');

    expect(update).toHaveBeenCalledWith(expect.objectContaining({ propuesta_rechazo_motivo: null }));
  });

  it('dos clics no mandan dos contratos', async () => {
    supabase({ ...LEAD, propuesta_respuesta: 'aceptada' });

    const result = await recordProposalResponse('tok-1', 'aceptada');

    expect(result).toEqual({ ok: false, reason: 'already_answered', answer: 'aceptada' });
    expect(sendContractToLead).not.toHaveBeenCalled();
  });

  it('un token que no existe no toca nada', async () => {
    const update = supabase(null);

    expect(await recordProposalResponse('cualquier-cosa', 'aceptada')).toEqual({ ok: false, reason: 'not_found' });
    expect(update).not.toHaveBeenCalled();
  });

  it('si el contrato no sale, la aceptación igual queda registrada', async () => {
    // Es un dato del cliente: no se pierde porque falle un envío nuestro.
    const update = supabase(LEAD);
    vi.mocked(createContract).mockRejectedValue(new Error('Documenso caído'));
    vi.mocked(sendContractToLead).mockResolvedValue({ ok: false, reason: 'no_document' });

    const result = await recordProposalResponse('tok-1', 'aceptada');

    expect(update).toHaveBeenCalledWith(expect.objectContaining({ propuesta_respuesta: 'aceptada' }));
    expect(result).toMatchObject({ ok: true, contrato: 'con_problema', detail: 'no_document' });
  });

  it('si el aviso a Silvano falla, la respuesta vale igual', async () => {
    supabase(LEAD);
    vi.mocked(sendCrmEmail).mockRejectedValue(new Error('Resend caído'));

    expect(await recordProposalResponse('tok-1', 'aceptada')).toMatchObject({ ok: true });
  });

  describe('«dejámelo pensar»: la tercera salida', () => {
    it('agenda la fecha que eligió el cliente y NO manda contrato', async () => {
      const update = supabase(LEAD);

      const result = await recordProposalResponse('tok-1', 'pensando', 'Lo hablo con mi socio', '2026-10-01T12:00:00.000Z');

      expect(update).toHaveBeenCalledWith(expect.objectContaining({
        propuesta_respuesta: 'pensando',
        propuesta_recordar_at: '2026-10-01T12:00:00.000Z',
        propuesta_rechazo_motivo: 'Lo hablo con mi socio',
      }));
      expect(sendContractToLead).not.toHaveBeenCalled();
      expect(result).toMatchObject({ ok: true, answer: 'pensando' });
    });

    it('le avisa a Silvano con la fecha, no como si fuera un no', async () => {
      supabase(LEAD);

      await recordProposalResponse('tok-1', 'pensando', undefined, '2026-10-01T12:00:00.000Z');

      expect(vi.mocked(sendCrmEmail).mock.calls[0][1]).toContain('se lo está pensando');
    });

    it('quien lo estaba pensando puede volver y aceptar', async () => {
      // Si «lo pienso» cerrara la puerta, el botón sería una trampa.
      supabase({ ...LEAD, propuesta_respuesta: 'pensando' });

      const result = await recordProposalResponse('tok-1', 'aceptada');

      expect(createContract).toHaveBeenCalled();
      expect(result).toMatchObject({ ok: true, contrato: 'para_firmar' });
    });

    it('pero un sí o un no ya dados no se cambian solos', async () => {
      supabase({ ...LEAD, propuesta_respuesta: 'rechazada' });

      expect(await recordProposalResponse('tok-1', 'aceptada'))
        .toMatchObject({ ok: false, reason: 'already_answered' });
    });

    it('aceptar limpia la fecha de recordatorio', async () => {
      const update = supabase({ ...LEAD, propuesta_respuesta: 'pensando' });

      await recordProposalResponse('tok-1', 'aceptada');

      expect(update).toHaveBeenCalledWith(expect.objectContaining({ propuesta_recordar_at: null }));
    });
  });
});
