/**
 * Los cuatro pasos del cierre, con el estado de cada uno.
 *
 * Antes las acciones de venta vivían sueltas dentro de la calculadora de
 * presupuesto: cuatro botones de cuatro colores, sin orden, y nada decía cuál
 * era el que tocaba. Había que acordarse del circuito.
 *
 * Acá el circuito está escrito: propuesta, contrato, pago y factura, en ese
 * orden, y exactamente uno es «el que toca». El color queda para el estado,
 * nunca para decorar un botón.
 */

export type EstadoPaso = 'hecho' | 'toca' | 'revisar' | 'espera' | 'bloqueado';

export interface PasoDelCierre {
  id: 'propuesta' | 'contrato' | 'pago' | 'factura';
  titulo: string;
  estado: EstadoPaso;
  /** Qué mirar o qué falta, en una línea. */
  detalle?: string;
}

export interface LeadParaCierre {
  estado: string | null;
  monto_presupuestado: number | null;
  proposal_sent_at: string | null;
  contract_sent_at: string | null;
  contrato_firmado_at: string | null;
  pago_estado: string | null;
  cobrado_at?: string | null;
  factura_numero: string | null;
}

const COBRADO = ['cerrado', 'facturado', 'entregado'];

export function pasosDelCierre(lead: LeadParaCierre): PasoDelCierre[] {
  // Sin presupuesto guardado no hay nada que mandar: la propuesta saldría
  // vacía y el contrato sin monto.
  if (lead.monto_presupuestado == null) {
    return (['propuesta', 'contrato', 'pago', 'factura'] as const).map((id, i) => ({
      id,
      titulo: TITULOS[id],
      estado: 'bloqueado' as const,
      detalle: i === 0 ? 'Guardá el presupuesto y esto se habilita' : undefined,
    }));
  }

  const propuesta = Boolean(lead.proposal_sent_at);
  const firmado = Boolean(lead.contrato_firmado_at);
  const cobrado = lead.pago_estado === 'pagado'
    || Boolean(lead.cobrado_at)
    || COBRADO.includes(lead.estado ?? '');
  const informado = lead.pago_estado === 'informado';
  const facturado = Boolean(lead.factura_numero) || lead.estado === 'facturado'
    || lead.estado === 'entregado';

  // El que toca es el primero sin terminar. Uno solo, siempre.
  const pendientes = [!propuesta, !firmado, !cobrado, !facturado];
  const elQueToca = pendientes.indexOf(true);

  const paso = (i: number, id: PasoDelCierre['id'], hecho: boolean, detalle?: string): PasoDelCierre => ({
    id,
    titulo: TITULOS[id],
    estado: hecho ? 'hecho' : i === elQueToca ? 'toca' : 'espera',
    detalle,
  });

  const pasos: PasoDelCierre[] = [
    paso(0, 'propuesta', propuesta),
    paso(1, 'contrato', firmado, !firmado && lead.contract_sent_at ? 'Enviado, falta que firme' : undefined),
    paso(2, 'pago', cobrado),
    paso(3, 'factura', facturado),
  ];

  // El cliente avisó que transfirió: no está cobrado, pero tampoco es esperar
  // de brazos cruzados. Hay algo concreto que verificar.
  if (informado && !cobrado) {
    pasos[2] = { ...pasos[2], estado: 'revisar', detalle: 'El cliente avisó que transfirió' };
  }

  return pasos;
}

const TITULOS: Record<PasoDelCierre['id'], string> = {
  propuesta: 'Propuesta',
  contrato: 'Contrato',
  pago: 'Pago',
  factura: 'Factura',
};
