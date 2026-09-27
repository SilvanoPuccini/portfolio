import type { LeadRow } from './cargar-pedido';
import type { ConfigurationSnapshot } from '@/lib/order-configuration-snapshot';
import { createRevision } from './contract-revision';

/** Build contract terms from the order archive, never today's catalog. */
export function revisionFromConfiguration(
  snapshot: ConfigurationSnapshot,
  client: Pick<LeadRow, 'nombre' | 'localidad' | 'pais'>,
  legalClause: string,
  waitDays = 0,
) {
  const recurring = snapshot.charges.recurringUsd;
  const amount = snapshot.charges.oneTimeUsd;
  const priceLines = [
    ...(snapshot.package.oneTimeUsd ? [`${snapshot.package.label}: USD ${snapshot.package.oneTimeUsd.toLocaleString('es-AR')}`] : []),
    ...snapshot.extras.filter((extra) => extra.cadence === 'once')
      .map((extra) => `${extra.label}: USD ${extra.amountUsd.toLocaleString('es-AR')}`),
  ];
  const monthly = [
    ...(snapshot.package.recurringUsd ? [`${snapshot.package.label}: USD ${snapshot.package.recurringUsd.toLocaleString('es-AR')}`] : []),
    ...snapshot.extras.filter((extra) => extra.cadence === 'month')
      .map((extra) => `${extra.label}: USD ${extra.amountUsd.toLocaleString('es-AR')}`),
  ];
  return createRevision({
    clientName: client.nombre,
    clientLocation: client.localidad ?? '',
    clientCountry: client.pais ?? '',
    projectDescription: snapshot.package.description,
    deliverables: [...snapshot.package.included, ...snapshot.extras.map((extra) => extra.label)].join('\n'),
    excluded: snapshot.package.excluded.join('\n'),
    totalHours: 0,
    totalPrice: amount,
    hourlyRate: 0,
    paymentTerms: recurring > 0
      ? 'El servicio recurrente requiere aceptación expresa y una fecha de activación acordada por separado; este documento no activa cobros automáticos.'
      : `Pago único de USD ${amount.toLocaleString('es-AR')} por adelantado.`,
    estimatedWeeks: Math.max(1, Math.ceil(snapshot.package.deliveryDays / 5)),
    plazoDiasHabiles: snapshot.package.deliveryDays,
    diasDeEspera: waitDays || undefined,
    detallePrecio: priceLines.length > 1 ? priceLines : undefined,
    cargoMensual: monthly.length
      ? `Cargo mensual: ${monthly.join('; ')}. Su activación requiere aceptación expresa y una fecha de inicio acordada.`
      : undefined,
    legalClause,
    servicePolicy: snapshot.responsibilities,
  });
}
