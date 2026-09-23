import { NextRequest, NextResponse } from 'next/server';

import { COOKIE_ACCESO, tieneAcceso } from '@/lib/leads/acceso-cliente';
import { descargarContratoFirmado } from '@/lib/leads/documenso-contract';
import { rateLimit } from '@/lib/rate-limit';
import { nombreConExtension, tipoDeDocumento, type TipoDeArchivo } from '@/lib/leads/tipo-de-archivo';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * El contrato firmado, a un clic de la página del pedido.
 *
 * El cliente lo recibe por correo, pero un correo se borra y un adjunto se
 * pierde. Su contrato tiene que estar siempre en el mismo link que ya conoce,
 * sin tener que buscar nada.
 *
 * Buscaba el archivo SOLO en Documenso, por su `contrato_envelope_id`. Desde
 * que se firma en nuestro sitio ese campo queda null y el PDF vive en nuestro
 * Storage: el cliente firmaba, pedía su copia y se encontraba con un error.
 * Ahora sale del archivo propio, y Documenso queda de respaldo para los
 * contratos viejos que se firmaron allá.
 *
 * El id del pedido es un uuid, pero no alcanza: el contrato lleva el nombre,
 * el domicilio y el precio del cliente, así que además hay que haber
 * verificado el correo.
 */

export const dynamic = 'force-dynamic';

const BUCKET = 'contratos';

function getIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
}

/** Sin los caracteres que rompen la descarga en Windows. */
function nombreDeArchivo(nombre: string): string {
  return nombre.replace(/[\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) || 'Cliente';
}

/**
 * El `Content-Disposition`, con el nombre intacto y el header válido.
 *
 * El nombre iba crudo: «Contrato Estefanía Ortigosa.pdf». Los headers HTTP
 * son ASCII por norma, así que una í o una ñ ahí adentro llega corrupta o
 * hace que el navegador descarte la respuesta entera, y el cliente ve «hay un
 * problema con el PDF» sobre un archivo que está perfecto.
 *
 * El RFC 5987 resuelve justo esto: un nombre plano para el que no entienda
 * nada, y el de verdad en `filename*`, codificado en UTF-8.
 */
function comoSeLlama(nombreCliente: string, tipo: TipoDeArchivo): string {
  const limpio = nombreDeArchivo(nombreCliente);
  const archivo = nombreConExtension(`Contrato ${limpio}`, tipo);

  // Sin acentos ni nada raro: es el respaldo, no el nombre bueno.
  const plano = archivo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/["\\]/g, '')
    .trim() || `Contrato${tipo.extension}`;

  return `inline; filename="${plano}"; filename*=UTF-8''${encodeURIComponent(archivo)}`;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!rateLimit(`contrato-pdf:${getIp(req)}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  const { id } = await params;

  // El contrato lleva el nombre, el domicilio y el precio del cliente: no se
  // entrega solo con el link.
  if (!tieneAcceso(req.cookies.get(COOKIE_ACCESO)?.value, id)) {
    return NextResponse.json({ error: 'Verificá tu correo para continuar.' }, { status: 401 });
  }

  const db = getSupabaseAdmin();

  const { data: pedido } = await db
    .from('pedidos')
    .select('id, lead_id')
    .eq('id', id)
    .maybeSingle();

  const leadId = (pedido as { lead_id: string | null } | null)?.lead_id;
  if (!leadId) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  const { data } = await db
    .from('leads')
    .select('nombre, contrato_envelope_id, contrato_firmado_at')
    .eq('id', leadId)
    .maybeSingle();

  const lead = data as {
    nombre: string; contrato_envelope_id: string | null; contrato_firmado_at: string | null;
  } | null;

  // Sin firma no hay copia que dar: lo que se descarga es el contrato firmado.
  if (!lead?.contrato_firmado_at) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const propio = await archivoPropio(id);
  const pdf = propio.pdf ?? await archivoDeDocumenso(lead.contrato_envelope_id);

  if (!pdf) {
    // El motivo va en la respuesta a propósito: un fallo mudo no se puede
    // arreglar. El cliente dice «hay un problema con el PDF» y con un solo
    // mensaje para los tres caminos no hay nada que mirar del otro lado.
    // Sin rutas internas: es información para diagnosticar, no para filtrar.
    console.error(`[contrato-firmado] Sin archivo para el pedido ${id}: ${propio.motivo}`);
    return NextResponse.json(
      { error: 'No se pudo obtener el contrato.', motivo: propio.motivo },
      { status: 502 },
    );
  }

  // El tipo se mira, no se declara. Esto se servía como «application/pdf»
  // porque la variable se llamaba `pdf`, y el documento que genera `Packer` es
  // un .docx: el navegador recibía un archivo de Word diciendo que era un PDF
  // y no lo podía abrir. Detectarlo acá arregla también los que ya están
  // guardados con el nombre equivocado.
  const tipo = tipoDeDocumento(pdf);

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'Content-Type': tipo.mime,
      // `inline` y no `attachment`: que lo vea en el navegador y lo guarde si
      // quiere. Bajar a ciegas un archivo que no se puede mirar es pedirle al
      // cliente que confíe en que su contrato dice lo que dijimos.
      'Content-Disposition': comoSeLlama(lead.nombre, tipo),
      'Cache-Control': 'private, no-store',
    },
  });
}

/** Por qué no se pudo entregar el archivo propio. */
type MotivoSinArchivo = 'sin-archivo' | 'archivo-perdido';

/**
 * El PDF que archivamos al firmar, con la evidencia adentro.
 *
 * Devuelve también por qué falló: no es lo mismo que la firma nunca haya
 * dejado un archivo —el upload al Storage se cayó al firmar— que el archivo
 * esté registrado y no aparezca. El primero se arregla mirando el bucket; el
 * segundo, la firma.
 */
async function archivoPropio(
  pedidoId: string,
): Promise<{ pdf: Buffer | null; motivo: MotivoSinArchivo }> {
  const db = getSupabaseAdmin();

  const { data } = await db
    .from('firmas')
    .select('pdf_path')
    .eq('pedido_id', pedidoId)
    .order('firmado_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const path = (data as { pdf_path: string | null } | null)?.pdf_path;
  if (!path) return { pdf: null, motivo: 'sin-archivo' };

  const { data: archivo, error } = await db.storage.from(BUCKET).download(path);
  if (error || !archivo) {
    // El archivo se perdió pero la firma existe: se intenta el otro camino
    // antes de decirle que no hay contrato.
    console.error(`[contrato-firmado] No se pudo bajar «${path}» del Storage:`, error);
    return { pdf: null, motivo: 'archivo-perdido' };
  }

  return { pdf: Buffer.from(await archivo.arrayBuffer()), motivo: 'archivo-perdido' };
}

/** Los contratos viejos, firmados cuando la firma la hacía Documenso. */
async function archivoDeDocumenso(envelopeId: string | null): Promise<Buffer | null> {
  if (!envelopeId) return null;
  return descargarContratoFirmado(envelopeId);
}
