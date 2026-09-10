import { GoogleGenerativeAI, SchemaType, type Schema } from '@google/generative-ai';
import { jsonrepair } from 'jsonrepair';
import { criticSystemPrompt, writerInput, writerSystemPrompt } from './prompt';
import { ANGLES_PER_WEEK } from './scheduling';
import type { XAngle, XEvidence } from './types';

/**
 * Las tres llamadas a Gemini: planificar la semana, escribir un hilo y
 * criticarlo.
 *
 * El esquema va declarado, no pedido por texto. Pedir "devolvé solo JSON" en el
 * prompt no es un contrato: el modelo lo cumple casi siempre, y ese casi es
 * justo lo que rompe un circuito que corre sin nadie mirando.
 */

const MODEL = 'gemini-2.5-flash';
const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [0, 8_000, 20_000];

function client() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error('[x/gemini] Falta GOOGLE_AI_API_KEY');
  return new GoogleGenerativeAI(apiKey);
}

function isRetryable(error: Error): boolean {
  const status = (error as { status?: number }).status;
  if (status === 429 || status === 503) return true;
  const message = error.message.toLowerCase();
  return ['503', '429', 'unavailable', 'overloaded', 'high demand'].some((s) => message.includes(s));
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Llama al modelo con un esquema declarado y devuelve el objeto ya parseado.
 * jsonrepair cubre el caso de una coma colgada; el esquema cubre el resto.
 */
async function callJson<T>(system: string, input: string, schema: Schema): Promise<{ data: T; tokens: number }> {
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
      if (!isRetryable(lastError)) throw lastError;
    }
  }
  throw lastError ?? new Error('[x/gemini] Sin respuesta');
}

// ── 1. El guion de la semana ────────────────────────────────────────

const ANGLES_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    angles: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING },
          summary: { type: SchemaType.STRING },
          question: { type: SchemaType.STRING },
        },
        required: ['id', 'summary', 'question'],
      },
    },
  },
  required: ['angles'],
};

/**
 * Saca hasta cuatro ángulos distintos del artículo, uno por día de publicación.
 *
 * El guion se arma primero y el texto después, día por día. Si se generaran los
 * cuatro textos de una, se escribirían antes de ver cómo cayó el primero. Y si
 * cada día se generara sin plan, los cuatro terminarían diciendo lo mismo con
 * otras palabras, que es exactamente lo que X sanciona como contenido
 * sustancialmente similar.
 */
export async function planWeek(articleTitle: string, articleText: string) {
  const system = `
Sos el planificador editorial de El Radar para X. Leés un artículo y proponés
hasta ${ANGLES_PER_WEEK} ángulos GENUINAMENTE distintos para publicar durante la semana.

Distintos significa que cambian la tesis y el ejemplo, no las palabras. Dos
ángulos que se responden con la misma frase son el mismo ángulo.

Si el artículo no da para ${ANGLES_PER_WEEK} ángulos distintos, devolvé menos. Nunca rellenes:
publicar cuatro variantes de lo mismo puede costar la cuenta.

Cada ángulo: id corto en kebab-case, summary de una oración con la idea
central, y question con la pregunta concreta que ese ángulo responde.
`.trim();

  const input = JSON.stringify({ title: articleTitle, text: articleText }, null, 2);
  const { data, tokens } = await callJson<{ angles: XAngle[] }>(system, input, ANGLES_SCHEMA);
  return { angles: data.angles.slice(0, ANGLES_PER_WEEK), tokens };
}

// ── 2. El escritor ──────────────────────────────────────────────────

const DRAFT_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    status: { type: SchemaType.STRING, enum: ['draft', 'blocked'], format: 'enum' },
    thesis: { type: SchemaType.STRING },
    tweets: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    reply_with_link: { type: SchemaType.STRING },
    evidence: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          target: { type: SchemaType.STRING },
          claim: { type: SchemaType.STRING },
          source_id: { type: SchemaType.STRING },
          excerpt: { type: SchemaType.STRING },
          type: { type: SchemaType.STRING, enum: ['personal', 'technical', 'inference', 'hypothetical'], format: 'enum' },
        },
        required: ['target', 'claim', 'source_id', 'excerpt', 'type'],
      },
    },
    block_reasons: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
  },
  required: ['status', 'thesis', 'tweets', 'reply_with_link', 'evidence', 'block_reasons'],
};

export interface XDraft {
  status: 'draft' | 'blocked';
  thesis: string;
  tweets: string[];
  reply_with_link: string;
  evidence: XEvidence[];
  block_reasons: string[];
}

export interface WriteParams {
  articleTitle: string;
  articleUrl: string;
  articleText: string;
  angles: XAngle[];
  selectedAngleId: string;
  publishedThisWeek: string[];
  allowedUrls: string[];
  /** Problemas de la vuelta anterior, si esto es una reescritura. */
  fixes?: string[];
}

export async function writeThread(params: WriteParams) {
  const base = writerInput(params);
  const input = params.fixes?.length
    ? `${base}\n\nCORREGÍ ESTOS PROBLEMAS DE LA VERSIÓN ANTERIOR:\n${params.fixes.map((f) => `- ${f}`).join('\n')}`
    : base;
  return callJson<XDraft>(writerSystemPrompt(), input, DRAFT_SCHEMA);
}

// ── 3. El crítico ───────────────────────────────────────────────────

const CRITIC_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    verdict: { type: SchemaType.STRING, enum: ['approved', 'rewrite', 'blocked'], format: 'enum' },
    issues: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          code: { type: SchemaType.STRING },
          target: { type: SchemaType.STRING },
          problem: { type: SchemaType.STRING },
          suggested_change: { type: SchemaType.STRING },
        },
        required: ['code', 'target', 'problem', 'suggested_change'],
      },
    },
    summary: { type: SchemaType.STRING },
  },
  required: ['verdict', 'issues', 'summary'],
};

export interface XCritique {
  verdict: 'approved' | 'rewrite' | 'blocked';
  issues: { code: string; target: string; problem: string; suggested_change: string }[];
  summary: string;
}

export async function critique(params: {
  draft: XDraft;
  articleTitle: string;
  articleText: string;
  angles: XAngle[];
  selectedAngleId: string;
  publishedThisWeek: string[];
  /** Resultado del validador por código. El crítico no lo recalcula. */
  validationReport: { code: string; target: string; problem: string }[];
}) {
  const input = JSON.stringify({
    article: { title: params.articleTitle, text: params.articleText },
    weekly_plan: params.angles,
    selected_angle_id: params.selectedAngleId,
    already_published_this_week: params.publishedThisWeek,
    draft: params.draft,
    validation_report: params.validationReport,
  }, null, 2);
  return callJson<XCritique>(criticSystemPrompt(), input, CRITIC_SCHEMA);
}
