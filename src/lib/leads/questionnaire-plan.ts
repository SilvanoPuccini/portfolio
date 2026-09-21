import { servicioPorSlug, type Locale } from '@/content/servicios';
import {
  QUESTIONNAIRE,
  fromServicio,
  resolveQuestion,
  type ResolvedQuestion,
} from './questionnaire-questions';

/**
 * Qué preguntarle a este cliente, y nada más que eso.
 *
 * El cuestionario dejó de ser una lista fija. Antes el cliente contaba lo
 * mismo tres veces: en el formulario de la web, en el mail con las siete
 * preguntas y otra vez en la llamada. La regla ahora es una sola y vale para
 * todo el circuito: una pregunta contestada no se vuelve a hacer.
 *
 * Se arma con dos capas. Primero los casilleros de calificación que todavía
 * están vacíos, que son los que deciden si la venta se puede cerrar. Después
 * las preguntas del servicio que eligió, que son las que permiten cotizarlo.
 */

export interface PlannedQuestion extends ResolvedQuestion {
  fuente: 'calificacion' | 'servicio';
}

/** Lo que el planificador necesita saber del lead. Nada más que esto. */
export interface LeadParaPlan {
  presupuesto_rango?: string | null;
  plazo?: string | null;
  problema?: string | null;
  que_construir?: string | null;
  service?: string | null;
  service_data?: Record<string, unknown> | null;
  guia_respuestas?: unknown;
}

function conTexto(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function deLaGuia(lead: LeadParaPlan, id: string): boolean {
  const respuestas = lead.guia_respuestas;
  if (!respuestas || typeof respuestas !== 'object' || Array.isArray(respuestas)) return false;
  return conTexto((respuestas as Record<string, unknown>)[id]);
}

/**
 * Qué casilleros de la calificación ya están llenos.
 *
 * Un casillero se llena desde donde sea: el formulario de la web o lo anotado
 * en la llamada. De dónde vino no importa; lo que importa es no volver a
 * preguntarlo.
 */
export function casillerosCubiertos(lead: LeadParaPlan): Set<string> {
  const cubiertos = new Set<string>();

  if (conTexto(lead.que_construir) || deLaGuia(lead, 'situacion.proceso')) cubiertos.add('Situación');
  if (conTexto(lead.problema) || deLaGuia(lead, 'problema.costo')) cubiertos.add('Impacto');
  if (deLaGuia(lead, 'alcance.referencias')) cubiertos.add('Alternativas');
  if (deLaGuia(lead, 'decision.quien')) cubiertos.add('Decisor');
  if (conTexto(lead.plazo) || deLaGuia(lead, 'plata.cuando')) cubiertos.add('Plazo');
  if (conTexto(lead.presupuesto_rango) || deLaGuia(lead, 'plata.rango')) cubiertos.add('Presupuesto');

  return cubiertos;
}

/** El cuestionario de este lead: lo que falta saber, en el orden en que se pregunta. */
export function planQuestionnaire(lead: LeadParaPlan, locale: Locale = 'es'): PlannedQuestion[] {
  const cubiertos = casillerosCubiertos(lead);

  const calificacion = QUESTIONNAIRE.filter((q) => !cubiertos.has(q.para)).map(
    (q): PlannedQuestion => ({ ...resolveQuestion(q, locale), fuente: 'calificacion' }),
  );

  const servicio = servicioPorSlug(lead.service);
  const contestadas = lead.service_data ?? {};
  const delServicio = (servicio?.preguntas ?? [])
    .filter((pregunta) => !conTexto(contestadas[pregunta.key]))
    .map((pregunta): PlannedQuestion => ({ ...fromServicio(pregunta, locale), fuente: 'servicio' }));

  // «¿Algo más que quieras contarme?» va último siempre: es la que se contesta
  // cuando ya se soltó todo lo demás, y la única opcional.
  const contexto = calificacion.filter((q) => q.para === 'Contexto');
  const resto = calificacion.filter((q) => q.para !== 'Contexto');

  const plan = [...resto, ...delServicio, ...contexto];

  // Una clave repetida guardaría dos respuestas en el mismo lugar.
  const vistas = new Set<string>();
  return plan.filter((q) => (vistas.has(q.key) ? false : (vistas.add(q.key), true)));
}

/** Las claves que este cuestionario espera. El endpoint no acepta otras. */
export function clavesEsperadas(lead: LeadParaPlan): string[] {
  return planQuestionnaire(lead).map((q) => q.key);
}
