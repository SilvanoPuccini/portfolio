import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { isAuthorized } from '@/lib/admin-auth';

const MODELS_TO_TEST = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
];

/** El modelo exacto que usa el failover de cuota de src/lib/x/providers.ts. */
const GROQ_MODEL = 'gpt-oss-120b';

async function testModel(apiKey: string, model: string): Promise<string> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Reply with one word: OK' }] }],
        }),
      }
    );

    const data = await res.json() as {
      candidates?: { content: { parts: { text: string }[] } }[];
      error?: { code: number; message: string; status: string };
    };

    if (data.error) {
      const { code, status } = data.error;
      if (code === 503 || status === 'UNAVAILABLE') return '⚠️ 503 overloaded (existe)';
      if (code === 429) return '⚠️ 429 quota exceeded (existe)';
      if (code === 404) return '❌ 404 not found';
      return `❌ ${code} ${status}`;
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '?';
    return `✅ OK — "${text.trim()}"`;
  } catch (err) {
    return `❌ fetch error: ${err instanceof Error ? err.message : String(err)}`;
  }
}

/** El espejo de Groq: mismo test, formato OpenAI. Mide la key del failover. */
async function testGroq(apiKey: string): Promise<string> {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: 'Reply with one word: OK' }],
      }),
    });

    const data = await res.json() as {
      choices?: { message?: { content?: string } }[];
      error?: { message?: string };
    };

    if (data.error) {
      const message = data.error.message ?? 'error desconocido';
      if (/quota|rate limit|429/i.test(message)) return `⚠️ 429 quota exceeded (existe)`;
      return `❌ ${res.status} ${message.slice(0, 120)}`;
    }

    const text = data.choices?.[0]?.message?.content ?? '?';
    return `✅ OK — "${text.trim()}"`;
  } catch (err) {
    return `❌ fetch error: ${err instanceof Error ? err.message : String(err)}`;
  }
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GOOGLE_AI_API_KEY no configurada en Vercel' });
  }

  const results: Record<string, string> = {};
  for (const model of MODELS_TO_TEST) {
    results[model] = await testModel(apiKey, model);
  }

  const groqApiKey = process.env.GROQ_API_KEY;
  results[`groq:${GROQ_MODEL}`] = groqApiKey
    ? await testGroq(groqApiKey)
    : '⚠️ GROQ_API_KEY no configurada (failover por cuota apagado)';

  return NextResponse.json({ results });
}
