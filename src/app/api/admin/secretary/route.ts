import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isAuthorized } from '@/lib/admin-auth';
import { collectAlerts } from '@/lib/admin/collect-alerts';
import { isSummaryFresh, writeSummary } from '@/lib/admin/secretary';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * El resumen del día, escrito por la IA sobre los avisos que ya existen.
 *
 * GET  → { enabled, summary, writtenAt, provider, stale? }
 * POST → { enabled } con el interruptor cambiado, o `refresh: true` para
 *        volver a pedirlo aunque el de hoy siga fresco.
 *
 * Una llamada por día: el resumen se cachea en `site_settings` y se reusa
 * hasta que cambia el día en Buenos Aires. Abrir el tablero cinco veces no
 * puede costar cinco llamadas al modelo — el motivo entero de poner la IA
 * arriba de las reglas es que salga barata.
 *
 * Si el modelo falla, el endpoint NO falla: devuelve `stale` con el último
 * resumen que haya. Los avisos viven en su propio endpoint y no dependen de
 * este, así que el tablero nunca se queda mudo por una cuota agotada.
 */

interface SecretaryRow {
  ai_secretary: boolean;
  secretary_summary: string | null;
  secretary_summary_at: string | null;
  secretary_provider: string | null;
}

const COLUMNS = 'ai_secretary, secretary_summary, secretary_summary_at, secretary_provider';

async function readSettings() {
  const { data, error } = await getSupabaseAdmin()
    .from('site_settings').select(COLUMNS).eq('id', 1).maybeSingle();
  return { row: (data ?? null) as SecretaryRow | null, error };
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { row, error } = await readSettings();
  if (error) {
    return NextResponse.json({ enabled: false, available: false, detail: error.message });
  }
  if (!row?.ai_secretary) {
    return NextResponse.json({ enabled: false, available: true });
  }

  if (isSummaryFresh(row.secretary_summary_at, new Date()) && row.secretary_summary) {
    return NextResponse.json({
      enabled: true, available: true,
      summary: row.secretary_summary,
      writtenAt: row.secretary_summary_at,
      provider: row.secretary_provider,
    });
  }

  return generate(row);
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({})) as { enabled?: boolean; refresh?: boolean };
  const { row, error } = await readSettings();

  if (error) {
    return NextResponse.json({
      error: `No se puede usar el secretario: falta la migración 023. ${error.message}`,
    }, { status: 503 });
  }

  // Volver a pedir el resumen de hoy: es el "reporte cuando se lo pedís".
  if (body.refresh) {
    if (!row?.ai_secretary) {
      return NextResponse.json({ error: 'El secretario está apagado' }, { status: 409 });
    }
    return generate(row);
  }

  const next = typeof body.enabled === 'boolean' ? body.enabled : !row?.ai_secretary;
  const { error: writeError } = await getSupabaseAdmin()
    .from('site_settings')
    .upsert({ id: 1, ai_secretary: next, updated_at: new Date().toISOString() }, { onConflict: 'id' });

  if (writeError) {
    return NextResponse.json({ error: `No se pudo guardar: ${writeError.message}` }, { status: 500 });
  }

  console.log(`[admin/secretary] Secretario ${next ? 'ACTIVADO' : 'DESACTIVADO'}.`);
  return NextResponse.json({ enabled: next, available: true });
}

/** Pide el resumen, lo guarda y lo devuelve. Un fallo no tumba el tablero. */
async function generate(row: SecretaryRow | null) {
  const { alerts, now } = await collectAlerts();

  try {
    const { summary, provider } = await writeSummary(alerts, now);

    await getSupabaseAdmin().from('site_settings').upsert({
      id: 1,
      secretary_summary: summary,
      secretary_summary_at: now.toISOString(),
      secretary_provider: provider,
      updated_at: now.toISOString(),
    }, { onConflict: 'id' });

    return NextResponse.json({
      enabled: true, available: true, summary, writtenAt: now.toISOString(), provider,
    });
  } catch (reason) {
    const detail = reason instanceof Error ? reason.message : String(reason);
    console.warn('[admin/secretary] No se pudo escribir el resumen:', detail);

    // El resumen de ayer sirve más que un hueco, mientras quede claro que es
    // viejo. Los avisos de abajo siguen intactos: son reglas, no dependen
    // de que haya cuota.
    return NextResponse.json({
      enabled: true, available: true, stale: true, detail,
      summary: row?.secretary_summary ?? null,
      writtenAt: row?.secretary_summary_at ?? null,
      provider: row?.secretary_provider ?? null,
    });
  }
}
