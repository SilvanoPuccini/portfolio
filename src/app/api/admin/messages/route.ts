import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

import { isAuthorized } from '@/lib/admin-auth';

// GET — listar mensajes
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data, error } = await getSupabaseAdmin()
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ messages: data });
  } catch (err) {
    console.error('[admin/messages] GET error:', err);
    return NextResponse.json({ error: 'Error al obtener mensajes.' }, { status: 500 });
  }
}

// PATCH — marcar como leído
export async function PATCH(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await req.json() as { id: string };

    const { error } = await getSupabaseAdmin()
      .from('contact_messages')
      .update({ read: true })
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/messages] PATCH error:', err);
    return NextResponse.json({ error: 'Error al actualizar mensaje.' }, { status: 500 });
  }
}
