import { FX_MARGIN, type LocalQuote } from '@/lib/leads/exchange-rate';
import { bloqueDatos, emailLayout, nota, panelDestacado, parrafo } from './layout';

/**
 * El pedido de pago, después de la firma.
 *
 * Va después del contrato firmado y no antes, a propósito. El contrato es lo
 * que protege a las dos partes: cobrar sin él deja una venta sin respaldo
 * escrito. Y para el cliente firmar no cuesta plata, así que hay mucha menos
 * fricción en «firmá esto» que en «pagá esto»; una vez que firmó ya decidió, y
 * el pago pasa a ser el trámite.
 *
 * Por eso este correo no vende nada: confirma lo ya acordado y dice cómo pagar.
 */

export interface PaymentRequestData {
  name: string;
  /** Lo que hay que pagar ahora. */
  amount: number;
  /** El total del proyecto, para que el número de arriba tenga contexto. */
  total: number;
  /** Porcentaje de seña acordado, o 100 si es pago único. */
  pct: number;
  singlePayment: boolean;
  /** Cómo pagar: alias, CBU, link. Sale de la configuración del panel. */
  paymentInstructions: string;
  /** El equivalente en pesos para Argentina y Chile. Sin él, el mail va solo en USD. */
  localQuote?: LocalQuote | null;
}

const money = (value: number) => `USD ${value.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;

/** Hasta cuándo vale el monto en pesos, en hora argentina: «lunes 22/09, 12:00». */
function validUntilLabel(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).replace(/(\d{2})-(\d{2})/, '$1/$2');
}

/** El monto en pesos y de dónde sale: sin eso, el número parece inventado. */
function enPesos(quote: LocalQuote) {
  return {
    detalle: `= ${quote.currency} ${quote.amount.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`,
    nota: `Cotización ${quote.source} + ${Math.round(FX_MARGIN * 100)}%, redondeada. `
      + `Vale hasta el ${validUntilLabel(quote.validUntil)} (hora de Argentina); `
      + 'después, pedime el monto actualizado.',
  };
}

export function paymentRequestHtml(data: PaymentRequestData): string {
  const detail = data.singlePayment
    ? 'Pago único por el total del proyecto.'
    : `Seña del ${data.pct}% sobre ${money(data.total)}. `
      + `El ${100 - data.pct}% restante se abona contra entrega.`;

  const pesos = data.localQuote ? enPesos(data.localQuote) : null;

  return emailLayout({
    preheader: `${money(data.amount)} para arrancar. El contrato firmado va adjunto.`,
    eyebrow: 'Silvano Puccini Dev',
    titulo: `Gracias por firmar, ${data.name}`,
    paso: 2,
    cuerpo: [
      parrafo('Con el contrato firmado, el último paso para arrancar es el pago inicial. '
        + 'Te adjunto tu copia firmada.'),

      panelDestacado({
        etiqueta: 'A abonar ahora',
        valor: money(data.amount),
        detalle: pesos?.detalle,
        nota: [pesos?.nota, detail].filter(Boolean).join(' '),
      }),

      bloqueDatos('Cómo pagar', data.paymentInstructions),

      parrafo('Apenas se acredite te mando la factura y arrancamos. '
        + 'Si preferís otra forma de pago, avisame y lo vemos.'),

      nota('Si algo no coincide con lo que acordamos, respondé este correo antes de pagar.'),
    ].join(''),
  });
}
