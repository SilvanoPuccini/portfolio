import { getSupabaseAdmin } from '@/lib/supabase';
import { sendCrmEmail } from '@/lib/resend';
import { escapeHtml } from '@/lib/html-escape';
import { sendContractToLead } from './send-contract';
import { createContract } from './documenso-contract';
import { legalClauseFor } from './legal-clause';
import { advanceOn } from './pipeline';

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

export type ProposalAnswer = 'aceptada' | 'rechazada' | 'pensando';

/**
 * «Lo estoy pensando» no cierra nada: es la única respuesta que se puede
 * cambiar. Quien pidió tiempo tiene que poder volver al mismo link y aceptar
 * sin escribirle a nadie — si no, el botón sería una trampa.
 */
const FINAL_ANSWERS = ['aceptada', 'rechazada'];

export type ResponseResult =
  | {
    ok: true; answer: ProposalAnswer;
    /** `para_firmar` es el camino bueno: el contrato ya existe y se firma sin salir. */
    contrato: 'para_firmar' | 'enviado' | 'con_problema' | 'no_corresponde';
    detail?: string;
  }
  | { ok: false; reason: 'not_found' | 'already_answered' | 'db_failed'; answer?: ProposalAnswer; detail?: string };

interface LeadRow {
  id: string;
  nombre: string;
  email: string;
  propuesta_respuesta: string | null;
  propuesta_snapshot: {
    incluye?: { titulo?: string }[];
    inversion?: { total?: number; sena?: number; saldo?: number; pct?: number };
  } | null;
  /** Para la cláusula de partes y la ley que aplica. */
  pais: string | null;
  localidad: string | null;
  pago_unico: boolean | null;
  horas_calculadas: number | null;
}

/** El plazo que se escribe en el contrato, a partir de las horas cotizadas. */
export function plazoDe(horas: number | null | undefined): string {
  if (!horas || horas <= 0) return 'A convenir por escrito entre las partes.';
  const semanas = Math.max(1, Math.ceil(horas / 20));
  return `${semanas} ${semanas === 1 ? 'semana' : 'semanas'} desde la acreditación del primer pago.`;
}

/** Seña y saldo, o pago único. Es una decisión por venta, no por plantilla. */
export function formaDePago(
  pagoUnico: boolean | null | undefined,
  inversion: { total?: number; sena?: number; saldo?: number; pct?: number },
): string {
  const money = (value: number) => `USD ${Math.round(value).toLocaleString('es-AR')}`;

  if (pagoUnico) return `Pago único de ${money(inversion.total ?? 0)} por adelantado.`;

  const pct = inversion.pct ?? 50;
  const sena = inversion.sena ?? Math.round((inversion.total ?? 0) * pct) / 100;
  const saldo = inversion.saldo ?? Math.max(0, (inversion.total ?? 0) - sena);
  return `Seña del ${pct}% (${money(sena)}) para comenzar y ${money(saldo)} contra entrega.`;
}

/** Le avisa a Silvano. Que falle el aviso no invalida la respuesta del cliente. */
async function notifyOwner(lead: LeadRow, answer: ProposalAnswer, motivo?: string, remindAt?: string) {
  const to = process.env.ADMIN_EMAIL;
  if (!to) return;

  const titles: Record<ProposalAnswer, string> = {
    aceptada: `${lead.nombre} aceptó la propuesta`,
    rechazada: `${lead.nombre} dijo que no por ahora`,
    pensando: `${lead.nombre} se lo está pensando`,
  };
  const title = titles[answer];

  const bodies: Record<ProposalAnswer, string> = {
    aceptada: 'El contrato salió automáticamente. Revisá la ficha por si hay que ajustar algo.',
    rechazada: `Motivo: ${motivo?.trim() || 'no dejó motivo'}. La venta sigue abierta: llamalo.`,
    pensando: `Pidió que le escribas ${remindAt ? `el ${new Date(remindAt).toLocaleDateString('es-AR')}` : 'más adelante'}.`
      + ` ${motivo?.trim() ? `Dijo: ${motivo.trim()}` : 'No dejó detalle.'} Queda agendado en el panel.`,
  };
  const body = bodies[answer];

  try {
    await sendCrmEmail(to, title, `<p>${escapeHtml(title)}.</p><p>${escapeHtml(body)}</p>`);
  } catch (reason) {
    console.warn('[proposal-response] No se pudo avisar:', reason instanceof Error ? reason.message : reason);
  }
}

export async function recordProposalResponse(
  token: string, answer: ProposalAnswer, motivo?: string, remindAt?: string,
  /** Adónde vuelve el cliente después de firmar: su misma propuesta. */
  redirectUrl?: string,
): Promise<ResponseResult> {
  const db = getSupabaseAdmin();

  const { data, error } = await db
    .from('leads')
    .select('id, nombre, email, propuesta_respuesta, propuesta_snapshot, pais, localidad, pago_unico, horas_calculadas')
    .eq('propuesta_token', token)
    .maybeSingle();

  if (error) return { ok: false, reason: 'db_failed', detail: error.message };
  if (!data) return { ok: false, reason: 'not_found' };

  const lead = data as LeadRow;

  // Dos clics en el mismo botón no mandan dos contratos. Un «lo pienso» sí se
  // puede cambiar: es una pausa, no una respuesta.
  if (lead.propuesta_respuesta && FINAL_ANSWERS.includes(lead.propuesta_respuesta)) {
    return { ok: false, reason: 'already_answered', answer: lead.propuesta_respuesta as ProposalAnswer };
  }

  const { error: updateError } = await db
    .from('leads')
    .update({
      propuesta_respuesta: answer,
      propuesta_respondida_at: new Date().toISOString(),
      propuesta_rechazo_motivo: answer !== 'aceptada' ? (motivo?.trim() || null) : null,
      // La fecha que el cliente eligió: el seguimiento va cuando él dijo, no
      // cuando al vendedor se le ocurre.
      propuesta_recordar_at: answer === 'pensando' ? (remindAt ?? null) : null,
    })
    .eq('id', lead.id);

  if (updateError) return { ok: false, reason: 'db_failed', detail: updateError.message };

  if (answer !== 'aceptada') {
    await notifyOwner(lead, answer, motivo, remindAt);
    return { ok: true, answer, contrato: 'no_corresponde' };
  }

  // El camino bueno: el contrato se crea en Documenso con el precio y el
  // alcance de ESTA propuesta, y el cliente lo firma sin salir de la página.
  try {
    const snapshot = lead.propuesta_snapshot ?? {};
    const inversion = snapshot.inversion ?? {};
    const total = Math.round(inversion.total ?? 0);

    const contract = await createContract({
      nombre: lead.nombre,
      email: lead.email,
      total,
      alcance: (snapshot.incluye ?? [])
        .map((item) => item?.titulo ?? '')
        .filter(Boolean)
        .join(', '),
      // El plazo sale de las horas cotizadas: una semana por cada 20 horas,
      // que es el ritmo real de un proyecto con un cliente respondiendo.
      plazo: plazoDe(lead.horas_calculadas),
      pago: formaDePago(lead.pago_unico, inversion),
      domicilio: [lead.localidad, lead.pais].filter(Boolean).join(', '),
      jurisdiccion: legalClauseFor(lead.pais),
    }, redirectUrl);

    await db.from('leads').update({
      contrato_signing_url: contract.signingUrl,
      contrato_firma_token: contract.token,
      contrato_envelope_id: contract.envelopeId,
      contract_sent_at: new Date().toISOString(),
      estado: advanceOn('contrato_enviado', 'presupuestado') ?? undefined,
    }).eq('id', lead.id);

    await notifyOwner(lead, answer);
    return { ok: true, answer, contrato: 'para_firmar' };
  } catch (reason) {
    // Documenso caído o sin configurar no puede costar la venta: se cae al
    // correo con el contrato adjunto, que es lo que funcionaba hasta ahora.
    console.warn('[proposal-response] Documenso no pudo crear el contrato:',
      reason instanceof Error ? reason.message : reason);
  }

  const sent = await sendContractToLead(lead.id);
  await notifyOwner(lead, answer);

  // Si el contrato no salió, la aceptación igual quedó registrada: es un dato
  // del cliente y no se pierde porque falle un envío nuestro.
  return sent.ok
    ? { ok: true, answer, contrato: 'enviado' }
    : { ok: true, answer, contrato: 'con_problema', detail: sent.reason };
}
