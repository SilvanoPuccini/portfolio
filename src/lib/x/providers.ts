import type { Schema } from '@google/generative-ai';
import { callGroqJson } from './groq';
import { callGeminiJson, isQuotaError } from './gemini.client';
import type { XProvider } from './types';

/**
 * El seam de proveedores del circuito de X.
 *
 * Toda generación del sistema (planificar, escribir, criticar) pasa por acá.
 * Cambiar de modelo, de proveedor o sumar un fallback toca un solo archivo:
 * los llamadores solo ven `{ data, tokens, provider }`.
 *
 * La regla del fallback es deliberadamente angosta: SOLO un error de cuota
 * mueve la llamada a Groq. Un error de contenido o de autenticación hay que
 * verlo, no enmascararlo con otro motor. Y sin GROQ_API_KEY el failover queda
 * apagado con el comportamiento de siempre: el error de Gemini sube tal cual.
 */

export interface JsonCallResult<T> {
  data: T;
  tokens: number;
  provider: XProvider;
}

/**
 * Error del fallback cuando los dos proveedores fallan. Lleva la causa REAL
 * de Groq (no el 429 de Gemini enmascarado) y, si Groq la informó, cuánto
 * esperar antes de reintentar. El panel lo muestra como está: sin esto, el
 * 500 decía "Gemini agotado" aunque el problema era el límite de Groq.
 */
export class ProviderFailoverError extends Error {
  readonly geminiReason: unknown;
  readonly groqStatus?: number;
  readonly retryAfterSeconds?: number;

  constructor(params: {
    geminiReason: unknown;
    groqMessage: string;
    groqStatus?: number;
    retryAfterSeconds?: number;
  }) {
    const retryHint = params.retryAfterSeconds
      ? ` Esperá ${params.retryAfterSeconds}s y reintentá.`
      : '';
    super(
      `[x/providers] Gemini agotado (cuota) y el fallback a Groq también falló: ${params.groqMessage}.${retryHint}`,
    );
    this.name = 'ProviderFailoverError';
    this.geminiReason = params.geminiReason;
    this.groqStatus = params.groqStatus;
    this.retryAfterSeconds = params.retryAfterSeconds;
  }
}

/** Normaliza el detalle de un error de Groq para el mensaje del panel. */
function groqDetail(error: unknown): { message: string; status?: number; retryAfterSeconds?: number } {
  if (error instanceof Error) {
    const status = (error as Error & { status?: number }).status;
    const retryAfterSeconds = (error as Error & { retryAfterSeconds?: number }).retryAfterSeconds;
    return { message: error.message, status, retryAfterSeconds };
  }
  return { message: String(error) };
}

export async function callJson<T>(
  system: string,
  input: string,
  schema: Schema,
): Promise<JsonCallResult<T>> {
  try {
    const result = await callGeminiJson<T>(system, input, schema);
    return { ...result, provider: 'gemini' as const };
  } catch (reason) {
    if (!isQuotaError(reason)) throw reason;
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      // Fallback deshabilitado por configuración: el error de cuota sube
      // igual que antes de existir Groq. Sin crash, sin capas de truco.
      throw reason;
    }
    try {
      const result = await callGroqJson<T>({ system, input, schema, apiKey: groqApiKey });
      console.warn('[x/providers] Cuota de Gemini agotada, la llamada salió por Groq.');
      return { ...result, provider: 'groq' as const };
    } catch (groqError) {
      // Antes esto relanzaba el error ORIGINAL de Gemini: enmascaraba la
      // causa real (límite de Groq) y hacía creer que el failover no entraba.
      // Ahora el panel ve la verdad: cuál de los dos proveedores falló y
      // cuánto esperar antes de reintentar.
      const detail = groqDetail(groqError);
      console.warn('[x/providers] El fallback a Groq falló:', detail.message);
      throw new ProviderFailoverError({
        geminiReason: reason,
        groqMessage: detail.message,
        groqStatus: detail.status,
        retryAfterSeconds: detail.retryAfterSeconds,
      });
    }
  }
}