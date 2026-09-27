import { RETIRED_EXTRAS, RETIRED_PACKAGES } from '@/content/service-policy';
import {
  calificaParaComprar, destinoDe, extrasParaNuevoPedido, paquetePorSlug,
  servicioPorSlug, totalPedido, type Extra, type Paquete,
} from '@/content/servicios';

export type CurrentOrderInput = { paquete: string; extras: string[]; calificacion: Record<string, string> };
export type CurrentOrderError = 'unknown_package' | 'quoted' | 'monthly' | 'invalid_answers' | 'outside_scope' | 'invalid_extras';
export type CurrentOrderResult =
  | { ok: true; paquete: Paquete; extras: string[]; resumen: ReturnType<typeof totalPedido> }
  | { ok: false; error: CurrentOrderError };

/** Validate only a new order. Stored snapshots are never passed through this resolver. */
export function resolveCurrentOrder(input: CurrentOrderInput): CurrentOrderResult {
  const paquete = paquetePorSlug(input.paquete);
  if (!paquete || RETIRED_PACKAGES.has(paquete.slug)) return { ok: false, error: 'unknown_package' };
  if (paquete.precioUsd === null) return { ok: false, error: 'quoted' };
  const questions = new Map(paquete.calificacion.map((question) => [question.id, question]));
  if (Object.entries(input.calificacion).some(([id, value]) => !questions.get(id)?.opciones.some((option) => option.valor === value))) {
    return { ok: false, error: 'invalid_answers' };
  }
  if (!calificaParaComprar(paquete, input.calificacion)) {
    return { ok: false, error: destinoDe(paquete, input.calificacion) ? 'outside_scope' : 'invalid_answers' };
  }
  if (paquete.recurrente) return { ok: false, error: 'monthly' };
  const disponibles = servicioPorSlug(paquete.servicio)?.extras ?? [];
  if (input.extras.some((id) => RETIRED_EXTRAS.has(id) || !disponibles.some((extra) => extra.id === id))) {
    return { ok: false, error: 'invalid_extras' };
  }
  const extras = extrasParaNuevoPedido(input.extras, disponibles);
  return { ok: true, paquete, extras, resumen: totalPedido(paquete, extras, disponibles) };
}

/** Keep compatible choices when selecting another current package in the same service. */
export function compatibleConfiguration(paquete: Paquete, extras: Extra[], answers: Record<string, string>, selectedExtras: string[]) {
  const calificacion = Object.fromEntries(Object.entries(answers).filter(([id, value]) =>
    paquete.calificacion.some((question) => question.id === id && question.opciones.some((option) => option.valor === value)),
  ));
  const retainedExtras = selectedExtras.filter((id) => extras.some((extra) => extra.id === id && !RETIRED_EXTRAS.has(id)));
  return { calificacion, extras: extrasParaNuevoPedido(retainedExtras, extras) };
}
