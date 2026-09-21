import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/admin-auth', () => ({ isAuthorized: vi.fn().mockReturnValue(true) }));

import { isAuthorized } from '@/lib/admin-auth';
import { GET } from './route';

const pedido = () => GET(new NextRequest('http://localhost/api/admin/documenso-check'));

const PLANTILLA = {
  fields: [
    'cliente', 'domicilio', 'objeto', 'alcance', 'plazo',
    'precio', 'pago', 'jurisdiccion', 'email',
  ].map((label, i) => ({ id: i, type: 'text', fieldMeta: { label } })),
  recipients: [{ id: 1, role: 'SIGNER', signingOrder: 1 }],
};

function documenso(respuestas: { ok: boolean; body?: unknown }[]) {
  const fetchMock = vi.fn();
  for (const r of respuestas) {
    fetchMock.mockResolvedValueOnce({
      ok: r.ok,
      status: r.ok ? 200 : 404,
      json: async () => r.body ?? {},
      text: async () => '',
    });
  }
  fetchMock.mockResolvedValue({ ok: false, status: 404, json: async () => ({}), text: async () => '' });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isAuthorized).mockReturnValue(true);
  process.env.DOCUMENSO_API_TOKEN = 'api_secreto';
  process.env.DOCUMENSO_TEMPLATE_ID = 'envelope_abc';
  process.env.DOCUMENSO_WEBHOOK_SECRET = 'wh_secreto';
});
afterEach(() => vi.unstubAllGlobals());

describe('GET /api/admin/documenso-check', () => {
  it('con todo bien dice que la plantilla está lista', async () => {
    documenso([{ ok: true, body: PLANTILLA }]);

    const body = await (await pedido()).json();

    expect(body.listo).toBe(true);
    expect(body.ruta).toContain('envelope_abc');
    expect(body.faltan).toEqual([]);
    expect(body.firmantes).toBe(1);
  });

  it('nunca devuelve el token, solo si está o no', async () => {
    documenso([{ ok: true, body: PLANTILLA }]);

    const texto = await (await pedido()).text();

    expect(texto).not.toContain('api_secreto');
    expect(texto).not.toContain('wh_secreto');
    expect(JSON.parse(texto).variables).toMatchObject({
      DOCUMENSO_API_TOKEN: true,
      DOCUMENSO_TEMPLATE_ID: true,
      DOCUMENSO_WEBHOOK_SECRET: true,
    });
  });

  it('avisa qué campos le faltan a la plantilla', async () => {
    documenso([{
      ok: true,
      body: { ...PLANTILLA, fields: PLANTILLA.fields.slice(0, 3) },
    }]);

    const body = await (await pedido()).json();

    expect(body.listo).toBe(false);
    expect(body.faltan).toContain('precio');
    expect(body.faltan).toContain('jurisdiccion');
  });

  it('avisa si la plantilla no tiene a nadie que firme', async () => {
    documenso([{ ok: true, body: { ...PLANTILLA, recipients: [{ id: 1, role: 'VIEWER' }] } }]);

    const body = await (await pedido()).json();

    expect(body.listo).toBe(false);
    expect(body.problema).toMatch(/firmante/i);
  });

  it('si ninguna ruta responde, lo dice sin inventar', async () => {
    documenso([{ ok: false }, { ok: false }, { ok: false }, { ok: false }]);

    const body = await (await pedido()).json();

    expect(body.listo).toBe(false);
    expect(body.ruta).toBeNull();
    expect(body.problema).toMatch(/no se pudo leer/i);
  });

  it('sin la variable cargada no llama a Documenso', async () => {
    delete process.env.DOCUMENSO_TEMPLATE_ID;
    const fetchMock = documenso([]);

    const body = await (await pedido()).json();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(body.variables.DOCUMENSO_TEMPLATE_ID).toBe(false);
    expect(body.listo).toBe(false);
  });

  it('sin sesión de admin no contesta nada', async () => {
    vi.mocked(isAuthorized).mockReturnValue(false);
    expect((await pedido()).status).toBe(401);
  });
});
