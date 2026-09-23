import type { EtapaPedido } from './etapa-pedido';

/**
 * Los pasos de la compra, cada uno con su dirección propia.
 *
 * Todo el circuito vivía en una sola URL que cambiaba de contenido según la
 * etapa. Funcionaba hasta que el cliente tocaba «atrás»: el navegador lo
 * sacaba del pedido entero, porque no había ningún paso anterior al que
 * volver. Probando la compra de punta a punta eso terminó en «se perdió la
 * página, chao, desapareció».
 *
 * Con una dirección por paso, atrás vuelve al paso anterior, el link se puede
 * guardar, y la dirección dice en voz alta dónde está parado.
 */

export type PasoPedido = 'resumen' | 'firmar' | 'pagar' | 'listo';

/** El orden en que se recorren. Es lo que numera el indicador de arriba. */
export const PASOS: { paso: PasoPedido; titulo: string }[] = [
  { paso: 'resumen', titulo: 'Tus datos' },
  { paso: 'firmar', titulo: 'El contrato' },
  { paso: 'pagar', titulo: 'El pago' },
  { paso: 'listo', titulo: 'A trabajar' },
];

/**
 * En qué paso está una venta.
 *
 * «Esperando» no es un paso aparte: el cliente ya avisó que transfirió y
 * sigue en el del pago hasta que se confirme. Darle una dirección propia
 * sería mandarlo a una pantalla nueva para decirle que no hay nada que hacer.
 */
export function pasoDeEtapa(etapa: EtapaPedido): PasoPedido {
  switch (etapa) {
    case 'datos': return 'resumen';
    case 'firma': return 'firmar';
    case 'pago':
    case 'esperando': return 'pagar';
    case 'listo': return 'listo';
  }
}

/** La dirección de un paso. El primero vive en la raíz: es por donde se entra. */
export function rutaDelPaso(locale: string, pedidoId: string, paso: PasoPedido): string {
  const base = `/${locale}/pedido/${pedidoId}`;
  return paso === 'resumen' ? base : `${base}/${paso}`;
}

/**
 * A dónde hay que mandarlo, si no está donde corresponde.
 *
 * Devuelve `null` cuando ya está en su paso. Esto es lo que impide que
 * alguien llegue al pago sin haber firmado escribiendo la dirección a mano, y
 * lo que hace que el link viejo de un pedido ya pagado no muestre otra vez el
 * contrato.
 */
export function redirigirA(
  etapa: EtapaPedido,
  pasoActual: PasoPedido,
  locale: string,
  pedidoId: string,
): string | null {
  const corresponde = pasoDeEtapa(etapa);
  return corresponde === pasoActual ? null : rutaDelPaso(locale, pedidoId, corresponde);
}

/** Cuántos pasos quedaron atrás, para pintar el indicador. */
export function avanceDelPaso(paso: PasoPedido): { numero: number; total: number } {
  return { numero: PASOS.findIndex((p) => p.paso === paso) + 1, total: PASOS.length };
}
