import { GoogleGenerativeAI, type Schema } from '@google/generative-ai';
import { jsonrepair } from 'jsonrepair';

/**
 * Cliente Gemini de bajo nivel: una llamada al modelo con retry interno y
 * un contrato de JSON por esquema declarado. No decide estrategias: eso vive
 * en providers.ts.
 */

/**
 * La cadena de modelos, del preferido al último respaldo. Cada modelo tiene su
 * propia cuota, así que agotar uno no agota el siguiente. `gemini-2.5-flash`
 * va último: Google ya no lo da a cuentas nuevas, pero en las viejas sigue
 * andando, y si lo apagan su 404 solo lo saltea.
 */
export const DEFAULT_GEMINI_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash-lite',
  'gemini-2.5-flash',
];

/** Vueltas completas a la cadena cuando todos los modelos están saturados. */
const MAX_ROUNDS = 3;
const BACKOFF_MS = [0, 8_000, 20_000];

/**
 * `GEMINI_MODEL` fija el preferido sin tocar código; el resto de la cadena
 * queda detrás como respaldo para que un modelo caído no tumbe el circuito.
 */
export function geminiModels(): string[] {
  const preferred = process.env.GEMINI_MODEL?.trim();
  if (!preferred) return [...DEFAULT_GEMINI_MODELS];
  return [preferred, ...DEFAULT_GEMINI_MODELS.filter((model) => model !== preferred)];
}

function client() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error('[x/gemini] Falta GOOGLE_AI_API_KEY');
  return new GoogleGenerativeAI(apiKey);
}

/** Errores que vale la pena reintentar dentro del mismo proveedor. */
export function isRetryable(error: Error): boolean {
  const status = (error as { status?: number }).status;
  if (status === 429 || status === 503) return true;
  const message = error.message.toLowerCase();
  return ['503', '429', 'unavailable', 'overloaded', 'high demand'].some((s) => message.includes(s));
}

/** El modelo no existe o fue retirado: reintentarlo no sirve, hay que saltarlo. */
export function isModelUnavailable(error: Error): boolean {
  if ((error as { status?: number }).status === 404) return true;
  const message = error.message.toLowerCase();
  return ['404', 'not found', 'no longer available'].some((s) => message.includes(s));
}

/**
 * Errores de cuota del proveedor activo. Son los ÚNICOS que disparan el
 * failover: un 401 o un error de contenido no se resuelven cambiando de motor.
 */
export function isQuotaError(error: unknown): boolean {
  const err = error as { status?: number; message?: string };
  if (err?.status === 429) return true;
  const message = (err?.message ?? String(error)).toLowerCase();
  return ['quota', 'rate limit', 'resource exhausted', '429'].some((s) => message.includes(s));
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type ModelInput = Parameters<ReturnType<ReturnType<typeof client>['getGenerativeModel']>['generateContent']>[0];

/**
 * Recorre la cadena de modelos en cascada. Un 404, un 503 o un 429 pasan al
 * siguiente modelo sin esperar: la cuota es por modelo, así que el agotado se
 * saca de la cadena y el resto sigue. Solo si los que quedan están saturados
 * se espera el backoff y se da otra vuelta.
 *
 * Si la cadena se termina y alguno cayó por cuota, sube ese error: es la señal
 * para que el seam pase a Groq. Cualquier otro error sube tal cual, porque
 * cambiar de modelo no lo arregla.
 */
async function generateJson<T>(
  system: string,
  schema: Schema,
  temperature: number,
  content: ModelInput,
): Promise<{ data: T; tokens: number }> {
  const genAI = client();
  const models = geminiModels();
  const retired = new Set<string>();

  let lastError: Error | null = null;
  let quotaError: Error | null = null;
  for (let round = 0; round < MAX_ROUNDS && retired.size < models.length; round++) {
    if (BACKOFF_MS[round]) await sleep(BACKOFF_MS[round]);
    for (const name of models) {
      if (retired.has(name)) continue;
      const model = genAI.getGenerativeModel({
        model: name,
        systemInstruction: system,
        generationConfig: { responseMimeType: 'application/json', responseSchema: schema, temperature },
      });
      try {
        const result = await model.generateContent(content);
        const text = result.response.text();
        const tokens = result.response.usageMetadata?.totalTokenCount ?? 0;
        return { data: JSON.parse(jsonrepair(text)) as T, tokens };
      } catch (reason) {
        lastError = reason instanceof Error ? reason : new Error(String(reason));
        if (isQuotaError(reason)) {
          quotaError = lastError;
          retired.add(name);
          continue;
        }
        if (isModelUnavailable(lastError)) {
          retired.add(name);
          continue;
        }
        if (!isRetryable(lastError)) throw lastError;
      }
    }
  }
  throw quotaError ?? lastError ?? new Error('[x/gemini] Sin respuesta');
}

/** Una llamada a Gemini que devuelve JSON según el esquema declarado. */
export async function callGeminiJson<T>(
  system: string,
  input: string,
  schema: Schema,
): Promise<{ data: T; tokens: number }> {
  return generateJson<T>(system, schema, 0.9, input);
}

/**
 * Lo mismo, pero mirando un archivo.
 *
 * Gemini lee imágenes y PDF si van como `inlineData` en base64. Comparte la
 * cadena de modelos y el retry con la llamada de texto porque los errores del
 * proveedor son los mismos: duplicarlos terminaría con dos políticas distintas
 * para el mismo 503.
 *
 * La temperatura va en cero: de un comprobante no se quiere creatividad, se
 * quiere lo que dice.
 */
export async function callGeminiVision<T>(
  system: string,
  archivo: { datos: string; tipo: string },
  instruccion: string,
  schema: Schema,
): Promise<{ data: T; tokens: number }> {
  return generateJson<T>(system, schema, 0, [
    { inlineData: { data: archivo.datos, mimeType: archivo.tipo } },
    instruccion,
  ]);
}
