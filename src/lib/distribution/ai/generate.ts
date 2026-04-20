import { GoogleGenAI } from '@google/genai';
import { MASTER_PROMPT } from './prompt-master';
import { validateGeneratedContent } from './schema-validator';
import type { GeneratedContent, AIMetadata } from '../types';

// Con @google/genai v1.50 solo funcionan modelos gemini-2.5
const MODEL = 'gemini-2.5-flash';
const MAX_ATTEMPTS = 5;
// Backoffs progresivos — total máx ~75s, dentro del límite de Vercel Pro (300s)
const BACKOFF_MS = [0, 5000, 10000, 20000, 30000];

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
  return (
    msg.includes('503') ||
    msg.includes('unavailable') ||
    msg.includes('overloaded') ||
    msg.includes('high demand') ||
    msg.includes('429') ||
    msg.includes('quota')
  );
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

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (BACKOFF_MS[attempt - 1] > 0) {
      console.log(`[ai/generate] attempt ${attempt} — waiting ${BACKOFF_MS[attempt - 1]}ms`);
      await sleep(BACKOFF_MS[attempt - 1]);
    }

    try {
      console.log(`[ai/generate] model=${MODEL} attempt=${attempt}/${MAX_ATTEMPTS}`);

      const response = await client.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      totalTokens += response.usageMetadata?.totalTokenCount ?? 0;

      const raw = response.text;
      if (!raw) throw new Error('Gemini devolvió respuesta vacía');

      const cleaned = raw.trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '');

      const parsed = JSON.parse(cleaned);
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
      console.error(`[ai/generate] attempt ${attempt} failed:`, lastError.message);

      if (!isRetryable(lastError)) {
        throw lastError;
      }
    }
  }

  throw lastError ?? new Error('[ai/generate] Máximo de intentos alcanzado');
}
