import { SERVICIOS, servicioPorSlug, type Locale } from '@/content/servicios';
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
  fuente: 'calificacion' | 'servicio' | 'disparador';
}

/**
 * La primera pregunta de quien no entró por un servicio.
 *
 * Ordena todo lo que viene después: define de qué se habla, abre las
 * preguntas de ese rubro y deja el lead categorizado desde el minuto uno.
 * Sin esto, la llamada empieza por «contame qué necesitás», que es la peor
 * pregunta posible porque la contesta cualquier cosa.
 */
function preguntaDeServicio(locale: Locale): PlannedQuestion {
  return {
    key: 'servicio',
    text: locale === 'es'
      ? '¿Qué es lo que más se parece a lo que necesitás?'
      : 'Which of these is closest to what you need?',
    hint: locale === 'es'
      ? 'Elegí el que más se acerque, aunque no sea exacto. Después lo ajustamos.'
      : 'Pick the closest one, even if it is not exact. We adjust it later.',
    para: 'Servicio',
    fuente: 'disparador',
    opciones: [
      ...SERVICIOS.map((servicio) => servicio.nombre[locale]),
      locale === 'es' ? 'Todavía no sé' : 'Not sure yet',
    ],
  };
}

/**
 * Por qué eligió hablar en vez de contratar directo.
 *
 * Es la información más cara del negocio y la que hoy se pierde en cada
 * llamada. Si la respuesta es «no entendí qué incluye», el problema es del
 * catálogo y se arregla una vez para todos. Si es «mi caso no entra», ahí hay
 * un paquete que falta.
 */
function preguntaDelPorQue(locale: Locale): PlannedQuestion {
  return {
    key: 'por_que_llamada',
    text: locale === 'es'
      ? '¿Por qué preferiste hablar antes de contratar?'
      : 'Why did you prefer to talk before buying?',
    hint: locale === 'es'
      ? 'Contestá con sinceridad: me sirve para mejorar lo que ofrezco.'
      : 'Be honest: it helps me improve what I offer.',
    para: 'Motivo',
    fuente: 'disparador',
    opciones: locale === 'es'
      ? [
        'No entendí bien qué incluye',
        'Mi caso no entra en ninguno de los paquetes',
        'Necesito algo que no está en la lista',
        'El precio: quiero ver alternativas',
        'Prefiero hablarlo antes de decidir',
      ]
      : [
        'I did not quite understand what is included',
        'My case does not fit any of the packages',
        'I need something that is not on the list',
        'The price: I want to see options',
        'I would rather talk it through first',
      ],
  };
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
export function planQuestionnaire(
  lead: LeadParaPlan,
  locale: Locale = 'es',
  /** Lo que acaba de elegir en la primera pregunta, si todavía no está guardado. */
  servicioElegido?: string,
): PlannedQuestion[] {
  const cubiertos = casillerosCubiertos(lead);
  const contestadas = lead.service_data ?? {};

  // El disparador: primero qué necesita, después por qué no lo compró solo.
  const disparadores = [
    ...(lead.service || servicioElegido ? [] : [preguntaDeServicio(locale)]),
    ...(conTexto(contestadas.por_que_llamada) ? [] : [preguntaDelPorQue(locale)]),
  ];

  const calificacion = QUESTIONNAIRE.filter((q) => !cubiertos.has(q.para)).map(
    (q): PlannedQuestion => ({ ...resolveQuestion(q, locale), fuente: 'calificacion' }),
  );

  const servicio = servicioPorSlug(lead.service ?? servicioElegido);
  const delServicio = (servicio?.preguntas ?? [])
    .filter((pregunta) => !conTexto(contestadas[pregunta.key]))
    .map((pregunta): PlannedQuestion => ({ ...fromServicio(pregunta, locale), fuente: 'servicio' }));

  // «¿Algo más que quieras contarme?» va último siempre: es la que se contesta
  // cuando ya se soltó todo lo demás, y la única opcional.
  const contexto = calificacion.filter((q) => q.para === 'Contexto');
  const resto = calificacion.filter((q) => q.para !== 'Contexto');

  const plan = [...disparadores, ...resto, ...delServicio, ...contexto];

  // Una clave repetida guardaría dos respuestas en el mismo lugar.
  const vistas = new Set<string>();
  return plan.filter((q) => (vistas.has(q.key) ? false : (vistas.add(q.key), true)));
}

/** Las claves que este cuestionario espera. El endpoint no acepta otras. */
export function clavesEsperadas(lead: LeadParaPlan): string[] {
  return planQuestionnaire(lead).map((q) => q.key);
}

/**
 * Dónde va, en la guía de la llamada, cada cosa que el cliente ya escribió.
 *
 * Sin esto la guía le pregunta en vivo lo mismo que contestó por escrito, y
 * el trabajo previo no sirve de nada: el cliente siente que nadie lo leyó.
 *
 * No se completa solo a propósito. En la llamada eso se confirma y se
 * profundiza: lo que escribió es el punto de partida, no la respuesta final.
 */
const DONDE_VA: Record<string, string> = {
  q1: 'situacion.proceso',
  q2: 'problema.costo',
  q3: 'alcance.referencias',
  q4: 'decision.quien',
  q5: 'plata.cuando',
  q6: 'plata.rango',
  q7: 'encuadre.motivo',
  por_que_llamada: 'encuadre.motivo',
};

export function respuestasPrevias(answers: unknown): Record<string, string> {
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) return {};

  const guardadas = answers as Record<string, unknown>;
  const ubicadas: Record<string, string> = {};

  for (const [clave, destino] of Object.entries(DONDE_VA)) {
    const valor = guardadas[clave];
    if (typeof valor !== 'string' || !valor.trim()) continue;

    // Dos respuestas pueden caer en la misma pregunta: se suman, no se pisan.
    ubicadas[destino] = ubicadas[destino]
      ? `${ubicadas[destino]}\n${valor.trim()}`
      : valor.trim();
  }

  return ubicadas;
}
