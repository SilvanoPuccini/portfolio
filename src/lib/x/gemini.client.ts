import { GoogleGenerativeAI, type Schema } from '@google/generative-ai';
import { jsonrepair } from 'jsonrepair';

/**
 * Cliente Gemini de bajo nivel: una llamada al modelo con retry interno y
 * un contrato de JSON por esquema declarado. No decide estrategias: eso vive
 * en providers.ts.
 */

const MODEL = 'gemini-2.5-flash';
const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [0, 8_000, 20_000];

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

/**
 * Una llamada a Gemini, con retry interno para los errores que se recuperan
 * solos (503, cola de demanda). Los de cuota se cortan en seco para que el
 * seam los desvíe a Groq sin esperar el backoff.
 */
export async function callGeminiJson<T>(
  system: string,
  input: string,
  schema: Schema,
): Promise<{ data: T; tokens: number }> {
  const model = client().getGenerativeModel({
    model: MODEL,
    systemInstruction: system,
    generationConfig: { responseMimeType: 'application/json', responseSchema: schema, temperature: 0.9 },
  });

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (BACKOFF_MS[attempt]) await sleep(BACKOFF_MS[attempt]);
    try {
      const result = await model.generateContent(input);
      const text = result.response.text();
      const tokens = result.response.usageMetadata?.totalTokenCount ?? 0;
      return { data: JSON.parse(jsonrepair(text)) as T, tokens };
    } catch (reason) {
      lastError = reason instanceof Error ? reason : new Error(String(reason));
      if (isQuotaError(reason)) throw lastError;
      if (!isRetryable(lastError)) throw lastError;
    }
  }
  throw lastError ?? new Error('[x/gemini] Sin respuesta');
}