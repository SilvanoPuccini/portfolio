import { SchemaType, type Schema } from '@google/generative-ai';
import { jsonrepair } from 'jsonrepair';

/**
 * Cliente Groq (API compatible OpenAI) para el circuito de X.
 *
 * Es el fallback de cuota: cuando Gemini devuelve 429 / quota-exceeded, la
 * misma llamada se reejecuta acá (gpt-oss-120b). El esquema se traduce de
 * Gemini JSON Schema a JSON Schema plano porque Groq no conoce SchemaType.
 */

const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'gpt-oss-120b';

/** Traduce el Schema de Gemini (SchemaType, PascalCase) a JSON Schema plano. */
export function toJsonSchema(schema: Schema): Record<string, unknown> {
  if (schema.type === SchemaType.ARRAY) {
    return { type: 'array', items: toJsonSchema(schema.items) };
  }
  if (schema.type === SchemaType.OBJECT) {
    const properties: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(schema.properties ?? {})) {
      properties[key] = toJsonSchema(value);
    }
    return {
      type: 'object',
      properties,
      required: schema.required ?? [],
      additionalProperties: false,
    };
  }
  const possibleEnum = enumOf(schema);
  return {
    type: (schema.type ?? 'string').toLowerCase(),
    ...(possibleEnum ? { enum: possibleEnum } : {}),
  };
}

function enumOf(schema: Schema): unknown[] | undefined {
  // SchemaType no tipa enum en las primitivas aunque Google lo soporte; el
  // acceso de "propiedades que no existen" es la manera barata y segura de
  // dejar pasar el enum sin pelear con el tipo.
  const value = schema as Schema & { enum?: unknown[] };
  return value.enum;
}

export async function callGroqJson<T>(params: {
  system: string;
  input: string;
  schema: Schema;
  apiKey: string;
}): Promise<{ data: T; tokens: number }> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.9,
      messages: [
        { role: 'system', content: params.system },
        { role: 'user', content: params.input },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'result',
          schema: toJsonSchema(params.schema),
          strict: false,
        },
      },
    }),
  });

  const raw = await response.text();
  if (!response.ok) {
    throw Object.assign(
      new Error(`[x/groq] ${MODEL} → ${response.status}: ${raw.slice(0, 300)}`),
      { status: response.status, detail: raw.slice(0, 400) },
    );
  }

  const json = JSON.parse(raw) as { choices?: { message?: { content?: string } }[]; usage?: { total_tokens?: number } };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error('[x/groq] Respuesta vacía');
  return {
    data: JSON.parse(jsonrepair(content)) as T,
    tokens: json.usage?.total_tokens ?? 0,
  };
}