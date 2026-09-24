import { NextRequest, NextResponse } from 'next/server';

import { isAuthorized } from '@/lib/admin-auth';
import { tipoReal } from '@/lib/leads/comprobante';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * El comprobante en sí, para verlo dentro del panel.
 *
 * Antes el panel abría un link firmado de Supabase en otra pestaña: para
 * mirar una captura había que salir de la ficha, y el link con el CBU del
 * cliente quedaba en el historial del navegador. Ahora se sirve desde acá,
 * con la sesión de admin, y se muestra en una vista previa sobre la ficha.
 *
 * El tipo se vuelve a mirar en los bytes: lo que se guardó antes de validar
 * por contenido podría ser cualquier cosa, y no se sirve nada que no sea una
 * imagen o un PDF. Las imágenes van además en sandbox: aunque algo se colara,
 * no puede ejecutar nada.
 */

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { id } = await params;
  const db = getSupabaseAdmin();

  const { data } = await db
    .from('pedidos')
    .select('comprobante_path')
    .eq('lead_id', id)
    .not('comprobante_path', 'is', null)
    .order('comprobante_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const path = (data as { comprobante_path: string } | null)?.comprobante_path;
  if (!path) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  const { data: archivo, error } = await db.storage.from('comprobantes').download(path);
  if (error || !archivo) {
    console.error(`[admin/comprobante/archivo] No se pudo bajar «${path}»:`, error);
    return NextResponse.json({ error: 'No se pudo obtener el comprobante.' }, { status: 502 });
  }

  const bytes = Buffer.from(await archivo.arrayBuffer());
  const tipo = tipoReal(bytes);
  if (!tipo) {
    return NextResponse.json({ error: 'El archivo no es una imagen ni un PDF.' }, { status: 415 });
  }

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      'Content-Type': tipo.mime,
      'Content-Disposition': `inline; filename="comprobante${tipo.extension}"`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store',
      // Solo se deja embeber en el propio panel. El visor de PDF del
      // navegador no abre en sandbox; una imagen sí, y ahí no ejecuta nada.
      'Content-Security-Policy': tipo.clase === 'imagen'
        ? "sandbox; default-src 'none'; img-src 'self'; frame-ancestors 'self'"
        : "frame-ancestors 'self'",
    },
  });
}
