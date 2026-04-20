import { GoogleGenAI, Type } from '@google/genai';
import { MASTER_PROMPT } from './prompt-master';
import { validateGeneratedContent } from './schema-validator';
import type { GeneratedContent, AIMetadata } from '../types';

// gemini-2.0-flash: soporta responseSchema, free tier estable
// gemini-1.5-flash: NO soporta responseSchema en v1beta — solo responseMimeType
const MODEL_CONFIGS = [
  { model: 'gemini-2.0-flash',   useSchema: true  },
  { model: 'gemini-1.5-flash',   useSchema: false },
];
const MAX_ATTEMPTS_PER_MODEL = 2;
const BACKOFF_MS = [0, 3000, 8000, 15000];

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    linkedin: {
      type: Type.OBJECT,
      properties: {
        slides: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              headline: { type: Type.STRING },
              body: { type: Type.STRING },
            },
            required: ['type', 'headline', 'body'],
          },
        },
        caption: { type: Type.STRING },
        hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['slides', 'caption', 'hashtags'],
    },
    instagram: {
      type: Type.OBJECT,
      properties: {
        slides: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              headline: { type: Type.STRING },
              body: { type: Type.STRING },
            },
            required: ['type', 'headline', 'body'],
          },
        },
        caption: { type: Type.STRING },
        hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['slides', 'caption', 'hashtags'],
    },
    twitter: {
      type: Type.OBJECT,
      properties: {
        tweets: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['tweets'],
    },
  },
  required: ['linkedin', 'instagram', 'twitter'],
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function getClient() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error('[ai/generate] Missing GOOGLE_AI_API_KEY');
  return new GoogleGenAI({ apiKey });
}

function isRetryable(err: Error): boolean {
  const msg = err.message.toLowerCase();
  return msg.includes('503') || msg.includes('unavailable') ||
    msg.includes('overloaded') || msg.includes('high demand');
}

export interface GenerateResult {
  content: GeneratedContent;
  metadata: AIMetadata;
}

export async function generateDistribution(
  mdxContent: string,
  postUrl: string
): Promise<GenerateResult> {
  const client = getClient();
  const prompt = MASTER_PROMPT
    .replace('{{MDX_CONTENT}}', mdxContent)
    .replace('PLACEHOLDER_URL', postUrl);

  let totalTokens = 0;
  let lastError: Error | null = null;
  let globalAttempt = 0;

  for (const { model, useSchema } of MODEL_CONFIGS) {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_MODEL; attempt++) {
      const backoff = BACKOFF_MS[globalAttempt] ?? BACKOFF_MS[BACKOFF_MS.length - 1];
      if (backoff > 0) await sleep(backoff);
      globalAttempt++;

      try {
        console.log(`[ai/generate] model=${model} useSchema=${useSchema} attempt=${attempt}`);

        const response = await client.models.generateContent({
          model,
          contents: prompt,
          config: useSchema
            ? { responseMimeType: 'application/json', responseSchema: RESPONSE_SCHEMA }
            : { responseMimeType: 'application/json' },
        });

        totalTokens += response.usageMetadata?.totalTokenCount ?? 0;

        const raw = response.text;
        if (!raw) throw new Error('Gemini devolvió respuesta vacía');

        // Para modelos sin schema, limpiar posible markdown wrapping
        const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
        const parsed = JSON.parse(cleaned);
        const content = validateGeneratedContent(parsed);

        return {
          content,
          metadata: {
            model,
            tokens_used: totalTokens,
            generated_at: new Date().toISOString(),
            attempts: globalAttempt,
          },
        };
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.error(`[ai/generate] model=${model} attempt=${attempt} failed:`, lastError.message);

        // 404 = modelo no soporta esta feature → pasar al siguiente sin reintentar
        if (lastError.message.includes('404') || lastError.message.includes('NOT_FOUND')) break;
        // Errores no retryables (schema inválido, JSON malformado) → siguiente modelo
        if (!isRetryable(lastError)) break;
      }
    }
  }

  throw lastError ?? new Error('[ai/generate] Todos los modelos fallaron');
}
