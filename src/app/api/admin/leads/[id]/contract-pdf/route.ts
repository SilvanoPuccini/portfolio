import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isAuthorized } from '@/lib/admin-auth';
import { signedContractUrl } from '@/lib/leads/contract-archive';

export const dynamic = 'force-dynamic';

/**
 * Abre el contrato firmado que quedó archivado.
 *
 * El bucket es privado a propósito —contratos con datos personales y montos—,
 * así que el archivo nunca tiene un link público fijo. Cada vez que se abre se
 * genera un link firmado que vence en cinco minutos y se redirige ahí.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { data, error } = await getSupabaseAdmin()
    .from('leads').select('contrato_pdf_path').eq('id', id).maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data?.contrato_pdf_path) {
    return NextResponse.json({ error: 'Este lead no tiene un contrato firmado archivado.' }, { status: 404 });
  }

  const url = await signedContractUrl(data.contrato_pdf_path);
  if (!url) return NextResponse.json({ error: 'No se pudo abrir el archivo.' }, { status: 502 });

  return NextResponse.redirect(url);
}
