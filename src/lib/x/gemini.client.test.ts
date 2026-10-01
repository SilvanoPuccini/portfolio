import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SchemaType, type Schema } from '@google/generative-ai';

const generateContent = vi.fn();
const getGenerativeModel = vi.fn<(config: { model: string }) => { generateContent: typeof generateContent }>(
  () => ({ generateContent }),
);

vi.mock('@google/generative-ai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@google/generative-ai')>();
  return {
    ...actual,
    GoogleGenerativeAI: vi.fn(function () {
      return { getGenerativeModel };
    }),
  };
});

import { callGeminiJson, callGeminiVision, DEFAULT_GEMINI_MODELS, geminiModels } from './gemini.client';

const SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: { ok: { type: SchemaType.STRING } },
  required: ['ok'],
};

function ok(text = '{"ok":"OK"}') {
  return { response: { text: () => text, usageMetadata: { totalTokenCount: 7 } } };
}

function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

const triedModels = () => getGenerativeModel.mock.calls.map(([config]) => config.model);

describe('geminiModels', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('usa la cadena por defecto si no hay GEMINI_MODEL', () => {
    vi.stubEnv('GEMINI_MODEL', '');
    expect(geminiModels()).toEqual(DEFAULT_GEMINI_MODELS);
  });

  it('pone primero el modelo de GEMINI_MODEL y conserva el resto como respaldo', () => {
    vi.stubEnv('GEMINI_MODEL', 'gemini-3.6-flash');
    expect(geminiModels()).toEqual([
      'gemini-3.6-flash',
      ...DEFAULT_GEMINI_MODELS.filter((model) => model !== 'gemini-3.6-flash'),
    ]);
  });

  it('acepta un modelo fuera de la cadena y lo ignora si viene con espacios', () => {
    vi.stubEnv('GEMINI_MODEL', '  gemini-4-flash  ');
    expect(geminiModels()).toEqual(['gemini-4-flash', ...DEFAULT_GEMINI_MODELS]);
  });
});

describe('callGeminiJson', () => {
  beforeEach(() => {
    vi.stubEnv('GOOGLE_AI_API_KEY', 'test-key');
    vi.stubEnv('GEMINI_MODEL', '');
    generateContent.mockReset();
    getGenerativeModel.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it('responde con el primer modelo de la cadena cuando funciona', async () => {
    generateContent.mockResolvedValueOnce(ok());

    const result = await callGeminiJson<{ ok: string }>('system', 'input', SCHEMA);

    expect(result).toEqual({ data: { ok: 'OK' }, tokens: 7 });
    expect(triedModels()).toEqual([DEFAULT_GEMINI_MODELS[0]]);
  });

  it('pasa al siguiente modelo si el actual ya no existe (404)', async () => {
    generateContent
      .mockRejectedValueOnce(httpError(404, 'models/gemini-3.8-flash is no longer available'))
      .mockResolvedValueOnce(ok());

    const result = await callGeminiJson<{ ok: string }>('system', 'input', SCHEMA);

    expect(result.data).toEqual({ ok: 'OK' });
    expect(triedModels()).toEqual(DEFAULT_GEMINI_MODELS.slice(0, 2));
  });

  it('pasa al siguiente modelo sin esperar si el actual está saturado (503)', async () => {
    generateContent
      .mockRejectedValueOnce(httpError(503, 'This model is currently experiencing high demand'))
      .mockResolvedValueOnce(ok());

    const result = await callGeminiJson<{ ok: string }>('system', 'input', SCHEMA);

    expect(result.data).toEqual({ ok: 'OK' });
    expect(triedModels()).toEqual(DEFAULT_GEMINI_MODELS.slice(0, 2));
  });

  it('si toda la cadena está saturada, espera y vuelve a recorrerla', async () => {
    vi.useFakeTimers();
    const busy = httpError(503, 'high demand');
    DEFAULT_GEMINI_MODELS.forEach(() => generateContent.mockRejectedValueOnce(busy));
    generateContent.mockResolvedValueOnce(ok());

    const pending = callGeminiJson<{ ok: string }>('system', 'input', SCHEMA);
    await vi.runAllTimersAsync();

    await expect(pending).resolves.toEqual({ data: { ok: 'OK' }, tokens: 7 });
    expect(triedModels()).toEqual([...DEFAULT_GEMINI_MODELS, DEFAULT_GEMINI_MODELS[0]]);
  });

  it('no reintenta modelos que ya devolvieron 404 en la vuelta siguiente', async () => {
    vi.useFakeTimers();
    const [gone, ...rest] = DEFAULT_GEMINI_MODELS;
    generateContent.mockRejectedValueOnce(httpError(404, `models/${gone} not found`));
    rest.forEach(() => generateContent.mockRejectedValueOnce(httpError(503, 'high demand')));
    generateContent.mockResolvedValueOnce(ok());

    const pending = callGeminiJson<{ ok: string }>('system', 'input', SCHEMA);
    await vi.runAllTimersAsync();

    await expect(pending).resolves.toMatchObject({ data: { ok: 'OK' } });
    expect(triedModels()).toEqual([gone, ...rest, rest[0]]);
  });

  it('corta en seco con un error de cuota para que el seam lo desvíe a Groq', async () => {
    generateContent.mockRejectedValueOnce(httpError(429, 'Resource exhausted: quota'));

    await expect(callGeminiJson('system', 'input', SCHEMA)).rejects.toThrow(/quota/);
    expect(triedModels()).toEqual([DEFAULT_GEMINI_MODELS[0]]);
  });

  it('no enmascara un error que no se resuelve cambiando de modelo', async () => {
    generateContent.mockRejectedValueOnce(httpError(400, 'API key not valid'));

    await expect(callGeminiJson('system', 'input', SCHEMA)).rejects.toThrow(/API key not valid/);
    expect(triedModels()).toHaveLength(1);
  });

  it('si ningún modelo existe, falla con el último 404 sin esperar', async () => {
    for (const model of DEFAULT_GEMINI_MODELS) {
      generateContent.mockRejectedValueOnce(httpError(404, `models/${model} not found`));
    }

    await expect(callGeminiJson('system', 'input', SCHEMA)).rejects.toThrow(/not found/);
    expect(triedModels()).toEqual(DEFAULT_GEMINI_MODELS);
  });
});

describe('callGeminiVision', () => {
  beforeEach(() => {
    vi.stubEnv('GOOGLE_AI_API_KEY', 'test-key');
    vi.stubEnv('GEMINI_MODEL', '');
    generateContent.mockReset();
    getGenerativeModel.mockClear();
  });

  afterEach(() => vi.unstubAllEnvs());

  it('usa la misma cadena de respaldo y temperatura cero', async () => {
    generateContent
      .mockRejectedValueOnce(httpError(404, 'not found'))
      .mockResolvedValueOnce(ok('{"monto":"100"}'));

    const result = await callGeminiVision<{ monto: string }>(
      'system',
      { datos: 'base64', tipo: 'image/png' },
      'leé el monto',
      SCHEMA,
    );

    expect(result.data).toEqual({ monto: '100' });
    expect(triedModels()).toEqual(DEFAULT_GEMINI_MODELS.slice(0, 2));
    expect(getGenerativeModel.mock.calls[1][0]).toMatchObject({ generationConfig: { temperature: 0 } });
  });
});
