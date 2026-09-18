import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin: vi.fn() }));
vi.mock('@/lib/admin-auth', () => ({ isAuthorized: vi.fn().mockReturnValue(true) }));
vi.mock('@/lib/resend', () => ({ sendCrmEmail: vi.fn() }));
vi.mock('@/lib/email-templates/proposal-ready', () => ({ proposalReadyHtml: () => '<p>ok</p>' }));
vi.mock('@/lib/email-templates/contract-ready', () => ({ contractReadyHtml: () => '<p>ok</p>' }));
// El envio ahora exige el documento: sin adjunto, el correo no sale.
vi.mock('@/lib/leads/documents', () => ({
  buildProposalDoc: vi.fn(),
  buildContractDoc: vi.fn(),
}));

import { getSupabaseAdmin } from '@/lib/supabase';
import { sendCrmEmail } from '@/lib/resend';
import { buildProposalDoc, buildContractDoc } from '@/lib/leads/documents';
import { POST as sendProposal } from '@/app/api/admin/leads/[id]/send-proposal/route';
import { POST as sendContract } from '@/app/api/admin/leads/[id]/send-contract/route';

/** Devuelve el lead pedido y captura el update que la ruta haya hecho. */
function supabaseWithLead(estado: string) {
  const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  const from = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { nombre: 'Lucía', email: 'lucia@example.com', estado },
          error: null,
        }),
      }),
    }),
    update,
  });
  vi.mocked(getSupabaseAdmin).mockReturnValue({ from } as never);
  return update;
}

const params = Promise.resolve({ id: 'lead-1' });
const request = (path: string) =>
  new NextRequest(`http://localhost${path}`, { method: 'POST' });

describe('mandar propuesta y contrato mueve el estado del lead', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sendCrmEmail).mockResolvedValue(undefined as never);
    const doc = { buffer: Buffer.from('docx'), filename: 'doc.docx' };
    vi.mocked(buildProposalDoc).mockResolvedValue(doc);
    vi.mocked(buildContractDoc).mockResolvedValue(doc);
  });

  it('la propuesta deja el lead en presupuestado', async () => {
    const update = supabaseWithLead('en conversación');

    const body = await (await sendProposal(
      request('/api/admin/leads/lead-1/send-proposal'), { params },
    )).json();

    expect(body.estado).toBe('presupuestado');
    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      estado: 'presupuestado',
      proposal_sent_at: expect.any(String),
    }));
  });

  it('el contrato deja el lead en contrato_enviado', async () => {
    const update = supabaseWithLead('presupuestado');

    const body = await (await sendContract(
      request('/api/admin/leads/lead-1/send-contract'), { params },
    )).json();

    expect(body.estado).toBe('contrato_enviado');
    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      estado: 'contrato_enviado',
      contract_sent_at: expect.any(String),
    }));
  });

  it('no rebobina una venta ya cobrada', async () => {
    // Reenviar la propuesta a un cliente que ya pagó es normal (se perdió el
    // correo, pidió otra copia). Lo que no puede pasar es que eso lo devuelva
    // a «propuesta enviada» y lo haga aparecer como venta abierta.
    const update = supabaseWithLead('cerrado');

    const body = await (await sendProposal(
      request('/api/admin/leads/lead-1/send-proposal'), { params },
    )).json();

    expect(body.estado).toBeUndefined();
    const written = update.mock.calls[0][0] as Record<string, unknown>;
    expect(written).not.toHaveProperty('estado');
    // La fecha sí se actualiza: el reenvío ocurrió de verdad.
    expect(written).toHaveProperty('proposal_sent_at');
  });

  it('no toca el estado si el correo no salió', async () => {
    const update = supabaseWithLead('en conversación');
    vi.mocked(sendCrmEmail).mockRejectedValue(new Error('Resend caído'));

    const response = await sendProposal(
      request('/api/admin/leads/lead-1/send-proposal'), { params },
    );

    expect(response.status).toBe(502);
    expect(update).not.toHaveBeenCalled();
  });
});
