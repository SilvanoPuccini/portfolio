import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin: vi.fn() }));

import { getSupabaseAdmin } from '@/lib/supabase';
import { archiveSignedContract, fetchPdf } from './contract-archive';

const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // "%PDF"

function pdfResponse() {
  return new Response(PDF, { status: 200, headers: { 'content-type': 'application/pdf' } });
}
function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

function storageMock(error: { message: string } | null = null) {
  const upload = vi.fn().mockResolvedValue({ error });
  vi.mocked(getSupabaseAdmin).mockReturnValue({
    storage: { from: vi.fn().mockReturnValue({ upload }) },
  } as never);
  return upload;
}

describe('fetchPdf — acepta las tres formas en que puede venir el PDF', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('el PDF directo', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(pdfResponse()));
    expect(await fetchPdf('https://x/doc', 'api_tok')).toEqual(PDF);
  });

  it('un JSON con link de descarga, que se baja sin el token', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ downloadUrl: 'https://cdn/firmado.pdf' }))
      .mockResolvedValueOnce(pdfResponse());
    vi.stubGlobal('fetch', fetchMock);

    expect(await fetchPdf('https://x/doc', 'api_tok')).toEqual(PDF);
    // El link ya viene firmado: mandarle el token a otro dominio sería filtrarlo.
    expect(fetchMock.mock.calls[1]).toEqual(['https://cdn/firmado.pdf']);
  });

  it('un JSON con el archivo en base64', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      jsonResponse({ data: Buffer.from(PDF).toString('base64') }),
    ));
    expect(await fetchPdf('https://x/doc', 'api_tok')).toEqual(PDF);
  });

  it('manda el token sin «Bearer», como lo pide Documenso', async () => {
    const fetchMock = vi.fn().mockResolvedValue(pdfResponse());
    vi.stubGlobal('fetch', fetchMock);
    await fetchPdf('https://x/doc', 'api_tok');
    expect(fetchMock).toHaveBeenCalledWith('https://x/doc', { headers: { Authorization: 'api_tok' } });
  });

  it('falla con un mensaje claro ante un formato que no conoce', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ otra: 'cosa' })));
    await expect(fetchPdf('https://x/doc', 'api_tok')).rejects.toThrow('Formato de descarga desconocido');
  });
});

describe('archiveSignedContract', () => {
  const saved = process.env.DOCUMENSO_API_TOKEN;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DOCUMENSO_API_TOKEN = 'api_tok';
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    if (saved === undefined) delete process.env.DOCUMENSO_API_TOKEN;
    else process.env.DOCUMENSO_API_TOKEN = saved;
  });

  it('guarda el contrato firmado y el registro de auditoría', async () => {
    const upload = storageMock();
    const fetchMock = vi.fn(async (url: string) => (
      url.endsWith('/envelope/env_1')
        ? jsonResponse({ envelopeItems: [{ id: 'item_1', title: 'Contrato Ferrelon.pdf', order: 1 }] })
        : pdfResponse()
    ));
    vi.stubGlobal('fetch', fetchMock);

    const result = await archiveSignedContract('env_1', 'lead-1');

    expect(result).toEqual({
      ok: true,
      paths: ['lead-1/env_1/contrato-ferrelon-firmado.pdf', 'lead-1/env_1/registro-de-auditoria.pdf'],
    });
    expect(fetchMock.mock.calls.map(([url]) => url)).toContain(
      'https://app.documenso.com/api/v2/envelope/item/item_1/download?version=signed',
    );
    expect(upload).toHaveBeenCalledTimes(2);
  });

  it('sin token no intenta nada y lo dice', async () => {
    delete process.env.DOCUMENSO_API_TOKEN;
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await archiveSignedContract('env_1', 'lead-1');

    expect(result).toMatchObject({ ok: false, detail: expect.stringContaining('DOCUMENSO_API_TOKEN') });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('si falla solo el registro de auditoría, el contrato queda guardado igual', async () => {
    const upload = storageMock();
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.endsWith('/envelope/env_1')) return jsonResponse({ envelopeItems: [{ id: 'item_1', title: 'Contrato' }] });
      if (url.includes('audit-log')) return jsonResponse({ error: 'no' }, 500);
      return pdfResponse();
    }));

    const result = await archiveSignedContract('env_1', 'lead-1');

    expect(result).toEqual({ ok: true, paths: ['lead-1/env_1/contrato-firmado.pdf'] });
    expect(upload).toHaveBeenCalledOnce();
  });

  it('nunca lanza: un error de Documenso vuelve como resultado', async () => {
    storageMock();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, 401)));

    const result = await archiveSignedContract('env_1', 'lead-1');

    expect(result).toMatchObject({ ok: false, detail: expect.stringContaining('401') });
  });

  it('informa si Storage rechaza la subida', async () => {
    storageMock({ message: 'Bucket not found' });
    vi.stubGlobal('fetch', vi.fn(async (url: string) => (
      url.endsWith('/envelope/env_1') ? jsonResponse({ envelopeItems: [{ id: 'item_1', title: 'C' }] }) : pdfResponse()
    )));

    const result = await archiveSignedContract('env_1', 'lead-1');

    expect(result).toMatchObject({ ok: false, detail: expect.stringContaining('Bucket not found') });
  });
});
