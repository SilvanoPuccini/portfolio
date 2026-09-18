import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isAuthorized } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

/**
 * El interruptor que separa los dos circuitos de X.
 *
 * GET  → { autopilot: boolean, available: boolean, detail?: string }
 * POST → alterna (o fija) el valor y devuelve el nuevo estado.
 *
 * Qué cambia según el valor:
 *
 * - Piloto automático ON  → el cron genera los hilos que faltan y publica en X
 *   por API cuando llega la fecha. Circuito completo sin intervención.
 * - Piloto automático OFF → el cron no toca nada. La generación sigue siendo
 *   automática, pero la dispara el botón "Escribir" del panel, y la publicación
 *   pasa a ser manual: copiar, pegar en X y "Marcar publicado".
 *
 * Lo que NO cambia nunca es el motor: escribir, validar, criticar y reescribir
 * con memoria es el mismo código en los dos modos. Si el manual usara otro
 * camino, uno de los dos quedaría sin arreglar cuando cambie una regla.
 */

/** Lectura tolerante: si la tabla todavía no existe, el modo seguro es OFF. */
async function readAutopilot(): Promise<{ autopilot: boolean; available: boolean; detail?: string }> {
  const { data, error } = await getSupabaseAdmin()
    .from('site_settings')
    .select('x_autopilot')
    .eq('id', 1)
    .maybeSingle();

  // Sin tabla (falta correr la migración 022) el panel tiene que enterarse. Si
  // devolviéramos un `false` liso, el switch mostraría "manual" y el usuario
  // creería que está configurado cuando en realidad no hay dónde guardarlo.
  if (error) return { autopilot: false, available: false, detail: error.message };

  return { autopilot: data?.x_autopilot ?? false, available: true };
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(await readAutopilot());
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({})) as { autopilot?: boolean };
  const current = await readAutopilot();

  if (!current.available) {
    return NextResponse.json({
      error: `No se puede guardar el interruptor: falta la tabla site_settings (migración 022). ${current.detail ?? ''}`.trim(),
    }, { status: 503 });
  }

  // Valor explícito si vino; si no, alterna.
  const next = typeof body.autopilot === 'boolean' ? body.autopilot : !current.autopilot;

  // Upsert y no update: la fila singleton puede no existir si alguien corrió
  // el CREATE TABLE sin el INSERT. Un update contra cero filas no falla, y el
  // panel terminaría mostrando un estado que la base nunca guardó.
  const { error } = await getSupabaseAdmin()
    .from('site_settings')
    .upsert({ id: 1, x_autopilot: next, updated_at: new Date().toISOString() }, { onConflict: 'id' });

  if (error) {
    return NextResponse.json({ error: `No se pudo guardar el interruptor: ${error.message}` }, { status: 500 });
  }

  console.log(`[x/autopilot] Piloto automático ${next ? 'ACTIVADO' : 'DESACTIVADO'}.`);
  return NextResponse.json({ autopilot: next, available: true });
}
