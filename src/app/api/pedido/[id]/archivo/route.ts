import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

import { COOKIE_ACCESO, tieneAcceso } from '@/lib/leads/acceso-cliente';
import { rateLimit } from '@/lib/rate-limit';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * Los archivos del proyecto: el logo, las fotos, la planilla de productos.
 *
 * Van a un bucket privado. Nunca se sirven por URL pública: el panel los abre
 * con un link firmado que vence. Las fotos del local de un cliente no tienen
 * por qué ser indexables por Google.
 *
 * El nombre que manda el navegador NO decide dónde se guarda. Un archivo
 * llamado «../../otra-carpeta/x.png» escribiría fuera de lo suyo, así que el
 * destino lo arma el servidor y del nombre original solo se conserva la
 * extensión, para saber qué es.
 */

export const dynamic = 'force-dynamic';

const BUCKET = 'kickoff';
const MAX_BYTES = 10 * 1024 * 1024;

/** Lo que tiene sentido que mande un cliente para su sitio. */
const TIPOS = new Set([
  'image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/svg+xml', 'image/heic',
  'application/pdf',
  'text/csv', 'text/plain',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

function getIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
}

/** Solo la extensión, en minúscula y sin rarezas. */
function extensionDe(nombre: string): string {
  const punto = nombre.lastIndexOf('.');
  if (punto < 0) return '';
  const ext = nombre.slice(punto + 1).toLowerCase();
  return /^[a-z0-9]{1,5}$/.test(ext) ? `.${ext}` : '';
}

/** Para mostrarlo en el panel sin que rompa nada. */
function nombreVisible(nombre: string): string {
  return nombre.replace(/[\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120) || 'archivo';
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!tieneAcceso(req.cookies.get(COOKIE_ACCESO)?.value, id)) {
      return NextResponse.json({ error: 'Verificá tu correo para continuar.' }, { status: 401 });
    }

    if (!rateLimit(`archivo:${getIp(req)}`, 40, 60_000)) {
      return NextResponse.json({ error: 'Probá de nuevo en un minuto.' }, { status: 429 });
    }

    const form = await req.formData();
    const archivo = form.get('archivo');
    const campo = String(form.get('campo') ?? 'archivo').replace(/[^a-z0-9_-]/gi, '').slice(0, 40);

    if (!(archivo instanceof File) || archivo.size === 0) {
      return NextResponse.json({ error: 'No llegó ningún archivo.' }, { status: 400 });
    }

    if (archivo.size > MAX_BYTES) {
      return NextResponse.json(
        { error: 'El archivo supera los 10 MB. Mandalo más liviano o por correo.' },
        { status: 413 },
      );
    }

    if (!TIPOS.has(archivo.type)) {
      return NextResponse.json(
        { error: 'Ese tipo de archivo no se puede subir. Imágenes, PDF o planillas.' },
        { status: 415 },
      );
    }

    const db = getSupabaseAdmin();

    const { data: pedido } = await db
      .from('pedidos')
      .select('id, lead_id')
      .eq('id', id)
      .maybeSingle();

    const leadId = (pedido as { lead_id: string | null } | null)?.lead_id;
    if (!leadId) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

    // El destino lo arma el servidor: el nombre del cliente no elige carpeta.
    const path = `${leadId}/${campo || 'archivo'}/${randomUUID()}${extensionDe(archivo.name)}`;

    const { error } = await db.storage.from(BUCKET).upload(
      path,
      new Uint8Array(await archivo.arrayBuffer()),
      { contentType: archivo.type, upsert: false },
    );

    if (error) {
      console.error('[api/pedido/archivo] No se pudo guardar:', error);
      return NextResponse.json({ error: 'No se pudo subir el archivo.' }, { status: 500 });
    }

    return NextResponse.json({ path, nombre: nombreVisible(archivo.name) });
  } catch (err) {
    console.error('[api/pedido/archivo] POST error:', err);
    return NextResponse.json({ error: 'No se pudo subir el archivo.' }, { status: 500 });
  }
}
