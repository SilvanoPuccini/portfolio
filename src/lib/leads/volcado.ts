/**
 * Lo que el cliente escribió antes de la llamada, puesto donde la venta lo lee.
 *
 * El cuestionario guarda sus respuestas en `questionnaires.answers`, un jsonb
 * que solo abre la pantalla del cuestionario. Todo el resto de la ficha —el
 * semáforo de calificación, lo que falta averiguar, la recomendación, el
 * contrato— lee las columnas de `leads`. Mientras las dos mitades estuvieron
 * sin unir, el cliente contestaba seis preguntas y la llamada arrancaba igual
 * de vacía que si no hubiera contestado ninguna.
 *
 * Se vuelca acá y no en cada pantalla a propósito: si cada consumidor tuviera
 * que saber de `questionnaires`, el día que aparezca un séptimo consumidor se
 * va a olvidar de mirar, y va a repreguntar.
 */

/** Las columnas de `leads` que el cuestionario puede llenar. */
export interface ColumnasDelLead {
  que_construir?: string | null;
  problema?: string | null;
  plazo?: string | null;
  presupuesto_rango?: string | null;
}

/**
 * Qué respuesta llena qué columna.
 *
 * Solo cuatro de las siete tienen columna. Las otras —alternativas, quién
 * decide y el contexto libre— no tienen dónde ir en `leads` y se leen desde
 * las respuestas del cuestionario, ubicadas en la pregunta de la guía que les
 * corresponde. Inventarles una columna sería agrandar la tabla para nada.
 */
const A_COLUMNA: Record<string, keyof ColumnasDelLead> = {
  q1: 'que_construir',
  q2: 'problema',
  q5: 'plazo',
  q6: 'presupuesto_rango',
};

const conTexto = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

/**
 * Lo que hay que escribir en la venta, y nada más que eso.
 *
 * Nunca pisa una columna que ya tenga algo: si lo corregí a mano en el panel
 * después de hablar con el cliente, eso vale más que lo que escribió apurado
 * en un formulario. Devuelve un objeto vacío cuando no hay nada que cambiar,
 * así quien llama puede saltarse el UPDATE.
 */
export function volcarRespuestas(
  answers: unknown,
  lead: ColumnasDelLead,
): Partial<Record<keyof ColumnasDelLead, string>> {
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) return {};

  const respuestas = answers as Record<string, unknown>;
  const cambios: Partial<Record<keyof ColumnasDelLead, string>> = {};

  for (const [clave, columna] of Object.entries(A_COLUMNA)) {
    const valor = respuestas[clave];
    if (!conTexto(valor)) continue;
    if (conTexto(lead[columna])) continue;
    cambios[columna] = valor.trim();
  }

  return cambios;
}
