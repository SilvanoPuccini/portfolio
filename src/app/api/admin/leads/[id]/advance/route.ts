import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isAuthorized } from '@/lib/admin-auth';
import { advanceOn, isManualEvent, type ManualEvent } from '@/lib/leads/pipeline';

export const dynamic = 'force-dynamic';

/**
 * Avanzar una venta al paso siguiente, con su marca de tiempo.
 *
 * POST { event: 'contrato_firmado' | 'pago_recibido' | 'facturado' | 'entregado', ... }
 * POST { event: 'perdido', motivo: '...' }
 *
 * `propuesta_enviada` y `contrato_enviado` no se aceptan acá: los dispara el
 * envío real del correo, no un botón. Marcarlos a mano volvería a separar lo
 * que pasó de lo que el panel cree que pasó.
 *
 * El estado lo decide `pipeline.ts`, nunca el cliente. Este endpoint recibe un
 * HECHO y pregunta qué corresponde; si la venta ya está más adelante, guarda
 * igual la marca de tiempo y deja el estado donde está.
 */

/** La fecha que deja cada hecho, además del estado. */
const STAMPS: Record<ManualEvent, string> = {
  contrato_firmado: 'contrato_firmado_at',
  pago_recibido: 'cobrado_at',
  facturado: 'factura_at',
  entregado: 'entregado_at',
};

interface Body {
  event?: string;
  motivo?: string;
  factura_numero?: string;
  sena_pct?: number;
  sena_monto?: number;
  pago_unico?: boolean;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({})) as Body;
  const event = body.event ?? '';

  const db = getSupabaseAdmin();
  const { data: lead, error: readError } = await db
    .from('leads').select('estado').eq('id', id).maybeSingle();

  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 });
  if (!lead) return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });

  const now = new Date().toISOString();

  // Perder no es avanzar: es salir del recorrido. Va por su propio camino y
  // exige un motivo, porque un «descartado» sin razón no enseña nada.
  if (event === 'perdido') {
    const motivo = body.motivo?.trim();
    if (!motivo) {
      return NextResponse.json({ error: 'Falta el motivo por el que se perdió.' }, { status: 400 });
    }
    const { error } = await db.from('leads')
      .update({ estado: 'descartado', perdido_motivo: motivo, perdido_at: now })
      .eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ estado: 'descartado' });
  }

  if (!isManualEvent(event)) {
    return NextResponse.json({
      error: `Hecho no aceptado: "${event}". La propuesta y el contrato se mueven al mandarse.`,
    }, { status: 400 });
  }

  if (event === 'facturado' && !body.factura_numero?.trim()) {
    return NextResponse.json({ error: 'Falta el número de factura.' }, { status: 400 });
  }

  const nextState = advanceOn(event, lead.estado ?? '');

  const updates: Record<string, unknown> = { [STAMPS[event]]: now };
  if (nextState) updates.estado = nextState;
  if (event === 'facturado') updates.factura_numero = body.factura_numero?.trim();
  if (event === 'pago_recibido') {
    // El porcentaje lo elige una persona: el panel solo sugiere.
    if (typeof body.sena_pct === 'number') updates.sena_pct = body.sena_pct;
    if (typeof body.sena_monto === 'number') updates.sena_monto = body.sena_monto;
    if (typeof body.pago_unico === 'boolean') updates.pago_unico = body.pago_unico;
  }

  const { error } = await db.from('leads').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // `estado` ausente significa que la venta ya estaba más adelante: el hecho
  // quedó registrado y nada retrocedió.
  return NextResponse.json({ ...(nextState ? { estado: nextState } : {}), registrado: event });
}
