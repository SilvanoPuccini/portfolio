import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isAuthorized } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

/**
 * GET  → devuelve { autopilot: boolean }
 * POST → alterna el valor y devuelve el nuevo { autopilot: boolean }
 *
 * El piloto automático controla si el Cron puede generar y publicar hilos
 * en X sin intervención manual. Cuando está apagado el Cron sigue corriendo
 * pero omite la generación y la publicación; el botón "Publicar ahora" del
 * panel también queda oculto para que quede claro que X es manual.
 */

async function readAutopilot(): Promise<boolean> {
  const { data } = await getSupabaseAdmin()
    .from('site_settings')
    .select('x_autopilot')
    .eq('id', 1)
    .single();
  return data?.x_autopilot ?? false;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const autopilot = await readAutopilot();
  return NextResponse.json({ autopilot });
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({})) as { autopilot?: boolean };

  // Si viene el valor explícito lo usamos; si no, alternamos.
  const current = await readAutopilot();
  const next = typeof body.autopilot === 'boolean' ? body.autopilot : !current;

  await getSupabaseAdmin()
    .from('site_settings')
    .update({ x_autopilot: next, updated_at: new Date().toISOString() })
    .eq('id', 1);

  console.log(`[x/autopilot] Piloto automático ${next ? 'ACTIVADO' : 'DESACTIVADO'}.`);
  return NextResponse.json({ autopilot: next });
}
