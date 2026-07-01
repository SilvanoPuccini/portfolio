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
      .from('rate_config')
      .select('tarifa_hora, buffer_pct')
      .eq('id', 1)
      .single();

    if (error) throw error;
    return NextResponse.json({ config: data });
  } catch (err) {
    console.error('[admin/config] GET error:', err);
    return NextResponse.json({ error: 'Error fetching config.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const updates: Record<string, number> = {};

    if (typeof body.tarifa_hora === 'number') updates.tarifa_hora = body.tarifa_hora;
    if (typeof body.buffer_pct === 'number') updates.buffer_pct = body.buffer_pct;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 });
    }

    const { error } = await getSupabaseAdmin()
      .from('rate_config')
      .update(updates)
      .eq('id', 1);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/config] PATCH error:', err);
    return NextResponse.json({ error: 'Error updating config.' }, { status: 500 });
  }
}
