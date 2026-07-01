import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isAuthorized } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const { data, error } = await getSupabaseAdmin()
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return NextResponse.json({ lead: data });
  } catch (err) {
    console.error('[admin/leads/[id]] GET error:', err);
    return NextResponse.json({ error: 'Error al obtener lead.' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json() as Record<string, unknown>;

    const allowedStrings = [
      'titular', 'localidad', 'pais', 'notas_llamada', 'estado',
      'diagnostico_objetivo', 'diagnostico_situacion', 'diagnostico_requerimiento',
    ];
    const allowedNumbers = ['monto_presupuestado', 'horas_calculadas'];

    const updates: Record<string, unknown> = {};
    for (const key of allowedStrings) {
      if (key in body) {
        const v = body[key];
        if (v !== null && typeof v !== 'string') {
          return NextResponse.json({ error: `Field "${key}" must be a string or null.` }, { status: 400 });
        }
        updates[key] = v;
      }
    }
    for (const key of allowedNumbers) {
      if (key in body) {
        const v = body[key];
        if (v !== null && typeof v !== 'number') {
          return NextResponse.json({ error: `Field "${key}" must be a number or null.` }, { status: 400 });
        }
        updates[key] = v;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update.' }, { status: 400 });
    }

    const { error } = await getSupabaseAdmin()
      .from('leads')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/leads/[id]] PATCH error:', err);
    return NextResponse.json({ error: 'Error al actualizar lead.' }, { status: 500 });
  }
}
