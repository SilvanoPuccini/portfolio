import { countryOf } from './payment-instructions';

/**
 * El precio se acuerda en USD, pero en Argentina y Chile se cobra en pesos.
 *
 * El dólar se mueve todos los días, así que el monto en pesos no se fija al
 * cotizar sino al pedir el pago: se toma la cotización del momento, se le suma
 * un margen que cubre el movimiento y la comisión del cobro, y se redondea
 * siempre para arriba. Ese monto vale QUOTE_VALID_HOURS; pasado el plazo, se
 * recalcula.
 *
 * Argentina usa el dólar MEP (precio de venta: lo que cuesta comprar un dólar
 * con pesos), no el oficial: cobrar al oficial deja la brecha de pérdida.
 * Chile usa el dólar observado del Banco Central.
 */

export type LocalCurrency = 'ARS' | 'CLP';

export const FX_MARGIN = 0.03;
export const ROUND_STEP = 10_000;
export const QUOTE_VALID_HOURS = 72;

export interface UsdRate {
  currency: LocalCurrency;
  /** Pesos por dólar. */
  rate: number;
  source: string;
  updatedAt: string | null;
}

export interface LocalQuote extends UsdRate {
  /** Monto a cobrar en pesos, con margen y redondeado. */
  amount: number;
  validUntil: string;
}

const SOURCES: Record<LocalCurrency, { url: string; name: string }> = {
  ARS: { url: 'https://dolarapi.com/v1/dolares/bolsa', name: 'Dólar MEP' },
  CLP: { url: 'https://mindicador.cl/api/dolar', name: 'Dólar observado' },
};

/** USD a pesos, con margen, redondeado para arriba. Nunca para abajo. */
export function localAmount(usd: number, rate: number): number {
  const raw = usd * rate * (1 + FX_MARGIN);
  // El épsilon evita que un múltiplo exacto suba un escalón por error de coma flotante.
  return Math.ceil(raw / ROUND_STEP - 1e-9) * ROUND_STEP;
}

/** La cotización del momento. Nunca lanza: sin cotización, devuelve null. */
export async function fetchUsdRate(currency: LocalCurrency): Promise<UsdRate | null> {
  const source = SOURCES[currency];
  try {
    const res = await fetch(source.url, {
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 900 },
    } as RequestInit);
    if (!res.ok) return null;
    const body = await res.json();

    const { rate, updatedAt } = currency === 'ARS'
      ? { rate: Number(body?.venta), updatedAt: body?.fechaActualizacion ?? null }
      : { rate: Number(body?.serie?.[0]?.valor), updatedAt: body?.serie?.[0]?.fecha ?? null };

    if (!Number.isFinite(rate) || rate <= 0) return null;
    return { currency, rate, source: source.name, updatedAt };
  } catch (reason) {
    console.warn(`[exchange-rate] ${currency} no disponible:`, reason instanceof Error ? reason.message : reason);
    return null;
  }
}

/**
 * El monto en pesos para un cliente, según su país. Null si paga en USD o si
 * no hay cotización: en ese caso el mail sale solo con el monto en dólares.
 */
export async function quoteFor(pais: string | null | undefined, usd: number, now = new Date()): Promise<LocalQuote | null> {
  const country = countryOf(pais);
  if (country === 'OTRO') return null;

  const rate = await fetchUsdRate(country === 'AR' ? 'ARS' : 'CLP');
  if (!rate) return null;

  return {
    ...rate,
    amount: localAmount(usd, rate.rate),
    validUntil: new Date(now.getTime() + QUOTE_VALID_HOURS * 3_600_000).toISOString(),
  };
}
