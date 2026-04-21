import { GoogleGenerativeAI } from '@google/generative-ai';
import { MASTER_PROMPT } from './prompt-master';
import { validateGeneratedContent } from './schema-validator';
import type { GeneratedContent, AIMetadata } from '../types';

// Modelos disponibles confirmados por debug (2025-04)
// 2.5-flash: funciona, puede tener 503 en picos de demanda
// 2.0-flash y 2.0-flash-lite: existen, quota diaria free tier
const MODEL_CONFIGS = [
  { model: 'gemini-2.5-flash' },
  { model: 'gemini-2.0-flash' },
  { model: 'gemini-2.0-flash-lite' },
];
const MAX_ATTEMPTS_PER_MODEL = 2;
const BACKOFF_MS = [0, 8000, 20000];

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function getClient() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error('[ai/generate] Missing GOOGLE_AI_API_KEY');
  return new GoogleGenerativeAI(apiKey);
}

function isRetryable(err: Error): boolean {
  const msg = err.message.toLowerCase();
  return (
    msg.includes('503') ||
    msg.includes('unavailable') ||
    msg.includes('overloaded') ||
    msg.includes('high demand') ||
    msg.includes('429')
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
  let globalAttempt = 0;

  for (const { model } of MODEL_CONFIGS) {
    const genModel = client.getGenerativeModel({
      model,
      generationConfig: { responseMimeType: 'application/json' },
    });

    for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_MODEL; attempt++) {
      const backoff = BACKOFF_MS[attempt - 1] ?? 0;
      if (backoff > 0) {
        console.log(`[ai/generate] model=${model} waiting ${backoff}ms before attempt ${attempt}`);
        await sleep(backoff);
      }
      globalAttempt++;

      try {
        console.log(`[ai/generate] model=${model} attempt=${attempt}/${MAX_ATTEMPTS_PER_MODEL}`);

        const result = await genModel.generateContent(prompt);
        const raw = result.response.text();
        if (!raw) throw new Error('Gemini devolvió respuesta vacía');

        totalTokens += result.response.usageMetadata?.totalTokenCount ?? 0;

        const cleaned = raw.trim()
          .replace(/^```(?:json)?\s*/i, '')
          .replace(/\s*```$/i, '');

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

        if (!isRetryable(lastError)) break;
      }
    }
  }

  throw lastError ?? new Error('[ai/generate] Todos los modelos fallaron');
}
