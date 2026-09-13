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
    } catch {
      // Si el fallback también falla, el error original es el que importa
      // para el panel (gemini + fix), no el del espejo groq.
      throw reason;
    }
  }
}