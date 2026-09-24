import { NextRequest, NextResponse } from 'next/server';

import { isAuthorized } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import type { Revision } from '@/lib/leads/comprobante-ocr';

/**
 * El comprobante que subió el cliente, con lo que encontró la lectura.
 *
 * Verificar un pago era entrar al banco, buscar el movimiento entre todos los
 * del día y cruzarlo de memoria. Acá está el archivo y lo que la revisión vio
 * en él, para mirar una vez y decidir.
 *
 * El archivo no sale por URL pública ni por link firmado: un comprobante lleva
 * el CBU y el titular de una persona. Lo sirve `comprobante/archivo`, que
 * exige la sesión de admin.
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
    .select('comprobante_path, comprobante_nombre, comprobante_at, comprobante_revision, comprobante_veredicto')
    .eq('lead_id', id)
    .not('comprobante_path', 'is', null)
    .order('comprobante_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const fila = data as {
    comprobante_path: string;
    comprobante_nombre: string | null;
    comprobante_at: string | null;
    comprobante_revision: { revision: Revision } | null;
    comprobante_veredicto: string | null;
  } | null;

  if (!fila) return NextResponse.json({ comprobante: null });

  return NextResponse.json({
    comprobante: {
      nombre: fila.comprobante_nombre,
      subidoEl: fila.comprobante_at,
      // Se sirve desde el propio sitio, con la sesión de admin: así se puede
      // mirar en una vista previa sobre la ficha, sin abrir otra pestaña.
      url: `/api/admin/leads/${id}/comprobante/archivo`,
      clase: /\.pdf$/i.test(fila.comprobante_path) ? 'pdf' : 'imagen',
      veredicto: fila.comprobante_veredicto,
      hallazgos: fila.comprobante_revision?.revision?.hallazgos ?? [],
    },
  });
}
