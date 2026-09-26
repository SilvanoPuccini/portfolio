import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAuthorized } from '@/lib/admin-auth';
import { COOKIE_VERIFICADO, tieneVerificacion } from '@/lib/leads/acceso-cliente';
import { getSupabaseAdmin } from '@/lib/supabase';
import { paymentInstructionsFor, FALLBACK_INSTRUCTIONS } from '@/lib/leads/payment-instructions';
import { rateLimit } from '@/lib/rate-limit';
import { adminCommandSchema, buildCareOffer, clientCommandSchema, commandEnvelopeSchema } from './model';

const json = (body: unknown, status=200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
export async function careHandler(req: NextRequest, id: string, actor: 'admin' | 'client') {
  if (!z.string().uuid().safeParse(id).success) return json({ error: 'Pedido inválido.' }, 400);
  const authorized = actor === 'admin' ? isAuthorized(req) : tieneVerificacion(req.cookies.get(COOKIE_VERIFICADO)?.value, id);
  if (!authorized) return json({ error: 'Verifique el acceso antes de continuar.' }, 401);
  if (req.method !== 'GET' && req.headers.get('origin') !== req.nextUrl.origin) return json({ error: 'Origen no permitido.' }, 403);
  try {
    const db = getSupabaseAdmin();
    if (req.method === 'GET') {
      const { data, error } = await db.rpc('read_order_care', { p_order_id: id });
      if (error) return json({ error: 'No se pudo cargar el cuidado. Verifique que la migración 049 esté instalada.' }, 503);
      const { data: order } = await db.from('pedidos').select('lead_id').eq('id', id).maybeSingle();
      const { data: lead } = order?.lead_id ? await db.from('leads').select('pais').eq('id', order.lead_id).maybeSingle() : { data: null };
      const instructions = paymentInstructionsFor(lead?.pais);
      return json({ ...data, paymentInstructions: instructions === FALLBACK_INSTRUCTIONS ? null : instructions });
    }
    if (!rateLimit(`care:${actor}:${id}`, 30, 60_000)) return json({ error: 'Espere un minuto antes de reintentar.' }, 429);
    const envelope = commandEnvelopeSchema.safeParse(await req.json().catch(() => null));
    if (!envelope.success) return json({ error: 'Solicitud inválida.' }, 400);
    const parsed = (actor === 'admin' ? adminCommandSchema : clientCommandSchema).safeParse(envelope.data.command);
    if (!parsed.success) return json({ error: 'Acción o campos inválidos.' }, 400);
    let command: unknown = parsed.data;
    if (parsed.data.action === 'offer') {
      const { data: order, error } = await db.from('pedidos').select('paquete').eq('id', id).maybeSingle();
      if (error || !order) return json({ error: 'Pedido no disponible.' }, 404);
      try {
        const offer = { ...buildCareOffer(order.paquete, parsed.data.startsOn, parsed.data.deliveredOn, parsed.data.quote), inspectionNote: parsed.data.inspectionNote };
        command = { action: 'offer', offer: { ...offer, revision: createHash('sha256').update(JSON.stringify(offer)).digest('hex') } };
      } catch {
        return json({ error: 'Revise el proyecto, la cotización y las fechas: el inicio debe respetar 30 días desde la entrega.' }, 400);
      }
    }
    const { data, error } = await db.rpc('transition_order_care', {
      p_order_id: id, p_actor: actor, p_request_id: envelope.data.requestId,
      p_expected_version: envelope.data.expectedVersion, p_command: command,
    });
    if (error) return json({ error: 'No se pudo aplicar la acción. Actualice la vista y revise estado, fechas, cupo y referencia de pago. Ningún cambio parcial se guardó.' }, 409);
    return json(data);
  } catch {
    return json({ error: 'El servicio no está disponible. Reintente con la misma solicitud.' }, 503);
  }
}
