import { getSupabaseAdmin } from '@/lib/supabase';
import { sendCrmEmail } from '@/lib/resend';
import { escapeHtml } from '@/lib/html-escape';
import { sendContractToLead } from './send-contract';

/**
 * Lo que pasa cuando el cliente contesta la propuesta desde el correo.
 *
 * Acepta y el contrato sale solo: para él es un clic, y para el panel siguen
 * siendo dos etapas —propuesta y contrato— que es lo que permite medir cuántas
 * propuestas se aceptan y mandar el seguimiento de las que no.
 *
 * Dice que no y no se pierde nada: el motivo queda guardado y la venta NO se
 * da por perdida. Un «no por ahora» con motivo es la mejor información que se
 * puede recibir, y casi siempre es una negociación, no un final.
 */

export type ProposalAnswer = 'aceptada' | 'rechazada';

export type ResponseResult =
  | { ok: true; answer: ProposalAnswer; contrato: 'enviado' | 'con_problema' | 'no_corresponde'; detail?: string }
  | { ok: false; reason: 'not_found' | 'already_answered' | 'db_failed'; answer?: ProposalAnswer; detail?: string };

interface LeadRow {
  id: string;
  nombre: string;
  email: string;
  propuesta_respuesta: string | null;
}

/** Le avisa a Silvano. Que falle el aviso no invalida la respuesta del cliente. */
async function notifyOwner(lead: LeadRow, answer: ProposalAnswer, motivo?: string) {
  const to = process.env.ADMIN_EMAIL;
  if (!to) return;

  const title = answer === 'aceptada'
    ? `${lead.nombre} aceptó la propuesta`
    : `${lead.nombre} dijo que no por ahora`;

  const body = answer === 'aceptada'
    ? 'El contrato salió automáticamente. Revisá la ficha por si hay que ajustar algo.'
    : `Motivo: ${motivo?.trim() || 'no dejó motivo'}. La venta sigue abierta: llamalo.`;

  try {
    await sendCrmEmail(to, title, `<p>${escapeHtml(title)}.</p><p>${escapeHtml(body)}</p>`);
  } catch (reason) {
    console.warn('[proposal-response] No se pudo avisar:', reason instanceof Error ? reason.message : reason);
  }
}

export async function recordProposalResponse(
  token: string, answer: ProposalAnswer, motivo?: string,
): Promise<ResponseResult> {
  const db = getSupabaseAdmin();

  const { data, error } = await db
    .from('leads')
    .select('id, nombre, email, propuesta_respuesta')
    .eq('propuesta_token', token)
    .maybeSingle();

  if (error) return { ok: false, reason: 'db_failed', detail: error.message };
  if (!data) return { ok: false, reason: 'not_found' };

  const lead = data as LeadRow;

  // Dos clics en el mismo botón no mandan dos contratos.
  if (lead.propuesta_respuesta) {
    return { ok: false, reason: 'already_answered', answer: lead.propuesta_respuesta as ProposalAnswer };
  }

  const { error: updateError } = await db
    .from('leads')
    .update({
      propuesta_respuesta: answer,
      propuesta_respondida_at: new Date().toISOString(),
      propuesta_rechazo_motivo: answer === 'rechazada' ? (motivo?.trim() || null) : null,
    })
    .eq('id', lead.id);

  if (updateError) return { ok: false, reason: 'db_failed', detail: updateError.message };

  if (answer === 'rechazada') {
    await notifyOwner(lead, answer, motivo);
    return { ok: true, answer, contrato: 'no_corresponde' };
  }

  const sent = await sendContractToLead(lead.id);
  await notifyOwner(lead, answer);

  // Si el contrato no salió, la aceptación igual quedó registrada: es un dato
  // del cliente y no se pierde porque falle un envío nuestro.
  return sent.ok
    ? { ok: true, answer, contrato: 'enviado' }
    : { ok: true, answer, contrato: 'con_problema', detail: sent.reason };
}
