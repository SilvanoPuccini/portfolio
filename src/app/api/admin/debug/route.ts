import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isAuthorized(req: NextRequest) {
  return req.headers.get('authorization') === `Bearer ${process.env.NOTIFY_SECRET}`;
}

const MODELS_TO_TEST = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
];

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'No GOOGLE_AI_API_KEY' });

  const client = new GoogleGenerativeAI(apiKey);
  const results: Record<string, string> = {};

  for (const modelName of MODELS_TO_TEST) {
    try {
      const model = client.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Respond with the single word: OK');
      const text = result.response.text().trim();
      results[modelName] = `✅ ${text}`;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('503') || msg.includes('UNAVAILABLE')) {
        results[modelName] = '⚠️ 503 overloaded (exists)';
      } else if (msg.includes('429') || msg.includes('quota')) {
        results[modelName] = '⚠️ 429 quota exceeded (exists)';
      } else if (msg.includes('404') || msg.includes('NOT_FOUND')) {
        results[modelName] = '❌ 404 not found';
      } else {
        results[modelName] = `❌ ${msg.substring(0, 80)}`;
      }
    }
  }

  return NextResponse.json({ results });
}
