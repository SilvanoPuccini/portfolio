/**
 * Las preguntas que el cliente contesta antes de la llamada.
 *
 * Viven acá y no en la página porque las lee también el panel: las respuestas
 * se guardan como `q1`, `q2`… y sin el texto al lado son seis párrafos sin
 * contexto. Una respuesta que no se puede leer es una respuesta que no existe.
 *
 * Cada una llena un casillero de la calificación —problema, impacto,
 * alternativas, quién decide, plazo y presupuesto—, que es lo que después dice
 * si esa venta se puede cerrar. Si llegan contestadas, los 45 minutos de la
 * llamada se usan para profundizar y no para tomar datos.
 *
 * El ejemplo no es decoración: una pregunta abstracta («¿cómo se ve el éxito
 * para usted?») se contesta con una abstracción, y con eso no se cotiza nada.
 */

import type { Locale, Localized, PreguntaServicio } from '@/content/servicios';

export interface QuestionnaireQuestion {
  /** La clave con la que se guarda: `q1`, `q2`… No se toca nunca. */
  key: string;
  text: Localized<string>;
  hint: Localized<string>;
  /** Qué casillero de la calificación llena. Solo lo ve el panel. */
  para: string;
}

/** La misma pregunta, ya resuelta a un idioma: es lo que ve una pantalla. */
export interface ResolvedQuestion {
  key: string;
  text: string;
  hint: string;
  para: string;
  /** Cuando la pregunta se contesta eligiendo, no escribiendo. */
  opciones?: string[];
}

export const QUESTIONNAIRE: QuestionnaireQuestion[] = [
  {
    key: 'q1',
    text: {
      es: '¿Cómo hacés hoy eso que querés mejorar?',
      en: "How do you handle today the thing you want to improve?",
    },
    hint: {
      es: 'Contalo como se lo contarías a alguien que arranca mañana. Ej.: «los pedidos me llegan por WhatsApp, los anoto en un cuaderno y después los paso a un Excel».',
      en: "Tell it the way you would to someone starting tomorrow. For example: orders come in on WhatsApp, I write them in a notebook and then copy them into a spreadsheet.",
    },
    para: 'Situación',
  },
  {
    key: 'q2',
    text: {
      es: '¿Qué es lo que más te está costando de hacerlo así?',
      en: "What is the hardest part of doing it that way?",
    },
    hint: {
      es: 'Si podés, ponele número: horas por semana, pedidos que se pierden, plata. Ej.: «pierdo 2 horas por día cargando datos» o «se me caen 3 pedidos por mes».',
      en: "Put a number on it if you can: hours per week, lost orders, money. For example: I lose 2 hours a day on data entry, or I lose 3 orders a month.",
    },
    para: 'Impacto',
  },
  {
    key: 'q3',
    text: {
      es: '¿Ya intentaste resolverlo de otra forma?',
      en: "Have you already tried to solve it some other way?",
    },
    hint: {
      es: 'Una app, un Excel, alguien que te lo hizo antes, un sistema que compraste. Contame qué pasó y por qué no terminó de funcionar.',
      en: "An app, a spreadsheet, someone who built it for you before, a system you bought. Tell me what happened and why it did not quite work.",
    },
    para: 'Alternativas',
  },
  {
    key: 'q4',
    text: {
      es: 'Si decidimos avanzar, ¿la decisión la tomás vos o hay alguien más?',
      en: "If we move forward, do you decide on your own or is someone else involved?",
    },
    hint: {
      es: 'Ej.: «la tomo yo», «lo decidimos con mi socio», «lo tiene que aprobar mi contador». Sirve para saber a quién sumar a la llamada.',
      en: "For example: I decide, we decide with my partner, my accountant has to approve it. It tells me who to invite to the call.",
    },
    para: 'Decisor',
  },
  {
    key: 'q5',
    text: {
      es: '¿Para cuándo necesitás tenerlo funcionando y por qué esa fecha?',
      en: "When do you need it running, and why that date?",
    },
    hint: {
      es: 'El motivo importa más que la fecha. Ej.: «antes de la temporada de verano», «cuando abra el local nuevo», «no tengo apuro».',
      en: "The reason matters more than the date. For example: before the summer season, when the new store opens, no rush.",
    },
    para: 'Plazo',
  },
  {
    key: 'q6',
    text: {
      es: '¿Con qué presupuesto te estás manejando para esto?',
      en: "What budget are you working with for this?",
    },
    hint: {
      es: 'Un rango alcanza. No es un compromiso: me sirve para proponerte algo que entre, en vez de hacerte perder el tiempo.',
      en: "A range is enough. It is not a commitment: it helps me propose something that fits instead of wasting your time.",
    },
    para: 'Presupuesto',
  },
  {
    key: 'q7',
    text: {
      es: '¿Algo más que quieras contarme antes de hablar?',
      en: "Anything else you want to tell me before we talk?",
    },
    hint: {
      es: 'Links de páginas que te gusten, una referencia, algo que te preocupe. Opcional.',
      en: "Links to sites you like, a reference, something that worries you. Optional.",
    },
    para: 'Contexto',
  },
];

/** Una pregunta del catálogo, con la misma forma que las de calificación. */
export function fromServicio(pregunta: PreguntaServicio, locale: Locale = 'es'): ResolvedQuestion {
  return {
    key: pregunta.key,
    text: pregunta.label[locale],
    hint: pregunta.hint[locale],
    para: 'Alcance',
    opciones: pregunta.opciones?.[locale],
  };
}

export function resolveQuestion(question: QuestionnaireQuestion, locale: Locale = 'es'): ResolvedQuestion {
  return { key: question.key, text: question.text[locale], hint: question.hint[locale], para: question.para };
}

/**
 * Las respuestas guardadas, emparejadas con su pregunta. Sin las vacías.
 *
 * `extra` son las preguntas del servicio: el cuestionario ya no es una lista
 * fija, así que una respuesta puede venir de una pregunta que no está entre
 * las siete de calificación.
 */
export function answeredQuestions(
  answers: unknown,
  extra: PreguntaServicio[] = [],
  locale: Locale = 'es',
): { question: ResolvedQuestion; answer: string }[] {
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) return [];
  const byKey = answers as Record<string, unknown>;

  const todas: ResolvedQuestion[] = [
    ...QUESTIONNAIRE.map((q) => resolveQuestion(q, locale)),
    ...extra.map((q) => fromServicio(q, locale)),
  ];

  return todas.flatMap((question) => {
    const value = byKey[question.key];
    return typeof value === 'string' && value.trim()
      ? [{ question, answer: value.trim() }]
      : [];
  });
}
