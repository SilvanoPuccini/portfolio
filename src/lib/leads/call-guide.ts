/**
 * La guía de la llamada de diagnóstico.
 *
 * La ficha tenía seis casillas de diagnóstico vacías y ninguna pregunta: qué
 * preguntar para llenarlas vivía en la cabeza de quien atendía la llamada. El
 * riesgo de eso no es olvidarse una pregunta, es el otro: llegar con la
 * solución ya decidida y usar la llamada para confirmarla.
 *
 * Por eso el orden de los bloques es deliberado. Primero la situación y el
 * problema; el alcance recién en el minuto 31. Preguntar «qué querés que te
 * construya» antes de entender el proceso es cómo se venden sistemas que
 * nadie usa.
 *
 * Cada bloque escribe en uno de los campos que YA existen: la guía no es un
 * formulario nuevo, es la misma ficha mostrada en el orden de la conversación.
 */

export type DiagnosisField =
  | 'objetivo' | 'situacion' | 'requerimiento' | 'dolor' | 'deseo' | 'preocupaciones';

export interface GuideBlock {
  id: string;
  title: string;
  /** Minuto de la llamada en que arranca, sobre 45. */
  from: number;
  to: number;
  /** Dónde se anota lo que conteste. `null` = no se anota, se conversa. */
  field: DiagnosisField | null;
  questions: string[];
  /** Qué escuchar en la respuesta: lo que separa un dato de un síntoma. */
  listenFor: string;
  /** Señales de que la venta va a salir mal si seguís de largo. */
  flags: string[];
}

export const CALL_GUIDE: GuideBlock[] = [
  {
    id: 'apertura',
    title: 'Apertura y encuadre',
    from: 0, to: 5, field: null,
    questions: [
      'Contame en qué andás y por qué me escribiste.',
      'Te propongo esto: 30 minutos de preguntas mías para entender el negocio y 10 para lo que quieras preguntarme vos. ¿Te sirve?',
      'Al final de la llamada te digo si puedo ayudarte o no. Si no puedo, te lo digo igual.',
    ],
    listenFor: 'Cómo cuenta el problema cuando todavía nadie lo guió. Las primeras tres frases suelen traer el dolor real.',
    flags: ['Si arranca pidiendo precio, encuadrá: sin entender el alcance, cualquier número es mentira.'],
  },
  {
    id: 'situacion',
    title: 'La situación de hoy',
    from: 5, to: 12, field: 'situacion',
    questions: [
      '¿Cómo lo resolvés hoy, sin sistema?',
      '¿Quiénes tocan eso y cuántas veces por día?',
      'Llevame por el paso a paso de un caso real de esta semana.',
      '¿Qué herramientas usan hoy? (Excel, WhatsApp, papel, otro sistema)',
    ],
    listenFor: 'El proceso, no la herramienta que pide. Anotá cantidades: personas, pedidos por día, horas.',
    flags: [
      'Si no puede describir el proceso, no hay proceso que digitalizar todavía.',
      'Si arranca por «quiero una app», traelo de vuelta al proceso.',
    ],
  },
  {
    id: 'dolor',
    title: 'El problema y lo que cuesta',
    from: 12, to: 20, field: 'dolor',
    questions: [
      '¿Dónde se te cae ese proceso? ¿Qué es lo que más tiempo te come?',
      '¿Qué pasa cuando falla? Contame la última vez.',
      '¿Cuánto te cuesta eso por mes, en plata o en horas?',
      '¿Por qué lo querés resolver ahora y no el año pasado?',
    ],
    listenFor: 'Un número o un episodio concreto. «Perdemos tiempo» no es un dolor: «se nos cayeron tres pedidos el mes pasado» sí.',
    flags: [
      'Si no hay costo ni urgencia, la propuesta se va a enfriar por más buena que sea.',
      'Si el problema es de personas o de procesos, decilo: el software no lo arregla.',
    ],
  },
  {
    id: 'objetivo',
    title: 'El objetivo del negocio',
    from: 20, to: 27, field: 'objetivo',
    questions: [
      'Si esto funciona, ¿qué querés que pase en el negocio?',
      '¿Cómo vas a saber que valió la pena? ¿Qué número mirás?',
      '¿Dónde querés estar en seis meses?',
    ],
    listenFor: 'Un resultado de negocio: vender más, atender más rápido, dejar de perder pedidos. No una lista de pantallas.',
    flags: ['Si el objetivo es «tener presencia», el proyecto no tiene con qué medirse después.'],
  },
  {
    id: 'deseo',
    title: 'Cómo se imagina la solución',
    from: 27, to: 31, field: 'deseo',
    questions: [
      '¿Cómo te imaginás usándolo un martes cualquiera?',
      '¿Viste algo parecido que te guste? ¿Qué le copiarías?',
      '¿Qué tiene que pasar sí o sí para que lo uses todos los días?',
    ],
    listenFor: 'Lo que valora de verdad. Acá aparece lo que hay que hacer bien aunque no esté en la lista.',
    flags: ['Si te describe un sistema enorme, no lo corrijas todavía: lo vas a recortar en el bloque de alcance.'],
  },
  {
    id: 'requerimiento',
    title: 'El alcance: qué construimos',
    from: 31, to: 38, field: 'requerimiento',
    questions: [
      'De todo esto, ¿qué es lo mínimo que te cambia el día si lo tenés el mes que viene?',
      '¿Quién lo va a cargar y a mantener?',
      '¿Hay que conectarlo con algo que ya usás? (pagos, facturación, stock, mail)',
      '¿Quiénes entran al sistema? ¿Hace falta que cada uno tenga su usuario?',
    ],
    listenFor: 'La primera versión, no el sistema completo. Separá lo que va ahora de lo que va después.',
    flags: [
      'Si todo es imprescindible, nada lo es: hacelo elegir.',
      'Si nadie se va a hacer cargo de cargar los datos, el sistema muere a los dos meses.',
    ],
  },
  {
    id: 'preocupaciones',
    title: 'Decisión, plata y plazos',
    from: 38, to: 43, field: 'preocupaciones',
    questions: [
      '¿Además de vos, quién decide esto?',
      '¿Qué te haría decir que no?',
      '¿Con qué presupuesto estás manejándote para esto?',
      '¿Para cuándo necesitás tenerlo funcionando y por qué esa fecha?',
    ],
    listenFor: 'Lo que conteste acá es lo que después te deja en visto. Anotalo con sus palabras.',
    flags: [
      'Si no es quien decide, pedí que la próxima llamada sea con quien decide.',
      'Si esquiva el presupuesto dos veces, decí vos un rango y mirá la reacción.',
    ],
  },
  {
    id: 'cierre',
    title: 'Cierre y próximo paso',
    from: 43, to: 45, field: null,
    questions: [
      'Te repito lo que entendí, corregime si algo está mal…',
      'Lo que sigue es: te mando la propuesta con alcance y precio el [día].',
      '¿Alguna pregunta antes de cortar?',
    ],
    listenFor: 'La corrección que te haga al repetirle el problema. Es la última oportunidad de enderezar el diagnóstico.',
    flags: ['Nunca cortes sin fecha de propuesta y sin próximo paso acordado.'],
  },
];

/** Los minutos que dura la llamada según la guía. */
export const GUIDE_MINUTES = CALL_GUIDE[CALL_GUIDE.length - 1].to;

export interface DiagnosisValues {
  objetivo?: string | null;
  situacion?: string | null;
  requerimiento?: string | null;
  dolor?: string | null;
  deseo?: string | null;
  preocupaciones?: string | null;
}

/** Cuántos campos del diagnóstico ya tienen algo escrito. */
export function guideProgress(values: DiagnosisValues): { filled: number; total: number } {
  const fields = CALL_GUIDE.map((block) => block.field).filter((f): f is DiagnosisField => f !== null);
  const filled = fields.filter((field) => (values[field] ?? '').trim().length > 0).length;
  return { filled, total: fields.length };
}

/** Un bloque queda pendiente mientras su campo esté vacío. */
export function isBlockDone(block: GuideBlock, values: DiagnosisValues): boolean {
  if (!block.field) return false;
  return (values[block.field] ?? '').trim().length > 0;
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
