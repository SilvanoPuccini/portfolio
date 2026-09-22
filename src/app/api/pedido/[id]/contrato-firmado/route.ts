import { NextRequest, NextResponse } from 'next/server';

import { descargarContratoFirmado } from '@/lib/leads/documenso-contract';
import { rateLimit } from '@/lib/rate-limit';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * El contrato firmado, descargable desde la página del pedido.
 *
 * El cliente lo recibe por correo, pero un correo se borra y un adjunto se
 * pierde. Su contrato tiene que estar siempre a un clic del mismo link que ya
 * conoce, sin tener que buscar nada.
 *
 * El id del pedido es un uuid: quien lo tiene es quien compró.
 */

export const dynamic = 'force-dynamic';

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

  if (!lead?.contrato_firmado_at || !lead.contrato_envelope_id) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const pdf = await descargarContratoFirmado(lead.contrato_envelope_id);
  if (!pdf) {
    return NextResponse.json({ error: 'No se pudo obtener el contrato.' }, { status: 502 });
  }

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition':
        `attachment; filename="Contrato ${nombreDeArchivo(lead.nombre)}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
