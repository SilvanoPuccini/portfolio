import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: vi.fn().mockReturnValue(true) }));
vi.mock('@/lib/resend', () => ({ sendCrmEmail: vi.fn() }));

import { getSupabaseAdmin } from '@/lib/supabase';
import { rateLimit } from '@/lib/rate-limit';
import { sendCrmEmail } from '@/lib/resend';
import { POST } from './route';

// Cada caso arma un .docx de verdad con `docx`, que tarda. Con la suite
// completa corriendo en paralelo eso rozaba los 5 segundos del default y el
// archivo fallaba de a ratos: un test que a veces se cae enseña a ignorar los
// rojos, que es peor que no tenerlo.
vi.setConfig({ testTimeout: 20_000 });

const PEDIDO = {
  id: 'pedido-1', lead_id: 'lead-1', paquete: 'landing', extras: [],
  total_usd: 450, mensual_usd: 0, locale: 'es', firmado_at: null as string | null,
};

const LEAD = {
  id: 'lead-1', nombre: 'Estefanía Ortigosa', email: 'este@ejemplo.com',
  pais: 'Argentina', localidad: 'Córdoba', estado: 'contrato_enviado',
  contrato_firmado_at: null as string | null,
};

const insertFirma = vi.fn();
const updateLead = vi.fn();
const updatePedido = vi.fn();
const upload = vi.fn();

function supabase(pedido: unknown = PEDIDO, lead: unknown = LEAD) {
  insertFirma.mockResolvedValue({ error: null });
  updateLead.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  updatePedido.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  upload.mockResolvedValue({ error: null });

  vi.mocked(getSupabaseAdmin).mockReturnValue({
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
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '190.1.2.3', 'user-agent': 'Chrome' },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  );

const FIRMA = { nombre: 'Estefanía Ortigosa', acepta: true };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(rateLimit).mockReturnValue(true);
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

    expect(updateLead).toHaveBeenCalledWith(expect.objectContaining({
      contrato_firmado_at: expect.any(String),
      estado: 'contrato_firmado',
    }));
    expect(updatePedido).toHaveBeenCalledWith(expect.objectContaining({
      firmado_at: expect.any(String),
    }));
  });

  it('archiva el contrato firmado y le manda la copia con los datos de pago', async () => {
    await post(FIRMA);

    expect(upload).toHaveBeenCalled();
    const [para, asunto, , adjuntos] = vi.mocked(sendCrmEmail).mock.calls[0];
    expect(para).toBe('este@ejemplo.com');
    expect(asunto).toMatch(/firmado/i);
    // `.docx` y no `.pdf`: el documento lo genera `docx`, y adjuntarlo como
    // PDF le daba al cliente un archivo de Word que su lector no abría.
    expect((adjuntos as { filename: string }[])[0].filename).toMatch(/\.docx$/);
  });

  it('archiva el documento con la extensión y el tipo que de verdad tiene', async () => {
    // Se guardaba como «.pdf» con contentType application/pdf. El archivo
    // estaba sano: lo que estaba mal era cómo se lo presentaba.
    await post(FIRMA);

    const [ruta, , opciones] = upload.mock.calls[0] as [string, unknown, { contentType: string }];
    expect(ruta).toMatch(/\.docx$/);
    expect(opciones.contentType).toContain('wordprocessingml');
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
    expect(res.cookies.get('pedido_acceso')?.value).toContain('pedido-1');
  });

  it('la sesión es httpOnly y no viaja en claro', async () => {
    const cookie = (await post(FIRMA)).cookies.get('pedido_acceso');

    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.secure).toBe(true);
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

    expect(res.status).toBe(200);
    expect(insertFirma).toHaveBeenCalled();
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
