import { boton, emailLayout, nota, panelDestacado, parrafo } from './layout';

/**
 * El único correo que se manda al agendar la llamada.
 *
 * Antes eran dos: uno confirmaba la reunión y otro pedía el cuestionario.
 * Llegaban casi juntos, decían cosas parecidas y el cliente terminaba
 * abriendo el que encontraba primero.
 *
 * Es uno solo y con un solo botón. Las preguntas son opcionales y se dice:
 * si no las contesta, se ven en la llamada. Nadie abandona por no poder
 * contestar algo, pero mucha gente abandona por sentir que debe.
 */

export interface LlamadaAgendada {
  nombre: string;
  /** Cuándo es, ya escrito para leer. */
  cuando: string;
  /** El link único del cliente, que lo lleva a las preguntas. */
  url: string;
  /** Cuántas preguntas le quedan por contestar. */
  preguntas: number;
}

export function llamadaAgendadaHtml(data: LlamadaAgendada): string {
  const cuantas = data.preguntas === 1
    ? 'Queda una sola pregunta'
    : `Son ${data.preguntas} preguntas`;

  // Si ya contestó, pedírselo de nuevo es pedirle el trabajo dos veces.
  const pide = data.preguntas > 0;

  return emailLayout({
    preheader: pide
      ? `${data.cuando}. Si podés, contestame unas preguntas antes.`
      : `${data.cuando}. Nos vemos.`,
    eyebrow: 'Llamada agendada',
    titulo: `Listo, ${data.nombre}. Nos vemos.`,
    cuerpo: [
      parrafo('Te confirmo la llamada. Dura 45 minutos y no tiene costo ni compromiso.'),

      panelDestacado({ etiqueta: 'Cuándo', valor: data.cuando }),

      ...(pide
        ? [
          parrafo(`Si tenés cinco minutos antes, contestame unas preguntas. ${cuantas} y con eso `
            + 'llego a la llamada entendiendo tu situación: los 45 minutos los usamos para '
            + 'resolver y no para tomar datos.'),
          boton('Contestar las preguntas', data.url),
          nota('Es opcional. Si no llegás, no pasa nada: las vemos juntos en la llamada.'),
        ]
        : [parrafo('Ya tengo tus respuestas, así que llegamos con la mitad del camino hecho.')]),

      nota('Si te surge algo y no podés, respondé este correo y lo movemos.'),
    ].join(''),
  });
}
