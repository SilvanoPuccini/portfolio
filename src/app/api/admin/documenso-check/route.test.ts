import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/admin-auth', () => ({ isAuthorized: vi.fn().mockReturnValue(true) }));
vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin: vi.fn() }));

import { isAuthorized } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase';
vi.mock('@/lib/leads/documenso-contract', async (original) => ({
  ...(await original<typeof import('@/lib/leads/documenso-contract')>()),
  createContract: vi.fn(),
}));

import { createContract } from '@/lib/leads/documenso-contract';
import { GET, POST } from './route';

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

/** La tabla de pedidos, que es donde se registra lo que el cliente eligió. */
function tablaPedidos(error: unknown = null) {
  vi.mocked(getSupabaseAdmin).mockReturnValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue({ error }) }),
    }),
  } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isAuthorized).mockReturnValue(true);
  tablaPedidos();
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

  it('avisa si falta correr la migración de pedidos', async () => {
    // Sin esa tabla, el botón de contratar devuelve 500 y el cliente ve un
    // «probá de nuevo» que no se arregla probando de nuevo.
    documenso([{ ok: true, body: PLANTILLA }]);
    tablaPedidos({ message: 'relation "pedidos" does not exist' });

    const body = await (await pedido()).json();

    expect(body.tablaPedidos).toBe(false);
    expect(body.listo).toBe(false);
    expect(body.problema).toMatch(/migración/i);
  });

  it('con la tabla creada, esa línea queda en verde', async () => {
    documenso([{ ok: true, body: PLANTILLA }]);

    const body = await (await pedido()).json();

    expect(body.tablaPedidos).toBe(true);
    expect(body.listo).toBe(true);
  });

  it('sin sesión de admin no contesta nada', async () => {
    vi.mocked(isAuthorized).mockReturnValue(false);
    expect((await pedido()).status).toBe(401);
  });
});

describe('POST /api/admin/documenso-check', () => {
  const prueba = () => POST(new NextRequest('http://localhost/x', { method: 'POST' }));

  it('crea un contrato de prueba y devuelve dónde se firma', async () => {
    vi.mocked(createContract).mockResolvedValue({
      envelopeId: 'env_1', signingUrl: 'https://app.documenso.com/sign/abc', token: 'abc',
    });

    const body = await (await prueba()).json();

    expect(body.ok).toBe(true);
    expect(body.signingUrl).toContain('/sign/abc');
    // Con datos de prueba evidentes: esto no puede parecer una venta real.
    expect(vi.mocked(createContract).mock.calls[0][0].nombre).toMatch(/prueba/i);
  });

  it('cuando Documenso rechaza, muestra el error tal cual lo dijo', async () => {
    vi.mocked(createContract).mockRejectedValue(new Error('Documenso 400: invalid enum value'));

    const body = await (await prueba()).json();

    expect(body.ok).toBe(false);
    expect(body.error).toContain('invalid enum value');
  });

  it('sin sesión de admin no crea nada', async () => {
    vi.mocked(isAuthorized).mockReturnValue(false);
    expect((await prueba()).status).toBe(401);
    expect(createContract).not.toHaveBeenCalled();
  });
});
