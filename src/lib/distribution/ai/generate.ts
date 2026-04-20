import { GoogleGenAI, Type } from '@google/genai';
import { MASTER_PROMPT } from './prompt-master';
import { validateGeneratedContent } from './schema-validator';
import type { GeneratedContent, AIMetadata } from '../types';

const MODEL = 'gemini-2.5-flash';
const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [0, 1500, 4000];

// ── Schema declarado para Gemini JSON mode ────────────────────
// Garantiza que la respuesta sea JSON válido sin markdown wrapping.
// Si en el futuro se migra a Claude: eliminar este objeto y cambiar
// el cliente en getClient(). El prompt maestro y el resto no cambian.

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

// ─────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function getClient() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error('[ai/generate] Missing GOOGLE_AI_API_KEY');
  return new GoogleGenAI({ apiKey });
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

  let lastError: Error | null = null;
  let totalTokens = 0;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (BACKOFF_MS[attempt - 1] > 0) {
      await sleep(BACKOFF_MS[attempt - 1]);
    }

    try {
      const response = await client.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
        },
      });

      totalTokens += response.usageMetadata?.totalTokenCount ?? 0;

      const raw = response.text;
      if (!raw) throw new Error('Gemini devolvió respuesta vacía');

      const parsed = JSON.parse(raw);
      const content = validateGeneratedContent(parsed);

      return {
        content,
        metadata: {
          model: MODEL,
          tokens_used: totalTokens,
          generated_at: new Date().toISOString(),
          attempts: attempt,
        },
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const isFinal = attempt === MAX_ATTEMPTS;
      const tag = isFinal ? '[ai/generate] FATAL' : `[ai/generate] attempt ${attempt} failed`;
      console.error(`${tag}:`, lastError.message);
      if (!isFinal) continue;
    }
  }

  throw lastError ?? new Error('[ai/generate] Unknown error after retries');
}
