/**
 * La guía de la llamada de diagnóstico: una venta, no un formulario.
 *
 * Dos marcos, que hacen cosas distintas y se usan juntos:
 *
 * - SPIN es el motor de la conversación. Situación → Problema → Implicación →
 *   Necesidad de solución. Sirve porque la conclusión la saca el cliente: no
 *   le explicás que tiene un problema, se lo escuchás contar.
 * - MEDDPICC es la checklist de calificación. No se pregunta, se registra: si
 *   al final de la llamada no sabés quién firma ni cuánto le cuesta el
 *   problema, esa venta no está por cerrarse aunque la charla haya sido linda.
 *
 * Por eso cada etapa termina en un CIERRE: algo que el cliente confirma en voz
 * alta. Si una etapa no cierra, seguir de largo no la arregla — ahí está el
 * problema, y el que aparece en la propuesta dos semanas después.
 *
 * El orden es deliberado: el alcance recién en el minuto 24 y la plata en el
 * 36. Preguntar «qué querés que te construya» antes de entender el proceso es
 * cómo se venden sistemas que nadie usa.
 */

export type DiagnosisField =
  | 'objetivo' | 'situacion' | 'requerimiento' | 'dolor' | 'deseo' | 'preocupaciones';

export interface GuideQuestion {
  /** Estable: es la clave con la que se guarda la respuesta. */
  id: string;
  text: string;
}

export interface GuideStage {
  id: string;
  title: string;
  /** Minuto de la llamada en que arranca, sobre 45. */
  from: number;
  to: number;
  /**
   * En qué campo del diagnóstico se resume esta etapa. Los nombres vienen del
   * CRM viejo y se conservan: renombrarlos dejaría huérfanas las filas vivas.
   */
  field: DiagnosisField | null;
  /** La letra de SPIN que trabaja esta etapa, si corresponde. */
  spin?: 'S' | 'P' | 'I' | 'N';
  questions: GuideQuestion[];
  /** Qué escuchar: lo que separa un dato de un síntoma. */
  listenFor: string;
  /** El micro-compromiso que cierra la etapa. */
  close: string;
  /** Señales de que la venta va a salir mal si seguís de largo. */
  flags: string[];
}

export const CALL_GUIDE: GuideStage[] = [
  {
    id: 'encuadre',
    title: 'Encuadre y acuerdo',
    from: 0, to: 3, field: null,
    questions: [
      { id: 'encuadre.motivo', text: 'Contame en qué andás y por qué me escribiste.' },
      { id: 'encuadre.agenda', text: 'Te propongo 30 minutos de preguntas mías y 10 para lo que quieras preguntarme vos. ¿Te sirve?' },
    ],
    listenFor: 'Cómo cuenta el problema cuando nadie lo guió todavía. Las primeras tres frases suelen traer el dolor real.',
    close: 'Acepta la agenda y sabe que al final le vas a decir si podés ayudarlo o no.',
    flags: ['Si arranca pidiendo precio, encuadrá: sin entender el alcance, cualquier número es mentira.'],
  },
  {
    id: 'situacion',
    title: 'La situación de hoy',
    from: 3, to: 10, field: 'situacion', spin: 'S',
    questions: [
      { id: 'situacion.proceso', text: '¿Cómo lo resolvés hoy, sin sistema? Llevame por un caso real de esta semana.' },
      { id: 'situacion.gente', text: '¿Quiénes tocan eso y cuántas veces por día?' },
      { id: 'situacion.herramientas', text: '¿Con qué se manejan hoy? (Excel, WhatsApp, papel, otro sistema)' },
      { id: 'situacion.volumen', text: '¿Qué volumen manejan? (pedidos, clientes, productos por mes)' },
    ],
    listenFor: 'El proceso, no la herramienta que pide. Anotá cantidades: personas, pedidos por día, horas.',
    close: 'Le repetís su proceso en una frase y te lo corrige o confirma.',
    flags: [
      'Si no puede describir el proceso, no hay proceso que digitalizar todavía.',
      'Si arranca por «quiero una app», traelo de vuelta al proceso.',
    ],
  },
  {
    id: 'problema',
    title: 'El problema y lo que cuesta',
    from: 10, to: 18, field: 'dolor', spin: 'P',
    questions: [
      { id: 'problema.donde', text: '¿Dónde se te cae ese proceso? ¿Qué es lo que más tiempo te come?' },
      { id: 'problema.ultima_vez', text: '¿Qué pasa cuando falla? Contame la última vez.' },
      { id: 'problema.costo', text: '¿Cuánto te cuesta eso por mes, en plata o en horas?' },
      { id: 'problema.porque_ahora', text: '¿Por qué lo querés resolver ahora y no el año pasado?' },
    ],
    listenFor: 'Un número o un episodio concreto. «Perdemos tiempo» no es un dolor; «se nos cayeron tres pedidos el mes pasado» sí.',
    close: 'Sale un número: lo que le cuesta el problema por mes. Sin ese número no hay con qué comparar el precio.',
    flags: [
      'Si no hay costo ni urgencia, la propuesta se va a enfriar por más buena que sea.',
      'Si el problema es de personas o de procesos, decilo: el software no lo arregla.',
    ],
  },
  {
    id: 'valor',
    title: 'Qué gana si lo resuelve',
    from: 18, to: 24, field: 'objetivo', spin: 'N',
    questions: [
      { id: 'valor.resultado', text: 'Si esto funciona, ¿qué querés que pase en el negocio?' },
      { id: 'valor.medida', text: '¿Cómo vas a saber que valió la pena? ¿Qué número mirás?' },
      { id: 'valor.dia', text: '¿Cómo te imaginás un martes cualquiera con esto funcionando?' },
    ],
    listenFor: 'Que el VALOR lo diga él, no vos. Lo que el cliente formula con sus palabras después no lo discute.',
    close: 'Él dice qué gana. Si lo decís vos, no cuenta.',
    flags: ['Si el objetivo es «tener presencia», el proyecto no tiene con qué medirse después.'],
  },
  {
    id: 'alcance',
    title: 'El alcance mínimo',
    from: 24, to: 30, field: 'requerimiento',
    questions: [
      { id: 'alcance.minimo', text: 'De todo esto, ¿qué es lo mínimo que te cambia el día si lo tenés el mes que viene?' },
      { id: 'alcance.duenio', text: '¿Quién lo va a cargar y a mantener una vez que esté?' },
      { id: 'alcance.integraciones', text: '¿Hay que conectarlo con algo que ya usás? (pagos, facturación, stock, mail)' },
      { id: 'alcance.usuarios', text: '¿Quiénes entran al sistema? ¿Cada uno con su usuario?' },
      { id: 'alcance.referencias', text: '¿Viste algo parecido que te guste? ¿Qué le copiarías?' },
    ],
    listenFor: 'La primera versión, no el sistema completo. Separá lo que va ahora de lo que va después.',
    close: 'Quedan dos listas acordadas: lo que va ahora y lo que va después.',
    flags: [
      'Si todo es imprescindible, nada lo es: hacelo elegir.',
      'Si nadie se va a hacer cargo de cargar los datos, el sistema muere a los dos meses.',
    ],
  },
  {
    id: 'decision',
    title: 'Quién decide y con qué criterio',
    from: 30, to: 36, field: 'preocupaciones',
    questions: [
      { id: 'decision.quien', text: 'Además de vos, ¿quién tiene que dar el sí?' },
      { id: 'decision.criterios', text: '¿Qué te haría elegir a otro? ¿Qué te haría decir que no?' },
      { id: 'decision.proceso', text: 'Si te mando la propuesta, ¿qué pasa de ahí hasta que se firma?' },
      { id: 'decision.competencia', text: '¿Estás hablando con alguien más o mirando otra opción?' },
    ],
    listenFor: 'Lo que conteste acá es lo que después te deja en visto. Anotalo con sus palabras.',
    close: 'Sabés quién firma y qué tiene que pasar para que firme.',
    flags: [
      'Si no es quien decide, pedí que la próxima llamada sea con quien decide.',
      'Si «lo tengo que hablar con» aparece recién al final, la propuesta ya nació con un freno.',
    ],
  },
  {
    id: 'plata',
    title: 'Plata y plazo',
    from: 36, to: 41, field: 'deseo',
    questions: [
      { id: 'plata.rango', text: '¿Con qué presupuesto estás manejándote para esto?' },
      { id: 'plata.cuando', text: '¿Para cuándo necesitás tenerlo funcionando y por qué esa fecha?' },
      { id: 'plata.forma', text: 'Trabajo con una seña para arrancar y el resto contra entrega. ¿Te sirve así?' },
    ],
    listenFor: 'La reacción al rango, más que el número. Un silencio largo dice más que un «es mucho».',
    close: 'Hay un rango dicho en voz alta y una fecha con un motivo detrás.',
    flags: ['Si esquiva el presupuesto dos veces, decí vos un rango y mirá la reacción.'],
  },
  {
    id: 'cierre',
    title: 'Cierre de prueba y próximo paso',
    from: 41, to: 45, field: null,
    questions: [
      { id: 'cierre.resumen', text: 'Te repito lo que entendí, corregime si algo está mal…' },
      { id: 'cierre.prueba', text: 'Si te mando esto que hablamos por [rango], ¿avanzamos?' },
      { id: 'cierre.proximo', text: 'Entonces te mando la propuesta el [día]. ¿Te queda alguna duda antes de cortar?' },
    ],
    listenFor: 'La respuesta al cierre de prueba. Un «sí, mandámela» y un «dejame verla» son dos ventas distintas.',
    close: 'Sabés si vendiste, y hay fecha de propuesta acordada.',
    flags: ['Nunca cortes sin próximo paso con fecha. «Te aviso» no es un próximo paso.'],
  },
];

export const GUIDE_MINUTES = CALL_GUIDE[CALL_GUIDE.length - 1].to;

/** Las respuestas de la llamada: una por pregunta, por su id. */
export type GuideAnswers = Record<string, string>;

export function parseAnswers(value: unknown): GuideAnswers {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, text]) => typeof text === 'string' && text.trim())
      .map(([id, text]) => [id, (text as string).trim()]),
  );
}

const filled = (answers: GuideAnswers, id: string) => Boolean(answers[id]?.trim());

/**
 * El semáforo de calificación (MEDDPICC en criollo).
 *
 * No se pregunta aparte: sale de lo que ya anotaste. Es el dato que dice a
 * cuál propuesta perseguir, y con tres o menos en verde esa venta casi seguro
 * se enfría por más buena que haya estado la charla.
 */
export const QUALIFICATION: { id: string; label: string; questionId: string }[] = [
  { id: 'dolor', label: 'Dolor', questionId: 'problema.donde' },
  { id: 'impacto', label: 'Impacto', questionId: 'problema.costo' },
  { id: 'urgencia', label: 'Urgencia', questionId: 'problema.porque_ahora' },
  { id: 'decisor', label: 'Decisor', questionId: 'decision.quien' },
  { id: 'criterios', label: 'Criterios', questionId: 'decision.criterios' },
  { id: 'presupuesto', label: 'Presupuesto', questionId: 'plata.rango' },
  { id: 'plazo', label: 'Plazo', questionId: 'plata.cuando' },
];

export function qualification(answers: GuideAnswers): { id: string; label: string; ok: boolean }[] {
  return QUALIFICATION.map(({ id, label, questionId }) => ({ id, label, ok: filled(answers, questionId) }));
}

export function qualificationScore(answers: GuideAnswers): { ok: number; total: number } {
  const checks = qualification(answers);
  return { ok: checks.filter((check) => check.ok).length, total: checks.length };
}

/** Cuántas preguntas de la etapa ya tienen respuesta. */
export function stageProgress(stage: GuideStage, answers: GuideAnswers): { filled: number; total: number } {
  return {
    filled: stage.questions.filter((question) => filled(answers, question.id)).length,
    total: stage.questions.length,
  };
}

/**
 * El resumen de una etapa: sus respuestas, una por línea, con la pregunta
 * adelante. Es lo que se guarda en el campo del diagnóstico y lo que después
 * leen la propuesta, el seguimiento y la recomendación.
 */
export function stageSummary(stage: GuideStage, answers: GuideAnswers): string {
  return stage.questions
    .filter((question) => filled(answers, question.id))
    .map((question) => `${question.text}\n${answers[question.id].trim()}`)
    .join('\n\n');
}

/** Los seis campos del diagnóstico, armados con lo anotado en la llamada. */
export function diagnosisFromAnswers(answers: GuideAnswers): Record<DiagnosisField, string> {
  const result = {} as Record<DiagnosisField, string>;
  for (const stage of CALL_GUIDE) {
    if (stage.field) result[stage.field] = stageSummary(stage, answers);
  }
  return result;
}

export function guideProgress(answers: GuideAnswers): { filled: number; total: number } {
  const questions = CALL_GUIDE.flatMap((stage) => stage.questions);
  return {
    filled: questions.filter((question) => filled(answers, question.id)).length,
    total: questions.length,
  };
}

export interface FormAnswers {
  que_construir?: string | null;
  secciones?: string | null;
  problema?: string | null;
  presupuesto_rango?: string | null;
  plazo?: string | null;
  integraciones?: string[] | null;
  tiene_login?: boolean | null;
  tiene_pagos?: boolean | null;
  tiene_admin?: string | null;
  tiene_marca?: boolean | null;
  tiene_contenido?: boolean | null;
}

/**
 * Lo que el cliente NO contestó en el formulario de la web.
 *
 * Sirve para lo contrario de lo que parece: lo que YA contestó no se vuelve a
 * preguntar —hacerlo dice que no lo leíste—, y lo que falta hay que
 * averiguarlo sí o sí en la llamada.
 */
export function missingFromForm(form: FormAnswers): string[] {
  const missing: string[] = [];
  const empty = (value: string | null | undefined) => !value || value.trim().length === 0;

  if (empty(form.que_construir)) missing.push('Qué quiere construir');
  if (empty(form.problema)) missing.push('Qué problema lo trajo');
  if (empty(form.secciones)) missing.push('Qué secciones o pantallas necesita');
  if (empty(form.presupuesto_rango)) missing.push('Con qué presupuesto se maneja');
  if (empty(form.plazo)) missing.push('Para cuándo lo necesita');
  if (form.tiene_login == null) missing.push('Si necesita usuarios y login');
  if (form.tiene_pagos == null) missing.push('Si necesita cobrar online');
  if (empty(form.tiene_admin)) missing.push('Si necesita panel de administración');
  if (!form.integraciones || form.integraciones.length === 0) missing.push('Con qué sistemas hay que conectarlo');
  if (form.tiene_marca == null) missing.push('Si ya tiene marca y diseño');
  if (form.tiene_contenido == null) missing.push('Si ya tiene el contenido');

  return missing;
}
