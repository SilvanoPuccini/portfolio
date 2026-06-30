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
      .select('id, created_at, nombre, email, tipo_proyecto, presupuesto_rango, plazo, estado')
      .order('created_at', { ascending: false });

    if (estado) {
      query = query.eq('estado', estado);
    }

    const { data, error } = await query;

    if (error) throw error;
    return NextResponse.json({ leads: data });
  } catch (err) {
    console.error('[admin/leads] GET error:', err);
    return NextResponse.json({ error: 'Error al obtener leads.' }, { status: 500 });
  }
}
