/**
 * El recorrido de una venta, de la consulta a la entrega.
 *
 * Existe porque los estados mentían. Mandar la propuesta guardaba
 * `proposal_sent_at` y dejaba el estado donde estaba; el pago llegaba por
 * webhook a `pago_estado`, un campo paralelo que nunca tocaba el lead. Un
 * cliente ya cobrado podía figurar como «en conversación», y una lista que no
 * refleja la realidad se deja de mirar.
 *
 * Acá vive la única autoridad sobre qué estado corresponde después de cada
 * hecho. Las rutas no deciden: preguntan.
 */

/**
 * Los estados en el orden en que ocurren. Los cinco primeros ya existían en el
 * CRM y se conservan con su nombre: renombrarlos dejaría huérfanas las filas
 * vivas. `cerrado` es la venta ganada y `descartado` la perdida, tal como los
 * venías usando.
 */
export const PIPELINE = [
  'nuevo',
  'llamada_agendada',
  'en conversación',
  'presupuestado',
  'contrato_enviado',
  'cerrado',
  'facturado',
  'entregado',
] as const;

/**
 * Salidas del recorrido. No son "más adelante" ni "más atrás": son desvíos.
 * `no_show` se puede retomar; `descartado` solo vuelve si vos lo decidís.
 */
export const DEAD_ENDS = ['no_show', 'descartado'] as const;

export type LeadState = (typeof PIPELINE)[number] | (typeof DEAD_ENDS)[number];

/** Los hechos que mueven una venta. Cada uno ocurre una sola vez. */
export type LeadEvent =
  | 'propuesta_enviada'
  | 'contrato_enviado'
  | 'pago_recibido'
  | 'facturado'
  | 'entregado';

/** Qué estado deja cada hecho cuando efectivamente avanza. */
const LANDS_ON: Record<LeadEvent, LeadState> = {
  propuesta_enviada: 'presupuestado',
  contrato_enviado: 'contrato_enviado',
  pago_recibido: 'cerrado',
  facturado: 'facturado',
  entregado: 'entregado',
};

/** Posición en el recorrido, o -1 si el estado está fuera de la línea. */
export function phaseIndex(state: string): number {
  return (PIPELINE as readonly string[]).indexOf(state);
}

export function isKnownState(state: string): state is LeadState {
  return phaseIndex(state) !== -1 || (DEAD_ENDS as readonly string[]).includes(state);
}

/**
 * El estado que corresponde tras un hecho, o `null` si no hay que tocar nada.
 *
 * Dos reglas, y las dos existen por lo mismo — que un webhook repetido o
 * demorado no reescriba la historia:
 *
 * 1. Nunca retrocede. Una venta cobrada no vuelve a «propuesta enviada»
 *    porque llegó tarde el aviso de que la propuesta salió.
 * 2. Un lead descartado no revive solo. Si lo diste de baja y aparece un pago
 *    atrasado, lo mirás vos: puede ser un error de cobro, no una venta.
 *
 * Un estado desconocido (la columna es `text` libre y hay filas viejas) cuenta
 * como arranque: avanzar es mejor que quedarse trabado en un valor que nadie
 * reconoce.
 */
export function advanceOn(event: LeadEvent, current: string): LeadState | null {
  if (current === 'descartado') return null;

  const target = LANDS_ON[event];
  const from = phaseIndex(current);
  const to = phaseIndex(target);

  // `from === -1` cubre tanto los desvíos (no_show) como los estados que no
  // conocemos: los dos se tratan como punto de partida.
  if (from >= to) return null;

  return target;
}
