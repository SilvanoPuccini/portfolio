import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * El adjunto tiene que viajar.
 *
 * Las plantillas de propuesta y contrato dicen «Encontrás el detalle adjunto» y
 * muestran el nombre del archivo. Durante un tiempo eso fue mentira: el correo
 * salía sin nada y el cliente recibía una promesa vacía. Estos tests existen
 * para que no vuelva a pasar en silencio.
 */

vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin: vi.fn() }));
vi.mock('@/lib/admin-auth', () => ({ isAuthorized: vi.fn().mockReturnValue(true) }));
vi.mock('@/lib/resend', () => ({ sendCrmEmail: vi.fn() }));
vi.mock('@/lib/email-templates/proposal-ready', () => ({ proposalReadyHtml: () => '<p>propuesta</p>' }));
vi.mock('@/lib/email-templates/contract-ready', () => ({ contractReadyHtml: () => '<p>contrato</p>' }));
vi.mock('@/lib/leads/documents', () => ({
  buildProposalDoc: vi.fn(),
  buildContractDoc: vi.fn(),
}));

import { getSupabaseAdmin } from '@/lib/supabase';
import { sendCrmEmail } from '@/lib/resend';
import { buildProposalDoc, buildContractDoc } from '@/lib/leads/documents';
import { POST as sendProposal } from '@/app/api/admin/leads/[id]/send-proposal/route';
import { POST as sendContract } from '@/app/api/admin/leads/[id]/send-contract/route';

function supabaseWithLead() {
  const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  const from = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { nombre: 'Ferrelon', email: 'hola@ferrelon.com', estado: 'en conversación' },
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
const request = () => new NextRequest('http://localhost/x', { method: 'POST' });

/** Los adjuntos con los que se llamó a sendCrmEmail. */
const attachmentsSent = () => vi.mocked(sendCrmEmail).mock.calls[0]?.[3];

describe('el correo de propuesta lleva la propuesta', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabaseWithLead();
    vi.mocked(buildProposalDoc).mockResolvedValue({
      buffer: Buffer.from('docx-de-prueba'), filename: 'propuesta-ferrelon.docx',
    });
  });

  it('adjunta el documento generado', async () => {
    await sendProposal(request(), { params });

    expect(attachmentsSent()).toEqual([
      { filename: 'propuesta-ferrelon.docx', content: expect.any(Buffer) },
    ]);
  });

  it('no manda nada si todavía no hay presupuesto guardado', async () => {
    // Mandar una propuesta sin monto ni horas es mandar un documento vacío.
    vi.mocked(buildProposalDoc).mockResolvedValue(null);

    const response = await sendProposal(request(), { params });

    expect(response.status).toBe(400);
    expect(sendCrmEmail).not.toHaveBeenCalled();
  });

  it('no avanza la venta si el correo no salió', async () => {
    const update = supabaseWithLead();
    vi.mocked(sendCrmEmail).mockRejectedValue(new Error('Resend caído'));

    const response = await sendProposal(request(), { params });

    expect(response.status).toBe(502);
    expect(update).not.toHaveBeenCalled();
  });
});

describe('el correo de contrato lleva el contrato', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabaseWithLead();
    vi.mocked(buildContractDoc).mockResolvedValue({
      buffer: Buffer.from('docx-de-prueba'), filename: 'contrato-ferrelon.docx',
    });
  });

  it('adjunta el documento generado', async () => {
    await sendContract(request(), { params });

    expect(attachmentsSent()).toEqual([
      { filename: 'contrato-ferrelon.docx', content: expect.any(Buffer) },
    ]);
  });

  it('no manda un correo sin contrato: no habría nada que firmar', async () => {
    vi.mocked(buildContractDoc).mockResolvedValue(null);

    const response = await sendContract(request(), { params });

    expect(response.status).toBe(500);
    expect(sendCrmEmail).not.toHaveBeenCalled();
  });
});
