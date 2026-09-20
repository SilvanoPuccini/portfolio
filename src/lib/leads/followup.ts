import { SchemaType, type Schema } from '@google/generative-ai';
import { callJson } from '@/lib/x/providers';

/**
 * El borrador del seguimiento cuando una propuesta se enfría.
 *
 * Misma frontera que el secretario del tablero: la IA escribe, nunca manda. Te
 * deja el texto en pantalla, vos lo editás y apretás enviar. Un correo que sale
 * solo a un cliente con una propuesta abierta es exactamente el tipo de cosa
 * que no se le delega a un modelo.
 *
 * Reusa `callJson` del circuito de X, así que hereda el failover a Groq cuando
 * Gemini se queda sin cuota.
 */

const FOLLOWUP_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    subject: { type: SchemaType.STRING },
    body: { type: SchemaType.STRING },
  },
  required: ['subject', 'body'],
};

export interface FollowupContext {
  name: string;
  /** Días desde que salió la propuesta. */
  daysWaiting: number;
  amount: number | null;
  /** Lo que el cliente dijo que necesitaba. */
  requirement: string | null;
  /** Lo que le duele hoy, de la llamada. */
  pain: string | null;
  /** Lo que dijo que le preocupaba: casi siempre es el motivo del silencio. */
  concerns: string | null;
  /** Los seguimientos ya enviados, del más viejo al más nuevo. */
  previous?: { sentAt: string; body: string }[];
}

export function followupSystemPrompt(): string {
  return `
Escribís el seguimiento de una propuesta que quedó sin respuesta. El que
vende es Silvano, desarrollador de software. El destinatario ya tuvo una
llamada con él y recibió una propuesta con precio.

REGLAS
1. NO inventes nada. Usá solo los datos que te paso. Si no sabés algo, no lo
   menciones: no supongas motivos, avances ni conversaciones que no están.
2. Nada de presión ni urgencia falsa. Sin "última oportunidad", sin
   descuentos, sin plazos que nadie acordó.
3. Si hay preocupaciones registradas de la llamada, el correo se apoya en
   esas: casi siempre son el motivo real del silencio.
4. Ofrecé una salida fácil. Que pueda decir "no" o "todavía no" en una línea,
   sin sentirse mal. Eso da más respuestas que insistir.
5. Corto: cuatro o cinco frases. Nadie lee un seguimiento largo.
6. Tuteo rioplatense, directo y sin vueltas. Nada de "quedo a la espera" ni
   "no dude en contactarme".
7. No cierres con una pregunta de sí o no sobre la compra. Preguntá algo que
   se pueda contestar sin decidir.
8. Si te paso seguimientos anteriores, NO repitas lo que ya se dijo: ni el
   mismo argumento ni la misma pregunta. Cambiá el enfoque. Un segundo correo
   igual al primero es lo que hace que dejen de contestar.

SALIDA
Solo JSON: { "subject": "...", "body": "..." }
El body va en texto plano, con saltos de línea entre párrafos.
`.trim();
}

export function followupInput(context: FollowupContext): string {
  return JSON.stringify({
    cliente: context.name,
    dias_sin_respuesta: context.daysWaiting,
    monto_propuesto: context.amount,
    // Solo lo que existe: los nulos se van para que el modelo no tenga
    // campos vacíos que rellenar por su cuenta.
    lo_que_necesitaba: context.requirement ?? undefined,
    lo_que_le_duele: context.pain ?? undefined,
    lo_que_le_preocupaba: context.concerns ?? undefined,
    seguimientos_ya_enviados: context.previous?.length ? context.previous : undefined,
  }, null, 2);
}

export async function draftFollowup(context: FollowupContext) {
  const { data, provider, tokens } = await callJson<{ subject: string; body: string }>(
    followupSystemPrompt(),
    followupInput(context),
    FOLLOWUP_SCHEMA,
  );

  return {
    subject: data.subject.trim(),
    body: data.body.trim(),
    provider,
    tokens,
  };
}
