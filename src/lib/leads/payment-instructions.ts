/**
 * Cómo tiene que pagar cada cliente, según su país.
 *
 * Una sola variable no alcanzaba: en Argentina se transfiere a un alias o CVU,
 * y en Chile la transferencia pide banco, tipo de cuenta, número y RUT. Con un
 * único texto, un cliente chileno recibía un alias argentino que no puede usar.
 *
 * Variables de entorno (se pueden escribir en varias líneas):
 *   PAYMENT_INSTRUCTIONS_AR  → clientes de Argentina
 *   PAYMENT_INSTRUCTIONS_CL  → clientes de Chile
 *   PAYMENT_INSTRUCTIONS     → cualquier otro país, o si falta la del país
 */

export type PaymentCountry = 'AR' | 'CL' | 'OTRO';

/** Sin datos de pago no se inventa nada: se avisa que llegan por otro mail. */
export const FALLBACK_INSTRUCTIONS = 'Te paso los datos de transferencia por este mismo medio.';

/**
 * El país tal como lo carga una persona en la ficha: «Argentina», «argentina»,
 * «AR», «Chile»... Se normaliza sin tildes ni mayúsculas para no depender de
 * cómo se escribió.
 */
export function countryOf(pais: string | null | undefined): PaymentCountry {
  const clean = (pais ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .trim().toLowerCase();

  if (clean === 'ar' || clean === 'arg' || clean.startsWith('argentin')) return 'AR';
  if (clean === 'cl' || clean === 'chl' || clean.startsWith('chile')) return 'CL';
  return 'OTRO';
}

/** Vercel acepta valores en varias líneas, pero si alguien pegó «\n» literal, también sirve. */
const readEnv = (name: string) => {
  const value = process.env[name]?.trim();
  return value ? value.replace(/\\n/g, '\n') : undefined;
};

export function paymentInstructionsFor(pais: string | null | undefined): string {
  const country = countryOf(pais);
  const specific = country === 'OTRO' ? undefined : readEnv(`PAYMENT_INSTRUCTIONS_${country}`);
  return specific ?? readEnv('PAYMENT_INSTRUCTIONS') ?? FALLBACK_INSTRUCTIONS;
}
