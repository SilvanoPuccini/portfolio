import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createContract, descargarContratoFirmado, prefillFor, signerOf } from './documenso-contract';

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

  it('manda el tipo en minúscula, que es el único que Documenso acepta', () => {
    // El sobre devuelve «TEXT» y el rellenado espera «text». Mandar el valor
    // tal cual hacía que Documenso rechazara la llamada entera.
    const fields = [{ id: 1, type: 'TEXT', fieldMeta: { label: 'cliente' } }];
    expect(prefillFor(fields, DATA)).toEqual([{ id: 1, type: 'text', value: 'Ferrelon' }]);
  });

  it('traduce cada tipo al que espera el rellenado', () => {
    const fields = [
      { id: 1, type: 'NUMBER', fieldMeta: { label: 'precio' } },
      { id: 2, type: 'DROPDOWN', fieldMeta: { label: 'pago' } },
    ];
    expect(prefillFor(fields, DATA)).toEqual([
      { id: 1, type: 'number', value: 'USD 4.800' },
      { id: 2, type: 'dropdown', value: DATA.pago },
    ]);
  });

  it('no intenta rellenar una firma ni un campo que se completa solo', () => {
    // SIGNATURE, EMAIL y NAME no están entre los tipos rellenables: mandarlos
    // hace fallar toda la llamada, no solo ese campo.
    const fields = [
      { id: 1, type: 'SIGNATURE', fieldMeta: { label: 'cliente' } },
      { id: 2, type: 'EMAIL', fieldMeta: { label: 'email' } },
      { id: 3, type: 'TEXT', fieldMeta: { label: 'precio' } },
    ];
    expect(prefillFor(fields, DATA)).toEqual([{ id: 3, type: 'text', value: 'USD 4.800' }]);
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

describe('signerOf con dos firmantes', () => {
  it('elige al cliente, no a Silvano, aunque él esté primero', () => {
    // Un contrato lo firman los dos. Si el código pisa el destinatario
    // equivocado, el cliente recibe el contrato en lugar del proveedor y la
    // copia final sale con una sola firma.
    const recipients = [
      { id: 1, role: 'SIGNER', signingOrder: 1, email: 'silvano@silvanopuccini.dev' },
      { id: 2, role: 'SIGNER', signingOrder: 2, email: 'cliente@ejemplo.com' },
    ];
    expect(signerOf(recipients, 'silvano@silvanopuccini.dev')?.id).toBe(2);
  });

  it('sin saber cuál es el del proveedor, sigue eligiendo por orden de firma', () => {
    const recipients = [
      { id: 1, role: 'SIGNER', signingOrder: 2 },
      { id: 2, role: 'SIGNER', signingOrder: 1 },
    ];
    expect(signerOf(recipients)?.id).toBe(2);
  });

  it('si el único firmante es el proveedor, no inventa otro', () => {
    const recipients = [{ id: 1, role: 'SIGNER', signingOrder: 1, email: 'silvano@x.dev' }];
    expect(signerOf(recipients, 'silvano@x.dev')).toBeNull();
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

  it('el documento lleva un título nuestro, no el nombre del archivo PDF', async () => {
    // El cliente recibía un correo que decía «PLANTILLA-para-documenso.pdf
    // fue firmado». Eso no es un contrato, es una filtración de cómo está
    // hecho el sistema.
    process.env.DOCUMENSO_TEMPLATE_ID = 'envelope_abc';
    const fetchMock = mockEnvelope();

    await createContract({ ...DATA, titulo: 'Contrato de servicios · Landing' });

    const payload = JSON.parse((fetchMock.mock.calls[1][1].body as FormData).get('payload') as string);
    expect(payload.override.title).toBe('Contrato de servicios · Landing');
    expect(payload.override.subject).toMatch(/contrato/i);
  });

  it('Documenso no manda ningún correo: los mandamos nosotros', async () => {
    // Los correos del circuito salen de nuestro dominio, con nuestro diseño.
    // Los de Documenso llegaban con su marca en el momento más importante.
    process.env.DOCUMENSO_TEMPLATE_ID = 'envelope_abc';
    const fetchMock = mockEnvelope();

    await createContract(DATA);

    const payload = JSON.parse((fetchMock.mock.calls[1][1].body as FormData).get('payload') as string);
    // Ni uno solo, ni al cliente ni a Silvano.
    for (const valor of Object.values(payload.override.emailSettings)) {
      expect(valor).toBe(false);
    }
    // Pero el documento sí se distribuye: es lo que lo deja firmable.
    expect(payload.distributeDocument).toBe(true);
  });

  it('si el plan no permite los ajustes finos, crea el contrato igual', async () => {
    // Los correos personalizados y el redirect son del plan Platform. Sin
    // ellos el contrato tiene que salir igual: un plan limitado no puede
    // costar una venta.
    process.env.DOCUMENSO_TEMPLATE_ID = 'envelope_abc';
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          fields: [{ id: 2, type: 'TEXT', fieldMeta: { label: 'precio' } }],
          recipients: [{ id: 5, role: 'SIGNER', signingOrder: 1 }],
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () => 'Esta función no está disponible en tu plan actual',
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'env_1',
          recipients: [{ token: 'abc', signingUrl: 'https://app.documenso.com/sign/abc' }],
        }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const result = await createContract(DATA, 'https://x/gracias');

    expect(result.token).toBe('abc');
    // El segundo intento va sin lo que el plan no soporta, pero con el
    // título y el prefill, que es lo que hace al contrato.
    const segundo = JSON.parse((fetchMock.mock.calls[2][1].body as FormData).get('payload') as string);
    expect(segundo.override.emailSettings).toBeUndefined();
    expect(segundo.override.redirectUrl).toBeUndefined();
    expect(segundo.override.title).toBeTruthy();
    expect(segundo.prefillFields).toHaveLength(1);
  });

  it('cualquier rechazo del sobre se reintenta sin los ajustes opcionales', async () => {
    // El título, el asunto y el redirect son mejoras; el contrato es la venta.
    // Si Documenso rechaza el pedido completo, se manda lo mínimo antes de
    // darse por vencido, diga lo que diga el mensaje.
    process.env.DOCUMENSO_TEMPLATE_ID = 'envelope_abc';
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          fields: [{ id: 2, type: 'TEXT', fieldMeta: { label: 'precio' } }],
          recipients: [{ id: 5, role: 'SIGNER', signingOrder: 1 }],
        }),
      })
      .mockResolvedValueOnce({ ok: false, status: 400, text: async () => 'invalid override' })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'env_1',
          recipients: [{ token: 'abc', signingUrl: 'https://app.documenso.com/sign/abc' }],
        }),
      });
    vi.stubGlobal('fetch', fetchMock);

    expect((await createContract(DATA)).token).toBe('abc');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('un fallo del servidor de Documenso no se reintenta en vano', async () => {
    // Un 500 es de ellos: mandar lo mismo otra vez no cambia nada.
    process.env.DOCUMENSO_TEMPLATE_ID = 'envelope_abc';
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ fields: [], recipients: [{ id: 5, role: 'SIGNER' }] }),
      })
      .mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'Internal error' });
    vi.stubGlobal('fetch', fetchMock);

    await expect(createContract(DATA)).rejects.toThrow('500');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('si el plan se quedó sin documentos, no reintenta al pedo', async () => {
    // El tope es de documentos: mandar el mismo pedido otra vez lo rechaza
    // igual y solo hace esperar más al cliente.
    process.env.DOCUMENSO_TEMPLATE_ID = 'envelope_abc';
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ fields: [], recipients: [{ id: 5, role: 'SIGNER' }] }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => '{"message":"You have reached your document limit.","code":"LIMIT_EXCEEDED"}',
      });
    vi.stubGlobal('fetch', fetchMock);

    await expect(createContract(DATA)).rejects.toThrow(/LIMIT_EXCEEDED|document limit/);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('si el segundo intento también falla, avisa con el error original', async () => {
    process.env.DOCUMENSO_TEMPLATE_ID = 'envelope_abc';
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ fields: [], recipients: [{ id: 5, role: 'SIGNER' }] }),
      })
      .mockResolvedValueOnce({ ok: false, status: 400, text: async () => 'campo invalido' })
      .mockResolvedValueOnce({ ok: false, status: 400, text: async () => 'campo invalido' });
    vi.stubGlobal('fetch', fetchMock);

    await expect(createContract(DATA)).rejects.toThrow('campo invalido');
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

describe('descargarContratoFirmado', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DOCUMENSO_API_TOKEN = 'api_test';
  });
  afterEach(() => vi.unstubAllGlobals());

  const sobre = (items: unknown) => ({
    ok: true,
    json: async () => ({ envelopeItems: items }),
  });

  it('trae el PDF firmado para adjuntarlo a nuestro correo', async () => {
    const pdf = Buffer.from('%PDF-1.7 firmado');
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(sobre([{ id: 'item_1' }]))
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/pdf' }),
        arrayBuffer: async () => pdf.buffer.slice(pdf.byteOffset, pdf.byteOffset + pdf.byteLength),
      });
    vi.stubGlobal('fetch', fetchMock);

    const buffer = await descargarContratoFirmado('envelope_abc');

    expect(buffer?.toString()).toContain('firmado');
    expect(fetchMock.mock.calls[1][0]).toContain('/envelope/item/item_1/download');
    expect(fetchMock.mock.calls[1][0]).toContain('version=signed');
  });

  it('sigue el link cuando Documenso devuelve una dirección en vez del archivo', async () => {
    const pdf = Buffer.from('%PDF desde el link');
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(sobre([{ id: 'item_1' }]))
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ downloadUrl: 'https://cdn.documenso.com/x.pdf' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => pdf.buffer.slice(pdf.byteOffset, pdf.byteOffset + pdf.byteLength),
      });
    vi.stubGlobal('fetch', fetchMock);

    expect((await descargarContratoFirmado('envelope_abc'))?.toString()).toContain('desde el link');
  });

  it('si falla no rompe nada: el correo de pago sale igual, sin adjunto', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => 'x' }));
    expect(await descargarContratoFirmado('envelope_abc')).toBeNull();

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('sin red')));
    expect(await descargarContratoFirmado('envelope_abc')).toBeNull();
  });

  it('sin sobre no intenta nada', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(await descargarContratoFirmado('')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
