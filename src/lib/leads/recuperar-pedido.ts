import type { EtapaPedido } from './etapa-pedido';

/**
 * Volver al pedido que ya empezaste.
 *
 * El link de un pedido es un uuid: si se pierde y el correo también, el
 * cliente no tiene ningún camino de vuelta. Lo que hacía era empezar de cero,
 * y ahí nacía un segundo lead del mismo cliente con otro pedido a medias.
 * Dos ventas donde hay una, y ninguna de las dos completa.
 *
 * Lo que vale es su correo, que es lo único que el cliente sabe de memoria.
 */

export interface PedidoAbierto {
  pedidoId: string;
  etapa: EtapaPedido;
  /** Para elegir cuál mandar cuando hay más de uno. */
  creadoAt: string;
}

/**
 * Cuál de sus pedidos le sirve.
 *
 * El más reciente que todavía no terminó. Un pedido ya pagado no es algo a
 * lo que «volver»: mandarlo ahí sería contestarle otra pregunta.
 *
 * Si no tiene ninguno abierto pero sí uno terminado, se manda ese igual: el
 * que escribe su correo quiere llegar a su proyecto, no a un paso.
 */
export function pedidoParaRetomar(pedidos: PedidoAbierto[]): PedidoAbierto | null {
  if (pedidos.length === 0) return null;

  const porFecha = [...pedidos].sort(
    (a, b) => new Date(b.creadoAt).getTime() - new Date(a.creadoAt).getTime(),
  );

  return porFecha.find((p) => p.etapa !== 'listo') ?? porFecha[0];
}

/**
 * Lo que se le contesta a quien escribe un correo.
 *
 * SIEMPRE lo mismo, exista o no. Si la respuesta cambiara, cualquiera podría
 * escribir correos ajenos para averiguar quién te compró: el formulario se
 * volvería una forma de listar tu cartera de clientes.
 */
export const RESPUESTA_UNICA =
  'Si hay un pedido con ese correo, te mandé el link para seguir donde lo dejaste.';
