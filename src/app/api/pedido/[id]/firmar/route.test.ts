import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: vi.fn().mockReturnValue(true) }));
vi.mock('@/lib/leads/exchange-rate', () => ({ quoteFor: vi.fn().mockResolvedValue(null) }));
vi.mock('@/lib/resend', () => ({ sendCrmEmail: vi.fn() }));

import { getSupabaseAdmin } from '@/lib/supabase';
import { rateLimit } from '@/lib/rate-limit';
import { sendCrmEmail } from '@/lib/resend';
import { firmarVerificacion } from '@/lib/leads/acceso-cliente';
import { createRevision } from '@/lib/leads/contract-revision';
import { contratoDeVenta } from '@/content/contrato';
import { paquetePorSlug } from '@/content/servicios';
import { POST } from './route';

// Cada caso arma un .docx de verdad con `docx`, que tarda. Con la suite
// completa corriendo en paralelo eso rozaba los 5 segundos del default y el
// archivo fallaba de a ratos: un test que a veces se cae enseña a ignorar los
// rojos, que es peor que no tenerlo.
vi.setConfig({ testTimeout: 20_000 });

const REVISION = createRevision(contratoDeVenta({ paquete: paquetePorSlug('landing')!, extras: [], cliente: { nombre: 'Estefanía Ortigosa' }, totalUsd: 450, jurisdiccion: 'Argentina' }));
const PEDIDO = {
  contrato_snapshot: REVISION,
  id: 'pedido-1', lead_id: 'lead-1', paquete: 'landing', extras: [],
  total_usd: 450, mensual_usd: 0, locale: 'es', firmado_at: null as string | null,
};

const LEAD = {
  id: 'lead-1', nombre: 'Estefanía Ortigosa', email: 'este@ejemplo.com',
  pais: 'Argentina', localidad: 'Córdoba', estado: 'contrato_enviado',
  contrato_firmado_at: null as string | null,
};

const rpc = vi.fn();
const insertFirma = vi.fn();
const updateLead = vi.fn();
const updatePedido = vi.fn();
const upload = vi.fn();

function supabase(pedido: unknown = PEDIDO, lead: unknown = LEAD) {
  insertFirma.mockResolvedValue({ error: null });
  rpc.mockImplementation(async (_name: string, args: { p_evidence: Record<string, string> | null }) => {
    if (!args.p_evidence) return { data: null, error: null };
    const result = await insertFirma(args.p_evidence);
    if (result.error) return { data: null, error: result.error };
    return { data: { firmadoAt: args.p_evidence.firmado_at, created: true }, error: null };
  });
  updateLead.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  updatePedido.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  upload.mockResolvedValue({ error: null });

  vi.mocked(getSupabaseAdmin).mockReturnValue({
    rpc,
    from: vi.fn((tabla: string) => {
      if (tabla === 'firmas') return { insert: insertFirma };
      if (tabla === 'pedidos') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: pedido }) }),
          }),
          update: updatePedido,
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: lead }) }),
        }),
        update: updateLead,
      };
    }),
    storage: { from: vi.fn(() => ({ upload })) },
  } as never);
}

const post = (body: unknown, id = 'pedido-1') =>
  POST(
    new NextRequest('http://localhost/x', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '190.1.2.3', 'user-agent': 'Chrome', cookie: `pedido_email_verificado=${firmarVerificacion(id, process.env.ADMIN_SESSION_SECRET ?? 'absent')}` },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  );

const FIRMA = { revision: REVISION.revision, nombre: 'Estefanía Ortigosa', acepta: true };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(rateLimit).mockReturnValue(true);
  process.env.ADMIN_SESSION_SECRET = 'secreto-de-prueba-largo';
  process.env.ADMIN_EMAIL = 'silvano@ejemplo.com';
  supabase();
});

describe('POST /api/pedido/[id]/firmar', () => {
  it('registra la firma con toda su evidencia', async () => {
    const res = await post(FIRMA);

    expect(res.status).toBe(200);

    const guardada = insertFirma.mock.calls[0][0] as Record<string, string>;
    expect(guardada.nombre).toBe('Estefanía Ortigosa');
    expect(guardada.ip).toBe('190.1.2.3');
    expect(guardada.navegador).toContain('Chrome');
    expect(guardada.huella).toHaveLength(64);
    expect(guardada.texto).toContain('PARTES');
  });

  it('mueve la venta y marca el pedido como firmado', async () => {
    await post(FIRMA);

    expect(rpc).toHaveBeenCalledWith('persist_verified_order_signature', expect.objectContaining({
      p_order_id: 'pedido-1', p_lead_id: 'lead-1', p_expected_state: 'contrato_enviado', p_next_state: 'contrato_firmado',
      p_evidence: expect.objectContaining({ firmado_at: expect.any(String) }),
    }));
    expect(updateLead).not.toHaveBeenCalled();
    expect(updatePedido).not.toHaveBeenCalled();
  });

  it('archiva el contrato firmado y le manda la copia con los datos de pago', async () => {
    await post(FIRMA);

    expect(upload).toHaveBeenCalled();
    const [para, asunto, , adjuntos] = vi.mocked(sendCrmEmail).mock.calls[0];
    expect(para).toBe('este@ejemplo.com');
    expect(asunto).toMatch(/firmado/i);
    // PDF, y con la extensión que de verdad le corresponde. Durante un tiempo
    // fue un .docx adjuntado como .pdf: el cliente recibía un archivo de Word
    // que su lector no abría.
    expect((adjuntos as { filename: string }[])[0].filename).toMatch(/\.pdf$/);
  });

  it('archiva el documento con la extensión y el tipo que de verdad tiene', async () => {
    // El tipo se detecta del archivo, no se declara de memoria: así el día que
    // el formato cambie, la ruta y el Content-Type cambian solos. Cuando esto
    // se declaraba a mano, un .docx viajaba diciendo que era un PDF.
    await post(FIRMA);

    const [ruta, contenido, opciones] = upload.mock.calls[0] as [string, Uint8Array, { contentType: string }];
    expect(ruta).toMatch(/\.pdf$/);
    expect(opciones.contentType).toBe('application/pdf');
    expect(Buffer.from(contenido).subarray(0, 5).toString('latin1')).toBe('%PDF-');
  });

  it('el adjunto del correo y el archivo guardado son el mismo documento', async () => {
    await post(FIRMA);

    const [, contenido] = upload.mock.calls[0] as [string, Uint8Array];
    const [, , , adjuntos] = vi.mocked(sendCrmEmail).mock.calls[0];
    const delCorreo = (adjuntos as { content: Buffer }[])[0].content;

    expect(Buffer.from(contenido).equals(delCorreo)).toBe(true);
  });

  it('el nombre tiene que ser el del contrato', async () => {
    const res = await post({ nombre: 'Juan Pérez', acepta: true });

    expect(res.status).toBe(422);
    expect(insertFirma).not.toHaveBeenCalled();
  });

  it('sin aceptar no hay firma', async () => {
    expect((await post({ nombre: 'Estefanía Ortigosa', acepta: false })).status).toBe(400);
    expect(insertFirma).not.toHaveBeenCalled();
  });

  it('un contrato ya firmado no se firma dos veces', async () => {
    supabase(PEDIDO, { ...LEAD, contrato_firmado_at: '2026-09-22T10:00:00Z' });

    const res = await post(FIRMA);

    expect(res.status).toBe(409);
    expect(insertFirma).not.toHaveBeenCalled();
  });

  it('si el correo falla, la firma no se deshace', async () => {
    vi.mocked(sendCrmEmail).mockRejectedValueOnce(new Error('Resend caído'));

    expect((await post(FIRMA)).status).toBe(200);
    expect(insertFirma).toHaveBeenCalled();
  });

  it('un pedido sin venta no se puede firmar', async () => {
    supabase({ ...PEDIDO, lead_id: null });
    expect((await post(FIRMA)).status).toBe(404);
  });

  it('frena a quien insiste', async () => {
    vi.mocked(rateLimit).mockReturnValue(false);
    expect((await post(FIRMA)).status).toBe(429);
  });
});

/**
 * Firmar abre la sesión del cliente.
 *
 * La cookie de acceso se daba solo por el circuito de verificación por
 * correo, que existe para el material del proyecto. El que acababa de firmar
 * no la tenía: pasaba al pago, tocaba «descargar el contrato firmado» y
 * recibía «verificá tu correo para continuar», sobre el documento que acababa
 * de firmar él mismo.
 *
 * Firmar es la acción más fuerte del circuito: si le confiamos el link para
 * obligarse, le confiamos el link para leer lo que firmó.
 */
describe('POST /api/pedido/[id]/firmar — la sesión del que firmó', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rateLimit).mockReturnValue(true);
    process.env.ADMIN_SESSION_SECRET = 'secreto-de-prueba-largo';
    supabase();
  });

  it('deja abierta la sesión del cliente al firmar', async () => {
    const res = await post(FIRMA);

    expect(res.status).toBe(200);
    expect(res.cookies.get('pedido_acceso')).toBeUndefined();
  });

  it('la sesión es httpOnly y no viaja en claro', async () => {
    const cookie = (await post(FIRMA)).cookies.get('pedido_acceso');

    expect(cookie).toBeUndefined();
  });

  it('no abre ninguna sesión si la firma no se registró', async () => {
    insertFirma.mockResolvedValue({ error: { message: 'se cayó' } });

    const res = await post(FIRMA);

    expect(res.status).toBe(500);
    expect(res.cookies.get('pedido_acceso')).toBeUndefined();
  });

  it('sin el secreto configurado, la firma no se pierde', async () => {
    // Una firma vale más que una comodidad: se registra igual y el cliente
    // llega a su contrato por el circuito de verificación de siempre.
    delete process.env.ADMIN_SESSION_SECRET;

    const res = await post(FIRMA);

    expect(res.status).toBe(401);
    expect(insertFirma).not.toHaveBeenCalled();
  });
});

/**
 * El correo de la firma tiene que traer el link de vuelta.
 *
 * Decía «avisame desde tu página» y no había ninguna página a la que ir: el
 * cliente quedaba con los datos para transferir y sin forma de volver a su
 * pedido ni de avisar que pagó. El link es un uuid que vive en la barra del
 * navegador; si cerró la pestaña, se le fue.
 */
describe('POST /api/pedido/[id]/firmar — el correo trae el camino de vuelta', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rateLimit).mockReturnValue(true);
    process.env.NEXT_PUBLIC_SITE_URL = 'https://silvanopuccini.dev';
    supabase();
  });

  it('manda el link del pedido junto con los datos para pagar', async () => {
    await post(FIRMA);

    const [, , html] = vi.mocked(sendCrmEmail).mock.calls[0] as [string, string, string];
    expect(html).toContain('https://silvanopuccini.dev/es/pedido/pedido-1');
  });

  it('respeta el idioma del pedido', async () => {
    supabase({ ...PEDIDO, locale: 'en' });

    await post(FIRMA);

    const [, , html] = vi.mocked(sendCrmEmail).mock.calls[0] as [string, string, string];
    expect(html).toContain('/en/pedido/pedido-1');
  });
});


describe('atomic signature persistence and retries', () => {
  it('fails closed if atomic persistence fails and retries safely', async () => {
    rpc.mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: 'transaction rolled back' } });
    const failed = await post(FIRMA);
    expect(failed.status).toBe(500);
    expect(sendCrmEmail).not.toHaveBeenCalled();
    expect(failed.cookies.get('pedido_acceso')).toBeUndefined();
    expect((await post(FIRMA)).status).toBe(200);
  });

  it('recovers previously saved evidence even if the lead already says signed', async () => {
    supabase(PEDIDO, { ...LEAD, contrato_firmado_at: '2026-09-22T10:00:00Z' });
    rpc.mockResolvedValueOnce({ data: { firmadoAt: '2026-09-22T10:00:00Z', created: false }, error: null });
    const response = await post(FIRMA);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ firmadoAt: '2026-09-22T10:00:00Z' });
    expect(upload).not.toHaveBeenCalled();
    expect(insertFirma).not.toHaveBeenCalled();
    expect(sendCrmEmail).not.toHaveBeenCalled();
  });

  it('does not register evidence if PDF archival failed', async () => {
    upload.mockResolvedValueOnce({ error: { message: 'storage unavailable' } });
    expect((await post(FIRMA)).status).toBe(500);
    expect(insertFirma).not.toHaveBeenCalled();
    expect(sendCrmEmail).not.toHaveBeenCalled();
  });

  it('does not overwrite PDFs or mail a losing concurrent signature', async () => {
    rpc.mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: { firmadoAt: '2026-09-22T10:00:00Z', created: false }, error: null });
    const response = await post(FIRMA);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ firmadoAt: '2026-09-22T10:00:00Z' });
    expect(upload.mock.calls[0][2]).toMatchObject({ upsert: false });
    expect(sendCrmEmail).not.toHaveBeenCalled();
  });
});

describe('signature requires verified email', () => {
  it('rejects a request without OTP proof before reading or writing data', async () => {
    const response = await POST(new NextRequest('http://localhost/x', { method: 'POST', body: JSON.stringify(FIRMA) }), { params: Promise.resolve({ id: 'pedido-1' }) });
    expect(response.status).toBe(401);
    expect(getSupabaseAdmin).not.toHaveBeenCalled();
  });
  it('does not treat the legacy signature-created material cookie as email proof', async () => {
    const { firmarSesion } = await import('@/lib/leads/acceso-cliente');
    process.env.ADMIN_SESSION_SECRET = 'test-secret';
    const response = await POST(new NextRequest('http://localhost/x', { method: 'POST', headers: { cookie: `pedido_acceso=${firmarSesion('pedido-1', 'test-secret')}` }, body: JSON.stringify(FIRMA) }), { params: Promise.resolve({ id: 'pedido-1' }) });
    expect(response.status).toBe(401);
  });
});


it('rejects a stale or missing shown revision without persistence', async () => {
  expect((await post({ ...FIRMA, revision: 'stale' })).status).toBe(409);
  expect((await post({ nombre: FIRMA.nombre, acepta: true })).status).toBe(409);
  expect(rpc).not.toHaveBeenCalled();
});
it.each(['wrong-order', 'expired'])('rejects %s OTP proof', async (kind) => {
  const value = firmarVerificacion(kind === 'wrong-order' ? 'other' : 'pedido-1', process.env.ADMIN_SESSION_SECRET!, kind === 'expired' ? new Date(0) : new Date());
  const res = await POST(new NextRequest('http://localhost/x', { method: 'POST', headers: { cookie: `pedido_email_verificado=${value}` }, body: JSON.stringify(FIRMA) }), { params: Promise.resolve({ id: 'pedido-1' }) });
  expect(res.status).toBe(401);
  expect(getSupabaseAdmin).not.toHaveBeenCalled();
});
it('signs stored text rather than recalculating catalog terms', async () => {
  const response = await post(FIRMA);
  expect(response.status).toBe(200);
  expect(insertFirma).toHaveBeenCalledWith(expect.objectContaining({ texto: REVISION.texto, huella: REVISION.revision }));
});
