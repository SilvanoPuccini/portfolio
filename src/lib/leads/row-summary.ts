import { PROPOSAL_SILENCE_DAYS, LEAD_SILENCE_HOURS } from '@/lib/admin/alerts';
import { phaseIndex } from './pipeline';
import { lastContactAt } from './last-contact';

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
  /** El último seguimiento enviado. El silencio se mide desde acá. */
  ultimo_contacto_at?: string | null;
  /** Lo que el cliente contestó desde el correo de la propuesta. */
  propuesta_respuesta?: string | null;
  /** Si pidió tiempo, cuándo quiere que le escriban. */
  propuesta_recordar_at?: string | null;
  contract_sent_at: string | null;
  /** Documenso lo dio por vencido sin firma. */
  contrato_vencido_at?: string | null;
  /** La primera vez que el cliente abrió el contrato en Documenso. */
  contrato_abierto_at?: string | null;
  /** El cliente rechazó el contrato; el motivo va aparte. */
  contrato_rechazado_at?: string | null;
  fecha_llamada: string | null;
}

export interface RowSummary {
  /** La frase que va bajo el nombre, ya conjugada. */
  line: string;
  /** Si esa espera ya dejó de ser normal. */
  risk: boolean;
}

const DAY = 86_400_000;

/** Días que puede pasar un contrato abierto sin firma antes de reclamar. */
export const OPENED_SILENCE_DAYS = 2;

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
      // Dijo que no desde el correo: sigue siendo una venta abierta, pero hay
      // algo concreto que resolver y no un silencio que esperar.
      if (lead.propuesta_respuesta === 'rechazada') {
        return { line: 'Dijo que no a la propuesta · llamalo para ajustar', risk: true };
      }
      // Pidió tiempo y eligió la fecha: antes de esa fecha no hay nada que
      // hacer, y después hay algo concreto, no un silencio que interpretar.
      if (lead.propuesta_respuesta === 'pensando' && lead.propuesta_recordar_at) {
        const falta = daysBetween(now.toISOString(), new Date(lead.propuesta_recordar_at));
        return falta > 0
          ? { line: `Lo está pensando · te contesta en ${days(falta)}`, risk: false }
          : { line: 'Pidió tiempo y ya se cumplió · escribile', risk: true };
      }
      const contacted = lastContactAt(lead);
      if (!contacted) return { line: 'Propuesta pendiente de envío', risk: false };
      const waited = daysBetween(contacted, now);
      return waited >= PROPOSAL_SILENCE_DAYS
        ? { line: `Propuesta hace ${days(waited)} · sin respuesta`, risk: true }
        : { line: `Propuesta hace ${days(waited)}`, risk: false };
    }

    case 'contrato_enviado':
      if (lead.contrato_rechazado_at) {
        return { line: 'Rechazó el contrato · llamalo para negociar', risk: true };
      }
      if (lead.contrato_vencido_at) {
        return { line: 'Contrato vencido sin firmar · reenviar', risk: true };
      }
      if (lead.contrato_abierto_at) {
        // Lo leyó y no firma: a los dos días ya es una duda que no escribió.
        const since = daysBetween(lead.contrato_abierto_at, now);
        return since >= OPENED_SILENCE_DAYS
          ? { line: `Lo abrió hace ${days(since)} y no firma · llamalo`, risk: true }
          : { line: `Lo abrió hace ${days(since)} · espera firma`, risk: false };
      }
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
