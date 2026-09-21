import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createContract, prefillFor, signerOf } from './documenso-contract';

const DATA = {
  nombre: 'Ferrelon', email: 'hola@ferrelon.com', total: 4800,
  alcance: 'Catálogo de productos, Pagos online',
  plazo: '15 días hábiles desde la seña',
  pago: 'Seña del 50% para empezar, el resto contra entrega.',
  domicilio: 'Córdoba, Argentina',
  objeto: 'Catálogo online con cobro por link de Mercado Pago.',
  jurisdiccion: 'Tribunales ordinarios de la Ciudad de Buenos Aires.',
};

describe('prefillFor', () => {
  it('llena los campos que la plantilla etiquetó', () => {
    const fields = [
      { id: 1, type: 'text', fieldMeta: { label: 'Cliente' } },
      { id: 2, type: 'text', fieldMeta: { label: 'PRECIO' } },
      { id: 3, type: 'text', fieldMeta: { label: 'alcance' } },
    ];

    expect(prefillFor(fields, DATA)).toEqual([
      { id: 1, type: 'text', value: 'Ferrelon' },
      { id: 2, type: 'text', value: 'USD 4.800' },
      { id: 3, type: 'text', value: 'Catálogo de productos, Pagos online' },
    ]);
  });

  it('llena también el plazo, la forma de pago y la jurisdicción', () => {
    // Son las tres cosas que antes quedaban escritas fijas en el PDF y no
    // podían cambiar por venta ni por país.
    const fields = [
      { id: 1, type: 'text', fieldMeta: { label: 'plazo' } },
      { id: 2, type: 'text', fieldMeta: { label: 'Pago' } },
      { id: 3, type: 'text', fieldMeta: { label: 'jurisdiccion' } },
      { id: 4, type: 'text', fieldMeta: { label: 'domicilio' } },
      { id: 5, type: 'text', fieldMeta: { label: 'objeto' } },
    ];

    expect(prefillFor(fields, DATA)).toEqual([
      { id: 1, type: 'text', value: '15 días hábiles desde la seña' },
      { id: 2, type: 'text', value: 'Seña del 50% para empezar, el resto contra entrega.' },
      { id: 3, type: 'text', value: 'Tribunales ordinarios de la Ciudad de Buenos Aires.' },
      { id: 4, type: 'text', value: 'Córdoba, Argentina' },
      { id: 5, type: 'text', value: 'Catálogo online con cobro por link de Mercado Pago.' },
    ]);
  });

  it('un dato que la venta no tiene deja el campo vacío en vez de escribir «undefined»', () => {
    const fields = [{ id: 1, type: 'text', fieldMeta: { label: 'plazo' } }];
    const sinPlazo = { ...DATA, plazo: '' };
    expect(prefillFor(fields, sinPlazo)).toEqual([]);
  });

  it('ignora los campos que no sabe llenar, sin romper el contrato', () => {
    // Una plantilla puede tener campos que solo llena el firmante.
    const fields = [
      { id: 1, fieldMeta: { label: 'Firma del cliente' } },
      { id: 2, fieldMeta: null },
      { id: 3 },
    ];

    expect(prefillFor(fields, DATA)).toEqual([]);
  });
});

describe('signerOf', () => {
  it('elige al primero que firma, no al que revisa', () => {
    expect(signerOf([
      { id: 9, role: 'VIEWER', signingOrder: 1 },
      { id: 4, role: 'SIGNER', signingOrder: 2 },
      { id: 7, role: 'SIGNER', signingOrder: 3 },
    ])).toMatchObject({ id: 4 });
  });

  it('sin firmantes devuelve null en vez de inventar uno', () => {
    expect(signerOf([{ id: 1, role: 'VIEWER' }])).toBeNull();
    expect(signerOf([])).toBeNull();
  });
});

describe('createContract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DOCUMENSO_API_TOKEN = 'api_test';
    process.env.DOCUMENSO_TEMPLATE_ID = '42';
  });

  afterEach(() => { vi.unstubAllGlobals(); });

  /** La API nueva: el sobre se lee en /envelope/{id} y se usa en /envelope/use. */
  function mockEnvelope() {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          fields: [{ id: 2, type: 'text', fieldMeta: { label: 'precio' } }],
          recipients: [{ id: 5, role: 'SIGNER', signingOrder: 1 }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'envelope_nuevo',
          recipients: [{ token: 'abc', signingUrl: 'https://app.documenso.com/sign/abc' }],
        }),
      });
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  }

  function mockDocumenso(overrides: { created?: unknown; templateOk?: boolean } = {}) {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: overrides.templateOk ?? true,
        json: async () => ({
          fields: [{ id: 2, type: 'text', fieldMeta: { label: 'precio' } }],
          recipients: [{ id: 5, role: 'SIGNER', signingOrder: 1 }],
        }),
        text: async () => 'no existe',
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => overrides.created ?? {
          envelopeId: 'env_1',
          recipients: [{ signingUrl: 'https://app.documenso.com/sign/abc', token: 'abc' }],
        },
        text: async () => '',
      });
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  }

  it('crea el contrato con el precio ya cargado y devuelve dónde firmar', async () => {
    const fetchMock = mockDocumenso();

    const result = await createContract(DATA, 'https://silvanopuccini.dev/propuesta/tok-1');

    const body = JSON.parse(fetchMock.mock.calls[1][1].body as string);
    expect(body.recipients).toEqual([{ id: 5, email: 'hola@ferrelon.com', name: 'Ferrelon' }]);
    expect(body.prefillFields).toEqual([{ id: 2, type: 'text', value: 'USD 4.800' }]);
    expect(body.override.redirectUrl).toContain('/propuesta/tok-1');
    expect(result).toEqual({
      envelopeId: 'env_1', signingUrl: 'https://app.documenso.com/sign/abc', token: 'abc',
    });
  });

  it('también lo manda por mail: si cierra la pestaña, el link le llega igual', async () => {
    const fetchMock = mockDocumenso();

    await createContract(DATA);

    expect(JSON.parse(fetchMock.mock.calls[1][1].body as string).distributeDocument).toBe(true);
  });

  it('con un id de sobre usa la API nueva: /envelope/{id} y /envelope/use', async () => {
    // Documenso reemplazó plantillas y documentos por «envelopes». Pegarle a
    // /template/ con un id de sobre daba 404 y el contrato no se creaba nunca.
    process.env.DOCUMENSO_TEMPLATE_ID = 'envelope_encdeubfauwflbhb';
    const fetchMock = mockEnvelope();

    const result = await createContract(DATA);

    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://app.documenso.com/api/v2/envelope/envelope_encdeubfauwflbhb',
    );
    expect(fetchMock.mock.calls[1][0]).toBe('https://app.documenso.com/api/v2/envelope/use');
    expect(result.signingUrl).toBe('https://app.documenso.com/sign/abc');
  });

  it('el sobre viaja como multipart con el payload adentro', async () => {
    // /envelope/use no acepta JSON: espera multipart con un campo `payload`.
    process.env.DOCUMENSO_TEMPLATE_ID = 'envelope_abc';
    const fetchMock = mockEnvelope();

    await createContract(DATA, 'https://silvanopuccini.dev/propuesta/tok-1', 'pedido-1');

    const enviado = fetchMock.mock.calls[1][1].body as FormData;
    expect(enviado).toBeInstanceOf(FormData);
    const payload = JSON.parse(enviado.get('payload') as string);

    expect(payload.envelopeId).toBe('envelope_abc');
    expect(payload.externalId).toBe('pedido-1');
    expect(payload.recipients).toEqual([{ id: 5, email: 'hola@ferrelon.com', name: 'Ferrelon' }]);
    expect(payload.prefillFields).toEqual([{ id: 2, type: 'text', value: 'USD 4.800' }]);
    expect(payload.distributeDocument).toBe(true);
    expect(payload.override.redirectUrl).toContain('/propuesta/tok-1');
  });

  it('con multipart no fuerza el content-type: lo pone fetch con su frontera', async () => {
    process.env.DOCUMENSO_TEMPLATE_ID = 'envelope_abc';
    const fetchMock = mockEnvelope();

    await createContract(DATA);

    const headers = fetchMock.mock.calls[1][1].headers as Record<string, string>;
    expect(headers['Content-Type']).toBeUndefined();
    expect(headers.Authorization).toBe('api_test');
  });

  it('con un id numérico lo sigue mandando como número', async () => {
    process.env.DOCUMENSO_TEMPLATE_ID = '42';
    const fetchMock = mockDocumenso();

    await createContract(DATA);

    expect(JSON.parse(fetchMock.mock.calls[1][1].body as string).templateId).toBe(42);
  });

  it('sin configuración no inventa nada', async () => {
    delete process.env.DOCUMENSO_TEMPLATE_ID;
    await expect(createContract(DATA)).rejects.toThrow('DOCUMENSO_TEMPLATE_ID');
    process.env.DOCUMENSO_TEMPLATE_ID = '   ';
    await expect(createContract(DATA)).rejects.toThrow('DOCUMENSO_TEMPLATE_ID');

    process.env.DOCUMENSO_TEMPLATE_ID = '42';
    delete process.env.DOCUMENSO_API_TOKEN;
    await expect(createContract(DATA)).rejects.toThrow('DOCUMENSO_API_TOKEN');
  });

  it('avisa si la plantilla no tiene firmante', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, json: async () => ({ fields: [], recipients: [] }), text: async () => '',
    }));

    await expect(createContract(DATA)).rejects.toThrow('firmante');
  });

  it('avisa si Documenso no devuelve el link', async () => {
    mockDocumenso({ created: { envelopeId: 'env_1', recipients: [] } });

    await expect(createContract(DATA)).rejects.toThrow('link de firma');
  });

  it('propaga el error de Documenso con su código', async () => {
    mockDocumenso({ templateOk: false });

    await expect(createContract(DATA)).rejects.toThrow(/Documenso/);
  });
});
