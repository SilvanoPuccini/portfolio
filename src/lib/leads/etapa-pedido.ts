/**
 * En qué punto está un pedido comprado directo.
 *
 * La página del pedido es una sola y va cambiando con el circuito: primero
 * los datos, después la firma, después el pago. Antes el pago vivía solo en
 * un correo, así que si el cliente lo borraba se quedaba sin saber cómo
 * pagar. Ahora vuelve al mismo link y ve lo que le toca.
 */

export type EtapaPedido = 'datos' | 'firma' | 'pago' | 'esperando' | 'listo';

export interface PedidoParaEtapa {
  lead_id: string | null;
  firmado_at: string | null;
}

export interface LeadParaEtapa {
  estado: string | null;
  contrato_firma_token: string | null;
  contrato_firmado_at: string | null;
  pago_estado: string | null;
}

/** Estados del embudo en los que el pago ya entró. */
const COBRADO = ['cerrado', 'facturado', 'entregado'];

export function etapaDelPedido(
  pedido: PedidoParaEtapa,
  lead: LeadParaEtapa | null,
): EtapaPedido {
  if (!pedido.lead_id || !lead) return 'datos';

  // Sin contrato creado no hay nada que firmar: se vuelve a pedir los datos.
  if (!lead.contrato_firma_token) return 'datos';

  const firmado = Boolean(pedido.firmado_at || lead.contrato_firmado_at);
  if (!firmado) return 'firma';

  if (lead.pago_estado === 'pagado' || COBRADO.includes(lead.estado ?? '')) return 'listo';
  if (lead.pago_estado === 'informado') return 'esperando';

  return 'pago';
}
