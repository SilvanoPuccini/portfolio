/**
 * Cuánta seña pedir.
 *
 * El criterio de fondo es uno solo: la seña tiene que ser **capital**, no un
 * gesto. De ahí salen las dos reglas. En un trabajo chico la mitad compromete
 * de verdad y el pago único sigue siendo razonable. En uno grande la mitad
 * puede ser demasiada plata para pedir de entrada, así que hay margen para
 * bajar — pero el pago único deja de ser una opción de cobro sensata.
 *
 * Esto SUGIERE. El porcentaje final lo elegís vos: el panel no tiene forma de
 * saber si el margen de ese proyecto aguanta el 50 % o hay que negociar.
 */

/** Hasta dónde se puede bajar sin que la seña deje de comprometer. */
export const DEPOSIT_FLOOR_PCT = 25;

/** El punto de partida de toda negociación. */
export const DEPOSIT_START_PCT = 50;

/**
 * Desde qué monto un proyecto deja de ser "chico".
 *
 * Por encima de esto, pedir el total por adelantado no es una opción de cobro
 * y aparece margen para negociar la seña hacia abajo.
 */
export const LARGE_PROJECT_FROM = 1000;

export interface DepositSuggestion {
  /** El porcentaje con el que arrancar la conversación. */
  pct: number;
  /** Ese porcentaje aplicado al total, redondeado a centavos. */
  amount: number;
  /** Porcentajes a los que se puede bajar si el margen no da. */
  fallbackPcts: number[];
  /** Si cobrar todo junto sigue siendo razonable para este monto. */
  allowsSinglePayment: boolean;
}

/** Un porcentaje del total, redondeado a centavos. */
export function depositAt(total: number, pct: number): number {
  if (!Number.isFinite(total) || total <= 0) return 0;
  return Math.round(total * pct) / 100;
}

export function suggestDeposit(total: number | null): DepositSuggestion {
  if (total === null || !Number.isFinite(total) || total <= 0) {
    return { pct: DEPOSIT_START_PCT, amount: 0, fallbackPcts: [], allowsSinglePayment: false };
  }

  const isLarge = total >= LARGE_PROJECT_FROM;

  return {
    pct: DEPOSIT_START_PCT,
    amount: depositAt(total, DEPOSIT_START_PCT),
    // En un trabajo chico bajar no tiene sentido: el 25 % de $300 son $75, y
    // eso no compromete a nadie. El margen para negociar aparece con el monto.
    fallbackPcts: isLarge ? [30, DEPOSIT_FLOOR_PCT] : [],
    allowsSinglePayment: !isLarge,
  };
}
