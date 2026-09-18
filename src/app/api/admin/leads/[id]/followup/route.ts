import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isAuthorized } from '@/lib/admin-auth';
import { sendCrmEmail } from '@/lib/resend';
import { draftFollowup } from '@/lib/leads/followup';

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

const COLUMNS = 'nombre, email, estado, monto_presupuestado, proposal_sent_at, '
  + 'diagnostico_requerimiento, diagnostico_dolor, diagnostico_preocupaciones';

/** Lo que el borrador necesita saber de la venta. */
interface FollowupLead {
  nombre: string;
  email: string | null;
  estado: string;
  monto_presupuestado: number | null;
  proposal_sent_at: string | null;
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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { data: lead, error } = await loadLead(id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!lead) return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });

  try {
    const draft = await draftFollowup({
      name: lead.nombre,
      daysWaiting: daysSince(lead.proposal_sent_at),
      amount: lead.monto_presupuestado,
      requirement: lead.diagnostico_requerimiento,
      pain: lead.diagnostico_dolor,
      concerns: lead.diagnostico_preocupaciones,
    });

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

  try {
    await sendCrmEmail(lead.email, subject, `<p>${text.replace(/\n/g, '<br/>')}</p>`);
  } catch (reason) {
    const detail = reason instanceof Error ? reason.message : String(reason);
    return NextResponse.json({ error: `No se pudo enviar: ${detail}` }, { status: 502 });
  }

  // El reloj vuelve a cero: el silencio se cuenta desde el último contacto,
  // no desde la propuesta original. Si no, el aviso quedaría clavado en rojo
  // para siempre aunque hayas hecho el seguimiento.
  await getSupabaseAdmin().from('leads')
    .update({ proposal_sent_at: new Date().toISOString() })
    .eq('id', id);

  return NextResponse.json({ enviado: true });
}
