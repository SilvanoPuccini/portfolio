import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isAuthorized } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const estado = req.nextUrl.searchParams.get('estado');

    let query = getSupabaseAdmin()
      .from('leads')
      // La lista operativa necesita saber hace cuánto pasó cada cosa: sin las
      // fechas de propuesta y contrato, la fila no puede decir «hace 9 días».
      .select('id, created_at, nombre, email, tipo_proyecto, presupuesto_rango, plazo, estado, monto_presupuestado, proposal_sent_at, contract_sent_at, contrato_vencido_at, contrato_abierto_at, contrato_rechazado_at, fecha_llamada')
      .order('created_at', { ascending: false });

    if (estado) {
      query = query.eq('estado', estado);
    }

    const { data, error } = await query;

    if (error) throw error;
    return NextResponse.json({ leads: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[admin/leads] GET error:', message);
    return NextResponse.json({ error: `Error al obtener leads: ${message}` }, { status: 500 });
  }
}
