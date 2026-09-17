import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  callGeminiJson: vi.fn(),
  isQuotaError: vi.fn(),
  callGroqJson: vi.fn(),
}));

vi.mock('./gemini.client', () => ({
  callGeminiJson: mocks.callGeminiJson,
  isQuotaError: mocks.isQuotaError,
}));

vi.mock('./groq', () => ({
  callGroqJson: mocks.callGroqJson,
}));

import { afterEach, beforeEach } from 'vitest';
import { callJson, ProviderFailoverError } from './providers';

describe('callJson — failover Gemini→Groq', () => {
  beforeEach(() => {
    mocks.isQuotaError.mockReset();
    mocks.callGeminiJson.mockReset();
    mocks.callGroqJson.mockReset();
  });

  afterEach(() => {
    delete process.env.GROQ_API_KEY;
  });

  it('usa Groq cuando Gemini devuelve cuota agotada y Groq responde', async () => {
    process.env.GROQ_API_KEY = 'key-test';
    mocks.isQuotaError.mockReturnValue(true);
    mocks.callGeminiJson.mockRejectedValue(Object.assign(new Error('[x/gemini] 429'), { status: 429 }));
    mocks.callGroqJson.mockResolvedValue({ data: { ok: true }, tokens: 10 });

    const result = await callJson<{ ok: boolean }>('sys', 'input', {} as never);

    expect(result.provider).toBe('groq');
    expect(result.data).toEqual({ ok: true });
    expect(mocks.callGroqJson).toHaveBeenCalledTimes(1);
    expect(mocks.callGroqJson).toHaveBeenCalledWith(expect.objectContaining({ apiKey: 'key-test' }));
  });

  it('sin GROQ_API_KEY relanza el error de Gemini tal cual', async () => {
    mocks.isQuotaError.mockReturnValue(true);
    const geminiError = Object.assign(new Error('[x/gemini] 429'), { status: 429 });
    mocks.callGeminiJson.mockRejectedValue(geminiError);

    await expect(callJson('sys', 'input', {} as never)).rejects.toBe(geminiError);
    expect(mocks.callGroqJson).not.toHaveBeenCalled();
  });

  it('cuando Groq también falla, el panel ve la causa REAL de Groq, no el 429 de Gemini', async () => {
    process.env.GROQ_API_KEY = 'key-test';
    mocks.isQuotaError.mockReturnValue(true);
    mocks.callGeminiJson.mockRejectedValue(Object.assign(new Error('[x/gemini] 429'), { status: 429 }));

    const groqError = Object.assign(
      new Error('[x/groq] openai/gpt-oss-120b → 429: rate limit reached, retry in 33.3s'),
      { status: 429, retryAfterSeconds: 34 },
    );
    mocks.callGroqJson.mockRejectedValue(groqError);

    const thrown = await callJson('sys', 'input', {} as never).catch((e) => e);

    expect(thrown).toBeInstanceOf(ProviderFailoverError);
    expect(thrown.message).not.toContain('[x/gemini] 429');
    expect(thrown.message).toContain('fallback a Groq también falló');
    expect(thrown.message).toContain('Esperá 34s y reintentá');
    expect((thrown as ProviderFailoverError).retryAfterSeconds).toBe(34);
    expect((thrown as ProviderFailoverError).groqStatus).toBe(429);
  });

  it('errores de Groq que no son de cuota se reportan con su status, sin retry inventado', async () => {
    process.env.GROQ_API_KEY = 'key-test';
    mocks.isQuotaError.mockReturnValue(true);
    mocks.callGeminiJson.mockRejectedValue(Object.assign(new Error('[x/gemini] 429'), { status: 429 }));
    mocks.callGroqJson.mockRejectedValue(Object.assign(new Error('[x/groq] 500: boom'), { status: 500 }));

    const thrown = await callJson('sys', 'input', {} as never).catch((e) => e);

    expect(thrown).toBeInstanceOf(ProviderFailoverError);
    expect(thrown.message).toContain('[x/groq] 500: boom');
    expect((thrown as ProviderFailoverError).groqStatus).toBe(500);
    expect((thrown as ProviderFailoverError).retryAfterSeconds).toBeUndefined();
  });
});