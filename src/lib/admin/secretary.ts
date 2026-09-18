import { SchemaType, type Schema } from '@google/generative-ai';
import { callJson } from '@/lib/x/providers';
import { startOfTodayISO, type Alert } from './alerts';

/**
 * El secretario del tablero.
 *
 * Su frontera es toda la idea: NO detecta nada. Recibe los avisos que las
 * reglas ya calcularon y escribe una línea que diga qué mirar primero. Si el
 * modelo estuviera del lado de la detección, un día sin cuota sería un día
 * sin avisos; así, apagarlo solo quita la línea de arriba y el tablero sigue
 * reclamando exactamente lo mismo.
 *
 * Una llamada por día, cacheada en `site_settings`. Reusa `callJson` del
 * circuito de X y no otro camino propio: ese seam ya tiene el failover a Groq
 * cuando Gemini se queda sin cuota, y mantener dos caminos distintos garantiza
 * que uno quede sin arreglar.
 */

const SUMMARY_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: { summary: { type: SchemaType.STRING } },
  required: ['summary'],
};

export function secretarySystemPrompt(): string {
  return `
Sos el secretario de un panel de administración. Silvano vende servicios de
software: capta leads, manda propuestas, publica contenido para atraer.

Te paso la lista de avisos que el sistema YA detectó. Tu trabajo es escribir
una sola frase, de dos o tres renglones como mucho, que le diga qué mirar
primero y por qué.

REGLAS
1. NO inventes nada. Podés usar solo los avisos que te paso. Si algo no está
   en esa lista, no existe.
2. No agregues números, nombres, fechas ni montos que no vengan en un aviso.
3. Priorizá lo que cuesta plata si se enfría: un lead sin contactar o una
   propuesta sin respuesta pesan más que un hilo trabado.
4. Hablá en segunda persona, directo y sin vueltas. Nada de "se recomienda".
5. No des consejos de marketing ni de ventas. Decí qué hay, no qué hacer.
6. Si la lista viene vacía, decí que no hay nada pendiente y nada más.

SALIDA
Solo JSON: { "summary": "..." }
`.trim();
}

/**
 * Los datos de la corrida. Van sin ids ni enlaces: son plomería del panel y
 * lo único que harían es darle al modelo material para inventar rutas.
 */
export function secretaryInput(alerts: Alert[], now: Date): string {
  return JSON.stringify({
    today: now.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    alerts: alerts.map((alert) => ({ text: alert.text, severity: alert.severity })),
  }, null, 2);
}

/** Un resumen escrito hoy sigue sirviendo hoy: no se paga dos veces. */
export function isSummaryFresh(writtenAt: string | null, now: Date): boolean {
  if (!writtenAt) return false;
  const moment = new Date(writtenAt).getTime();
  if (Number.isNaN(moment)) return false;
  return moment >= new Date(startOfTodayISO(now)).getTime();
}

export async function writeSummary(alerts: Alert[], now: Date): Promise<{ summary: string; provider: string }> {
  const { data, provider } = await callJson<{ summary: string }>(
    secretarySystemPrompt(),
    secretaryInput(alerts, now),
    SUMMARY_SCHEMA,
  );
  return { summary: data.summary.trim(), provider };
}
