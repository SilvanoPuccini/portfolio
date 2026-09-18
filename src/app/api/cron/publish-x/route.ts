import { NextRequest, NextResponse } from 'next/server';
import { isApiKeyAuthorized, isCronAuthorized } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isCreditsDepletedError } from '@/lib/x/client';
import { dueNow, pendingGeneration } from '@/lib/x/repository';
import { generateThread, publishThreadNow } from '@/lib/x/service';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Con cuántos días de anticipación se escribe cada hilo.
 *
 * Tres días de colchón: si la generación falla o el crítico rechaza dos veces,
 * queda margen para arreglarlo antes de perder el turno. Generar el mismo día
 * no deja lugar para nada.
 */
const GENERATE_DAYS_AHEAD = 3;

/**
 * Corre una vez por día y hace dos trabajos: publica lo que vence hoy y
 * escribe lo que vence en tres días.
 *
 * Es un cron aparte del blog, con su propia URL y su propia tabla. Tocar este
 * timbre no puede disparar la publicación de un post del blog: son dos puertas
 * distintas con código distinto.
 *
 * En plan Hobby de Vercel la cadencia mínima es diaria y la hora se garantiza
 * dentro de la hora, no al minuto. Alcanza: sale un hilo por día como máximo.
 */
export async function GET(req: NextRequest) {
  // Solo credencial por header. Este endpoint publica en una cuenta real, así
  // que abrir la URL en el navegador estando logueado no puede dispararlo.
  if (!isCronAuthorized(req) && !isApiKeyAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Interruptor desde la base: si el piloto está apagado el cron no genera
  // ni publica. El env var X_AUTOPUBLISH=off sigue siendo el freno de
  // emergencia (no requiere deploy ni UI).
  if (process.env.X_AUTOPUBLISH === 'off') {
    return NextResponse.json({ paused: true, reason: 'env', published: 0, generated: 0 });
  }

  const { data: settings } = await getSupabaseAdmin()
    .from('site_settings').select('x_autopilot').eq('id', 1).single();

  if (!settings?.x_autopilot) {
    return NextResponse.json({ paused: true, reason: 'manual_mode', published: 0, generated: 0 });
  }

  const published: string[] = [];
  const generated: string[] = [];
  const blocked: { id: string; reason: string }[] = [];
  const failed: { id: string; error: string }[] = [];
  const skippedCredits: string[] = [];

  // 1. Publicar lo que vence hoy y ya pasó los controles.
  for (const thread of await dueNow()) {
    try {
      const result = await publishThreadNow(thread);
      if (!result.alreadyPublished) published.push(result.thread.published_url ?? thread.id);
    } catch (reason) {
      // Un 402 de crédito no es un fallo: el circuito es manual y la persona
      // ya lo sabe desde el panel. El cron no debe hacer ruido por eso.
      if (isCreditsDepletedError(reason)) {
        skippedCredits.push(thread.id);
        continue;
      }
      failed.push({ id: thread.id, error: reason instanceof Error ? reason.message : 'error' });
    }
  }

  // 2. Escribir lo que vence pronto, para que llegue validado a su turno.
  for (const thread of await pendingGeneration(GENERATE_DAYS_AHEAD)) {
    try {
      const updated = await generateThread(thread);
      if (updated.status === 'preaprobado') generated.push(updated.id);
      else blocked.push({ id: updated.id, reason: updated.last_error ?? 'sin motivo' });
    } catch (reason) {
      failed.push({ id: thread.id, error: reason instanceof Error ? reason.message : 'error' });
    }
  }

  if (failed.length || blocked.length) {
    // El silencio no puede parecer éxito: queda en los logs de Vercel y en
    // last_error de cada fila, visible en el panel.
    console.error('[cron/publish-x]', JSON.stringify({ failed, blocked }));
  }

  return NextResponse.json({
    published: published.length,
    generated: generated.length,
    blocked: blocked.length,
    failed: failed.length,
    skipped_credits: skippedCredits.length,
    detail: { published, blocked, failed, skipped_credits: skippedCredits },
  });
}
