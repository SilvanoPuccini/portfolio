import { getSupabaseAdmin } from '@/lib/supabase';
import { sendCrmEmail } from '@/lib/resend';
import { contractReadyHtml } from '@/lib/email-templates/contract-ready';
import { buildContractDoc } from '@/lib/leads/documents';
import { advanceOn } from '@/lib/leads/pipeline';
import { legalClauseFor } from './legal-clause';

/**
 * Mandar el contrato, desde donde sea.
 *
 * Lo dispara el botón del panel y también el «Acepto» del cliente en el correo
 * de la propuesta. Vive acá y no en la ruta del panel porque son el mismo
 * envío: duplicarlo garantizaba que uno de los dos quedara sin arreglar el día
 * que cambie el contrato.
 */

/** Se mantiene exportada por compatibilidad; la cláusula real sale por país. */
export const LEGAL_FALLBACK = legalClauseFor(null);

export type ContractResult =
  | { ok: true; estado?: string }
  | { ok: false; reason: 'lead_not_found' | 'no_document' | 'email_failed' | 'db_failed'; detail?: string };

export async function sendContractToLead(leadId: string): Promise<ContractResult> {
  const db = getSupabaseAdmin();

  const { data: lead, error } = await db
    .from('leads').select('nombre, email, estado, pais').eq('id', leadId).maybeSingle();

  if (error || !lead?.email) return { ok: false, reason: 'lead_not_found', detail: error?.message };

  // Sin el contrato adjunto no hay nada que firmar: el correo no sale.
  const doc = await buildContractDoc(leadId, legalClauseFor(lead.pais as string | null));
  if (!doc) return { ok: false, reason: 'no_document' };

  try {
    await sendCrmEmail(
      lead.email,
      'Tu contrato está listo para firmar',
      contractReadyHtml({ name: lead.nombre, email: lead.email }),
      [{ filename: doc.filename, content: doc.buffer }],
    );
  } catch (reason) {
    const detail = reason instanceof Error ? reason.message : String(reason);
    console.error('[send-contract] Resend error:', detail);
    return { ok: false, reason: 'email_failed', detail };
  }

  // La fecha sola no alcanzaba: el lead se movía en la realidad y no en el
  // panel, y ese desfasaje es lo que volvía inservible la lista.
  const nextState = advanceOn('contrato_enviado', lead.estado ?? '');

  const { error: updateError } = await db
    .from('leads')
    .update({
      contract_sent_at: new Date().toISOString(),
      ...(nextState ? { estado: nextState } : {}),
    })
    .eq('id', leadId);

  if (updateError) return { ok: false, reason: 'db_failed', detail: updateError.message };

  return { ok: true, ...(nextState ? { estado: nextState } : {}) };
}
