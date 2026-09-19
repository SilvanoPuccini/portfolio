import { advanceOn, phaseIndex } from './pipeline';

/**
 * Qué le hace cada aviso de Cal.com a una venta, según dónde está.
 *
 * Cal.com se usa para dos cosas distintas: la llamada de venta y, después, las
 * reuniones con alguien que ya es cliente (el kickoff, una revisión). Antes el
 * webhook no las distinguía: cualquier reunión movía el estado. Un cliente que
 * ya había firmado y agendaba el kickoff volvía a «Llamada agendada»; si lo
 * cancelaba, volvía a «Nuevo», como si recién hubiera entrado; y la grabación
 * de esa reunión pisaba la de la llamada de venta, que es la que usa la IA
 * para escribir el seguimiento.
 *
 * La regla: Cal.com maneja la venta solo mientras la reunión ES la llamada de
 * venta — hasta «En conversación». Desde la propuesta en adelante, cualquier
 * reunión es con un cliente y no toca ni el estado, ni la fecha, ni la
 * grabación. El cobro es aparte: siempre se registra, y avanza la venta solo
 * hacia adelante.
 */

export interface CalcomPayload {
  startTime?: string;
  downloadLink?: string;
  transcription?: { text?: string }[];
}

export interface LeadUpdate {
  estado?: string;
  fecha_llamada?: string | null;
  grabacion_url?: string;
  transcripcion?: string;
  pago_estado?: string;
}

export interface CalcomOutcome {
  updates: LeadUpdate | null;
  action: string;
}

/**
 * Si una reunión de Cal.com todavía es la llamada de venta.
 *
 * `no_show` entra: es la llamada de venta que no ocurrió. Un estado que no
 * conocemos también entra, porque la columna es text libre y tratarlo como
 * arranque es más seguro que ignorar la llamada. `descartado` no: un lead
 * perdido no revive solo, igual que en el resto del circuito.
 */
export function isSalesCallStage(estado: string): boolean {
  if (estado === 'descartado') return false;
  if (estado === 'no_show') return true;
  const at = phaseIndex(estado);
  return at === -1 || at <= phaseIndex('en conversación');
}

const CLIENT_MEETING: CalcomOutcome = { updates: null, action: 'reunion_de_cliente' };

export function calcomEventOutcome(trigger: string, estado: string, payload: CalcomPayload): CalcomOutcome {
  const sales = isSalesCallStage(estado);

  switch (trigger) {
    case 'BOOKING_CREATED': {
      if (!sales) return CLIENT_MEETING;
      const fecha = payload.startTime ?? new Date().toISOString();
      // Una segunda llamada antes de la propuesta actualiza la fecha, pero no
      // devuelve a «Llamada agendada» a quien ya habló.
      const earlier = estado === 'nuevo' || estado === 'no_show' || phaseIndex(estado) === -1;
      return {
        updates: earlier ? { estado: 'llamada_agendada', fecha_llamada: fecha } : { fecha_llamada: fecha },
        action: earlier ? 'llamada_agendada' : 'segunda_llamada',
      };
    }

    case 'BOOKING_RESCHEDULED': {
      if (!sales) return CLIENT_MEETING;
      return {
        updates: { fecha_llamada: payload.startTime ?? new Date().toISOString() },
        action: 'rescheduled',
      };
    }

    case 'BOOKING_CANCELLED':
    case 'BOOKING_REJECTED': {
      // Solo la llamada de venta pendiente vuelve a «Nuevo». Cancelar
      // cualquier otra reunión no le quita a nadie lo que ya avanzó.
      if (estado !== 'llamada_agendada') return { updates: null, action: 'cancelacion_sin_efecto' };
      return { updates: { estado: 'nuevo', fecha_llamada: null }, action: 'reverted_to_nuevo' };
    }

    case 'BOOKING_NO_SHOW': {
      if (estado !== 'llamada_agendada') return { updates: null, action: 'no_show_sin_efecto' };
      return { updates: { estado: 'no_show' }, action: 'no_show' };
    }

    case 'MEETING_ENDED': {
      if (!sales) return CLIENT_MEETING;
      // Ya estaba en conversación: una segunda llamada terminada no cambia nada.
      if (estado === 'en conversación') return { updates: null, action: 'ya_en_conversacion' };
      return { updates: { estado: 'en conversación' }, action: 'en_conversacion' };
    }

    case 'RECORDING_DOWNLOAD_LINK_READY': {
      if (!sales) return CLIENT_MEETING;
      return payload.downloadLink
        ? { updates: { grabacion_url: payload.downloadLink }, action: 'recording_saved' }
        : { updates: null, action: 'ignored' };
    }

    case 'TRANSCRIPTION_GENERATED': {
      if (!sales) return CLIENT_MEETING;
      const text = (payload.transcription ?? []).map((s) => s.text ?? '').join('\n').trim();
      return text
        ? { updates: { transcripcion: text }, action: 'transcription_saved' }
        : { updates: null, action: 'ignored' };
    }

    case 'BOOKING_PAYMENT_INITIATED':
      return { updates: { pago_estado: 'iniciado' }, action: 'pago_iniciado' };

    case 'BOOKING_PAID': {
      // El pago se registra siempre; el estado solo avanza, nunca retrocede.
      const nextState = advanceOn('pago_recibido', estado);
      return {
        updates: { pago_estado: 'pagado', ...(nextState ? { estado: nextState } : {}) },
        action: nextState ? 'pago_confirmado_y_cerrado' : 'pago_confirmado',
      };
    }

    case 'FORM_SUBMITTED':
      return { updates: null, action: 'form_received' };

    default:
      return { updates: null, action: 'ignored' };
  }
}
