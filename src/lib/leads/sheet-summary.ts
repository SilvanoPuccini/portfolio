import { guideProgress, missingFromForm, qualificationScore, type FormAnswers, type GuideAnswers } from './call-guide';
import { parseSelectedModules } from './selected-modules';
import { labelForState } from './pipeline';

/**
 * Una línea por momento de la ficha.
 *
 * La ficha mostraba todo crudo: ocho secciones abiertas con veinte datos cada
 * una. Para decidir qué hacer con una venta hay que leer mucho y rápido, y
 * eso es justo lo que no se puede hacer entre dos llamadas.
 *
 * Cada momento se resume en un renglón. El detalle sigue estando, a un clic:
 * lo que cambia es que ya no hay que leerlo para saber cómo viene la venta.
 */

const trim = (text: string, max = 70) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

/** Momento 1: quién es y qué pidió. */
export function clienteSummary(lead: FormAnswers & { nombre?: string | null }): string {
  const parts: string[] = [];

  if (lead.que_construir?.trim()) parts.push(trim(lead.que_construir.trim()));
  else if (lead.problema?.trim()) parts.push(trim(lead.problema.trim()));

  if (lead.presupuesto_rango?.trim()) parts.push(lead.presupuesto_rango.trim());
  if (lead.plazo?.trim()) parts.push(lead.plazo.trim());

  // Sin nada contestado, el conteo de huecos no dice nada útil: lo que hay
  // que saber es que la llamada arranca de cero.
  if (parts.length === 0) return 'Todavía no contestó nada';

  const missing = missingFromForm(lead).length;
  if (missing > 0) parts.push(`faltan ${missing} datos`);

  return parts.join(' · ');
}

/** Momento 2: cuánto se avanzó en la llamada y si califica. */
export function llamadaSummary(answers: GuideAnswers): string {
  const progress = guideProgress(answers);
  if (progress.filled === 0) return 'Sin anotar · la guía arranca cuando empieza la llamada';

  const score = qualificationScore(answers);
  const warning = score.ok <= 3 ? ' · le falta para sostenerse' : '';
  return `${progress.filled} de ${progress.total} preguntas · califica ${score.ok}/${score.total}${warning}`;
}

/** Momento 3: qué se cotizó. */
export function diagnosticoSummary(lead: {
  horas_calculadas?: number | null;
  monto_presupuestado?: number | null;
  modulos_seleccionados?: unknown;
}): string {
  if (lead.monto_presupuestado == null) return 'Sin presupuesto guardado';

  const modules = parseSelectedModules(lead.modulos_seleccionados);
  const amount = `USD ${Math.round(lead.monto_presupuestado).toLocaleString('es-AR')}`;
  const hours = lead.horas_calculadas != null ? `${Math.round(lead.horas_calculadas)} h` : null;

  const parts = [amount, hours, modules.length > 0 ? `${modules.length} módulos` : 'sin módulos cargados']
    .filter((part): part is string => Boolean(part));

  return parts.join(' · ');
}

/** Momento 4: dónde está la venta. */
export function ventaSummary(lead: {
  estado?: string | null;
  propuesta_respuesta?: string | null;
  monto_presupuestado?: number | null;
}): string {
  const estado = labelForState(lead.estado ?? 'nuevo');

  if (lead.propuesta_respuesta === 'aceptada') return `${estado} · aceptó la propuesta`;
  if (lead.propuesta_respuesta === 'rechazada') return `${estado} · dijo que no a la propuesta`;

  return lead.monto_presupuestado != null
    ? `${estado} · USD ${Math.round(lead.monto_presupuestado).toLocaleString('es-AR')} en juego`
    : estado;
}
