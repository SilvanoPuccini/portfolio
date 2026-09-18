import { PROPOSAL_SILENCE_DAYS, LEAD_SILENCE_HOURS } from '@/lib/admin/alerts';
import { phaseIndex } from './pipeline';

/**
 * Qué decir de cada venta en una línea.
 *
 * La lista vieja mostraba lo que el lead escribió en el formulario: tipo,
 * presupuesto, plazo. Eso sirvió una vez, el primer día. Lo que hace falta
 * todos los días es dónde está, hace cuánto y si eso ya es un problema.
 *
 * «Hace nueve días» es un dato. «En conversación» no lo es.
 */

export interface LeadRow {
  id: string;
  nombre: string;
  estado: string;
  created_at: string;
  tipo_proyecto: string | null;
  monto_presupuestado: number | null;
  proposal_sent_at: string | null;
  contract_sent_at: string | null;
  fecha_llamada: string | null;
}

export interface RowSummary {
  /** La frase que va bajo el nombre, ya conjugada. */
  line: string;
  /** Si esa espera ya dejó de ser normal. */
  risk: boolean;
}

const DAY = 86_400_000;

function daysBetween(iso: string, now: Date): number {
  const moment = new Date(iso).getTime();
  if (Number.isNaN(moment)) return 0;
  return Math.floor((now.getTime() - moment) / DAY);
}

/** «1 día» / «9 días», sin el paréntesis feo de (s). */
function days(count: number): string {
  return `${count} ${count === 1 ? 'día' : 'días'}`;
}

function callDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export function rowSummary(lead: LeadRow, now = new Date()): RowSummary {
  switch (lead.estado) {
    case 'nuevo': {
      const waiting = now.getTime() - new Date(lead.created_at).getTime();
      const cold = waiting > LEAD_SILENCE_HOURS * 3_600_000;
      return cold
        ? { line: `Sin contactar hace ${days(daysBetween(lead.created_at, now))}`, risk: true }
        : { line: `Entró hace ${days(daysBetween(lead.created_at, now))}`, risk: false };
    }

    case 'llamada_agendada':
      return {
        line: lead.fecha_llamada ? `Llamada ${callDate(lead.fecha_llamada)}` : 'Llamada agendada',
        risk: false,
      };

    case 'no_show':
      // Un no-show sin reagendar es plata parada, no un callejón sin salida.
      return { line: 'No apareció a la llamada · falta reagendar', risk: true };

    case 'en conversación':
      return { line: 'Hablaron · falta la propuesta', risk: false };

    case 'presupuestado': {
      if (!lead.proposal_sent_at) return { line: 'Propuesta pendiente de envío', risk: false };
      const waited = daysBetween(lead.proposal_sent_at, now);
      return waited >= PROPOSAL_SILENCE_DAYS
        ? { line: `Propuesta hace ${days(waited)} · sin respuesta`, risk: true }
        : { line: `Propuesta hace ${days(waited)}`, risk: false };
    }

    case 'contrato_enviado':
      return {
        line: lead.contract_sent_at
          ? `Contrato hace ${days(daysBetween(lead.contract_sent_at, now))} · espera firma`
          : 'Contrato enviado · espera firma',
        risk: false,
      };

    case 'contrato_firmado':
      return { line: 'Firmado · falta el cobro', risk: false };

    case 'cerrado':
      return { line: 'Cobrado · falta facturar', risk: false };

    case 'facturado':
      return { line: 'Facturado · falta entregar', risk: false };

    case 'entregado':
      return { line: 'Entregado', risk: false };

    case 'descartado':
      // Perder duele, pero no es una tarea pendiente.
      return { line: 'Venta perdida', risk: false };

    default:
      return { line: `Entró hace ${days(daysBetween(lead.created_at, now))}`, risk: false };
  }
}

/**
 * La plata que todavía se puede ganar.
 *
 * Deja afuera lo cobrado (ya no está en la mesa) y lo perdido (nunca estuvo).
 * Es el número que responde «cuánto hay en juego ahora mismo».
 */
export function pipelineValue(leads: LeadRow[]): number {
  const closed = phaseIndex('cerrado');

  return leads.reduce((total, lead) => {
    if (lead.estado === 'descartado') return total;
    const at = phaseIndex(lead.estado);
    if (at >= closed) return total;
    return total + (lead.monto_presupuestado ?? 0);
  }, 0);
}
