import { NextRequest, NextResponse } from 'next/server';

import { COOKIE_ACCESO, tieneAcceso } from '@/lib/leads/acceso-cliente';
import { descargarContratoFirmado } from '@/lib/leads/documenso-contract';
import { rateLimit } from '@/lib/rate-limit';
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

  const pdf = await archivoPropio(id) ?? await archivoDeDocumenso(lead.contrato_envelope_id);
  if (!pdf) {
    return NextResponse.json({ error: 'No se pudo obtener el contrato.' }, { status: 502 });
  }

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      // `inline` y no `attachment`: que lo vea en el navegador y lo guarde si
      // quiere. Bajar a ciegas un archivo que no se puede mirar es pedirle al
      // cliente que confíe en que su contrato dice lo que dijimos.
      'Content-Disposition':
        `inline; filename="Contrato ${nombreDeArchivo(lead.nombre)}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  });
}

/** El PDF que archivamos al firmar, con la evidencia adentro. */
async function archivoPropio(pedidoId: string): Promise<Buffer | null> {
  const db = getSupabaseAdmin();

  const { data } = await db
    .from('firmas')
    .select('pdf_path')
    .eq('pedido_id', pedidoId)
    .order('firmado_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const path = (data as { pdf_path: string | null } | null)?.pdf_path;
  if (!path) return null;

  const { data: archivo, error } = await db.storage.from(BUCKET).download(path);
  if (error || !archivo) {
    // El archivo se perdió pero la firma existe: se intenta el otro camino
    // antes de decirle que no hay contrato.
    console.error('[contrato-firmado] No se pudo bajar del Storage:', error);
    return null;
  }

  return Buffer.from(await archivo.arrayBuffer());
}

/** Los contratos viejos, firmados cuando la firma la hacía Documenso. */
async function archivoDeDocumenso(envelopeId: string | null): Promise<Buffer | null> {
  if (!envelopeId) return null;
  return descargarContratoFirmado(envelopeId);
}
