import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isAuthorized } from '@/lib/admin-auth';
import { sendCrmEmail } from '@/lib/resend';
import { escapeHtml } from '@/lib/html-escape';
import { draftFollowup } from '@/lib/leads/followup';
import { phaseIndex } from '@/lib/leads/pipeline';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * El seguimiento de una propuesta fría.
 *
 * GET  → devuelve el borrador escrito por la IA. No manda nada.
 * POST → manda el texto que vos aprobaste, y reinicia el reloj del silencio.
 *
 * Están separados a propósito. Si un solo llamado escribiera y enviara, el
 * correo saldría sin que nadie lo hubiera leído: la IA redacta, la persona
 * decide. Es la misma frontera del secretario del tablero.
 */

const COLUMNS = 'nombre, email, estado, monto_presupuestado, proposal_sent_at, followup_draft, '
  + 'diagnostico_requerimiento, diagnostico_dolor, diagnostico_preocupaciones';

/** Lo que el borrador necesita saber de la venta. */
interface FollowupLead {
  nombre: string;
  email: string | null;
  estado: string;
  monto_presupuestado: number | null;
  proposal_sent_at: string | null;
  followup_draft: { subject?: string; body?: string } | null;
  diagnostico_requerimiento: string | null;
  diagnostico_dolor: string | null;
  diagnostico_preocupaciones: string | null;
}

async function loadLead(id: string) {
  const { data, error } = await getSupabaseAdmin()
    .from('leads').select(COLUMNS).eq('id', id).maybeSingle();
  return { data: (data ?? null) as FollowupLead | null, error };
}

const daysSince = (iso: string | null) =>
  iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000) : 0;

/**
 * A quién tiene sentido seguirle una propuesta.
 *
 * Un lead dado de baja no recibe correos, y a alguien que ya firmó o pagó
 * pedirle respuesta por una propuesta es, como mínimo, quedar mal.
 */
function canFollowUp(estado: string): boolean {
  if (estado === 'descartado') return false;
  return phaseIndex(estado) < phaseIndex('contrato_firmado');
}

const CLOSED = NextResponse.json(
  { error: 'Esta venta ya no está esperando una respuesta a la propuesta.' },
  { status: 409 },
);

/** Los seguimientos ya enviados, para que el modelo no repita el anterior. */
async function previousFollowups(leadId: string) {
  const { data } = await getSupabaseAdmin()
    .from('lead_followups')
    .select('body, sent_at')
    .eq('lead_id', leadId)
    .order('sent_at', { ascending: true })
    .limit(5);

  return (data ?? []).map((row: { body: string; sent_at: string }) => ({
    body: row.body, sentAt: row.sent_at,
  }));
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { data: lead, error } = await loadLead(id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!lead) return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
  if (!canFollowUp(lead.estado ?? '')) return CLOSED;

  // Cada borrador cuesta cuota: el último escrito se reusa hasta que pidas
  // uno nuevo con ?refresh=1.
  const saved = lead.followup_draft;
  if (!req.nextUrl.searchParams.has('refresh') && saved?.subject && saved?.body) {
    return NextResponse.json({ ...saved, cached: true });
  }

  try {
    const draft = await draftFollowup({
      name: lead.nombre,
      daysWaiting: daysSince(lead.proposal_sent_at),
      amount: lead.monto_presupuestado,
      requirement: lead.diagnostico_requerimiento,
      pain: lead.diagnostico_dolor,
      concerns: lead.diagnostico_preocupaciones,
      previous: await previousFollowups(id),
    });

    await getSupabaseAdmin().from('leads')
      .update({ followup_draft: { subject: draft.subject, body: draft.body } })
      .eq('id', id);

    return NextResponse.json(draft);
  } catch (reason) {
    // Sin cuota no hay borrador, y eso no rompe nada: el aviso del tablero
    // sigue ahí y el correo se puede escribir a mano.
    const detail = reason instanceof Error ? reason.message : String(reason);
    return NextResponse.json({
      error: `No se pudo escribir el borrador: ${detail}`,
    }, { status: 503 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({})) as { subject?: string; body?: string };
  const subject = body.subject?.trim();
  const text = body.body?.trim();

  if (!subject || !text) {
    return NextResponse.json({ error: 'Falta el asunto o el cuerpo del correo.' }, { status: 400 });
  }

  const { data: lead, error } = await loadLead(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!lead?.email) return NextResponse.json({ error: 'El lead no tiene correo.' }, { status: 404 });
  if (!canFollowUp(lead.estado ?? '')) return CLOSED;

  try {
    // El texto se escapa: un «<» escrito a mano rompía el correo entero.
    await sendCrmEmail(lead.email, subject, `<p>${escapeHtml(text).replace(/\n/g, '<br/>')}</p>`);
  } catch (reason) {
    const detail = reason instanceof Error ? reason.message : String(reason);
    return NextResponse.json({ error: `No se pudo enviar: ${detail}` }, { status: 502 });
  }

  const db = getSupabaseAdmin();

  // El reloj vuelve a cero sobre `ultimo_contacto_at`: el silencio se cuenta
  // desde el último contacto, pero la fecha de la propuesta no se toca, que
  // es la que dice cuánto tardó en cerrarse la venta.
  await db.from('leads')
    .update({ ultimo_contacto_at: new Date().toISOString(), followup_draft: null })
    .eq('id', id);

  // Lo enviado queda guardado: el próximo borrador lo lee para no repetirlo.
  await db.from('lead_followups').insert({ lead_id: id, subject, body: text });

  return NextResponse.json({ enviado: true });
}
