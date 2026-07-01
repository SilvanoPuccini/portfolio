import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isAuthorized } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data, error } = await getSupabaseAdmin()
      .from('modulos_precio')
      .select('*')
      .order('categoria')
      .order('slug');

    if (error) throw error;
    return NextResponse.json({ modulos: data });
  } catch (err) {
    console.error('[admin/modulos] GET error:', err);
    return NextResponse.json({ error: 'Error fetching modules.' }, { status: 500 });
  }
}
