/**
 * Desde cuándo se cuenta el silencio de una propuesta.
 *
 * Antes se contaba desde `proposal_sent_at`, y el seguimiento lo pisaba para
 * reiniciar el reloj. Eso borraba la fecha real de la propuesta. Ahora el
 * seguimiento escribe `ultimo_contacto_at` y la propuesta queda intacta: el
 * silencio es el tiempo desde el último contacto, sea cual sea de los dos.
 */

export interface ContactDates {
  proposal_sent_at?: string | null;
  ultimo_contacto_at?: string | null;
}

export function lastContactAt(lead: ContactDates): string | null {
  const dates = [lead.proposal_sent_at, lead.ultimo_contacto_at]
    .filter((d): d is string => Boolean(d) && !Number.isNaN(Date.parse(d as string)));

  if (dates.length === 0) return null;
  return dates.reduce((latest, d) => (Date.parse(d) > Date.parse(latest) ? d : latest));
}
