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

export interface QuestionnaireQuestion {
  /** La clave con la que se guarda: `q1`, `q2`… No se toca nunca. */
  key: string;
  text: string;
  hint: string;
  /** Qué casillero de la calificación llena. Solo lo ve el panel. */
  para: string;
}

export const QUESTIONNAIRE: QuestionnaireQuestion[] = [
  {
    key: 'q1',
    text: '¿Cómo hacés hoy eso que querés mejorar?',
    hint: 'Contalo como se lo contarías a alguien que arranca mañana. Ej.: «los pedidos me llegan por WhatsApp, los anoto en un cuaderno y después los paso a un Excel».',
    para: 'Situación',
  },
  {
    key: 'q2',
    text: '¿Qué es lo que más te está costando de hacerlo así?',
    hint: 'Si podés, ponele número: horas por semana, pedidos que se pierden, plata. Ej.: «pierdo 2 horas por día cargando datos» o «se me caen 3 pedidos por mes».',
    para: 'Impacto',
  },
  {
    key: 'q3',
    text: '¿Ya intentaste resolverlo de otra forma?',
    hint: 'Una app, un Excel, alguien que te lo hizo antes, un sistema que compraste. Contame qué pasó y por qué no terminó de funcionar.',
    para: 'Alternativas',
  },
  {
    key: 'q4',
    text: 'Si decidimos avanzar, ¿la decisión la tomás vos o hay alguien más?',
    hint: 'Ej.: «la tomo yo», «lo decidimos con mi socio», «lo tiene que aprobar mi contador». Sirve para saber a quién sumar a la llamada.',
    para: 'Decisor',
  },
  {
    key: 'q5',
    text: '¿Para cuándo necesitás tenerlo funcionando y por qué esa fecha?',
    hint: 'El motivo importa más que la fecha. Ej.: «antes de la temporada de verano», «cuando abra el local nuevo», «no tengo apuro».',
    para: 'Plazo',
  },
  {
    key: 'q6',
    text: '¿Con qué presupuesto te estás manejando para esto?',
    hint: 'Un rango alcanza. No es un compromiso: me sirve para proponerte algo que entre, en vez de hacerte perder el tiempo.',
    para: 'Presupuesto',
  },
  {
    key: 'q7',
    text: '¿Algo más que quieras contarme antes de hablar?',
    hint: 'Links de páginas que te gusten, una referencia, algo que te preocupe. Opcional.',
    para: 'Contexto',
  },
];

/** Las respuestas guardadas, emparejadas con su pregunta. Sin las vacías. */
export function answeredQuestions(answers: unknown): { question: QuestionnaireQuestion; answer: string }[] {
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) return [];
  const byKey = answers as Record<string, unknown>;

  return QUESTIONNAIRE.flatMap((question) => {
    const value = byKey[question.key];
    return typeof value === 'string' && value.trim()
      ? [{ question, answer: value.trim() }]
      : [];
  });
}
