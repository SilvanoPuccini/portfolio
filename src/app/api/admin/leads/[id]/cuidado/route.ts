import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase';
export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await getSupabaseAdmin().from('pedidos').select('id, paquete, firmado_at').eq('lead_id', (await params).id).order('created_at', { ascending: false }).limit(50);
  if (error) return NextResponse.json({ error: 'No se pudieron cargar los proyectos.' }, { status: 503 });
  return NextResponse.json({ orders: data }, { headers: { 'Cache-Control': 'no-store' } });
}
