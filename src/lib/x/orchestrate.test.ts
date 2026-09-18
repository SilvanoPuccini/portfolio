import { beforeEach, describe, expect, it, vi } from 'vitest';
import { orchestrateThread, REPETITION_BLOCK_REASON, MAX_ATTEMPTS } from './orchestrate';

const gemini = vi.hoisted(() => ({
  writeThread: vi.fn(),
  critique: vi.fn(),
}));

vi.mock('./gemini', () => gemini);
vi.mock('./validate', () => ({
  validateThread: () => [],
  weightedLength: () => ({ length: 0, valid: true }),
}));

import type { XAngle } from './types';

const ANGLES: XAngle[] = [
  { id: 'costo-coordinacion', summary: 'El costo de la libertad con Vite en equipos', question: '¿Qué cobra la libertad?', anchor: 'fragmento del artículo' },
  { id: 'un-solo-lugar', summary: 'Cuando algo se rompe hay un solo lugar', question: '¿Dónde se complica el diagnóstico?', anchor: 'fragmento del artículo' },
];

const params = {
  articleTitle: 'Next.js vs Vite en 2026',
  articleUrl: 'https://www.silvanopuccini.dev/es/blog/nextjs-vite-o-angular',
  articleText: 'El artículo completo.',
  angles: ANGLES,
  selectedAngleId: 'costo-coordinacion',
  publishedThisWeek: ['Msj previo publicado esta semana'],
  allowedUrls: ['https://www.silvanopuccini.dev/es/'],
};

/** Un borrador válido sobre el ángulo indicado. */
function draft(overrides: Record<string, unknown> = {}) {
  return {
    status: 'draft' as const,
    thesis: 'La tesis del ángulo',
    tweets: [
      'El costo de la libertad.\n\nPrimera idea del hilo.',
      'Segundo post del hilo con un ejemplo.',
      'Tercer post: la consecuencia concreta.',
      'Cuarta idea y la pregunta final.',
    ],
    reply_with_link: 'Lo escribí completo acá: https://www.silvanopuccini.dev/es/blog/nextjs-vite-o-angular',
    evidence: [],
    block_reasons: [],
    ...overrides,
  };
}

describe('orchestrateThread', () => {
  beforeEach(() => {
    gemini.writeThread.mockReset();
    gemini.critique.mockReset();
  });

  it('corta apenas el crítico marca REPETITION, sin quemar intentos de reescritura', async () => {
    gemini.writeThread.mockResolvedValue({ data: draft(), tokens: 1, provider: 'gemini' });
    gemini.critique.mockResolvedValue({
      data: {
        verdict: 'rewrite',
        summary: 'El ángulo repite un hilo ya publicado.',
        issues: [{
          code: 'REPETITION',
          target: 'thread',
          problem: 'El contenido repite el ángulo costo-coordinacion ya publicado.',
          suggested_change: 'Usar otro ángulo del plan.',
        }],
      },
      tokens: 1,
      provider: 'gemini',
    });

    const result = await orchestrateThread(params);

    expect(result.outcome).toBe('blocked');
    if (result.outcome === 'blocked') {
      expect(result.reasons[0]).toBe(REPETITION_BLOCK_REASON);
    }
    expect(gemini.writeThread).toHaveBeenCalledTimes(1);
  });

  it('no corta por REPETITION cuando el crítico aprueba pese a todo', async () => {
    gemini.writeThread.mockResolvedValue({ data: draft(), tokens: 1, provider: 'gemini' });
    gemini.critique.mockResolvedValue({
      data: { verdict: 'approved', summary: 'Listo.', issues: [] },
      tokens: 1,
      provider: 'gemini',
    });

    const result = await orchestrateThread(params);

    expect(result.outcome).toBe('approved');
  });

  it('sigue reescribiendo sin REPETITION hasta agotar los intentos', async () => {
    gemini.writeThread.mockResolvedValue({ data: draft(), tokens: 1, provider: 'gemini' });
    gemini.critique.mockResolvedValue({
      data: {
        verdict: 'rewrite',
        summary: 'Falta sostener el dato.',
        issues: [{
          code: 'SOURCE_CONFLICT',
          target: 'tweet_2',
          problem: 'La afirmación no se sostiene con la fuente.',
          suggested_change: 'Reformular contra el artículo.',
        }],
      },
      tokens: 1,
      provider: 'gemini',
    });

    const result = await orchestrateThread(params);

    expect(result.outcome).toBe('blocked');
    expect(gemini.writeThread).toHaveBeenCalledTimes(MAX_ATTEMPTS);
  });

  describe('límite de cuota', () => {
    /** El 429 tal como lo arma ProviderFailoverError. */
    function quotaError(retryAfterSeconds?: number) {
      const error = new Error('Sin cuota');
      error.name = 'ProviderFailoverError';
      return Object.assign(error, { retryAfterSeconds });
    }

    it('espera lo que pide el proveedor y reintenta una sola vez', async () => {
      vi.useFakeTimers();
      gemini.writeThread
        .mockRejectedValueOnce(quotaError(2))
        .mockResolvedValue({ data: draft(), tokens: 1, provider: 'groq' });
      gemini.critique.mockResolvedValue({
        data: { verdict: 'approved', summary: 'Listo.', issues: [] },
        tokens: 1, provider: 'groq',
      });

      const running = orchestrateThread(params);
      await vi.advanceTimersByTimeAsync(3000);
      const result = await running;
      vi.useRealTimers();

      expect(result.outcome).toBe('approved');
      expect(gemini.writeThread).toHaveBeenCalledTimes(2);
    });

    it('no insiste contra una cuota que sigue agotada', async () => {
      vi.useFakeTimers();
      gemini.writeThread.mockRejectedValue(quotaError(2));

      const running = orchestrateThread(params).catch((error: Error) => error);
      await vi.advanceTimersByTimeAsync(3000);
      const error = await running;
      vi.useRealTimers();

      expect(error).toBeInstanceOf(Error);
      // Un reintento, no una ráfaga: insistir es lo que quemaba la API.
      expect(gemini.writeThread).toHaveBeenCalledTimes(2);
    });

    it('deja subir una espera demasiado larga en vez de dormir el request', async () => {
      gemini.writeThread.mockRejectedValue(quotaError(600));

      await expect(orchestrateThread(params)).rejects.toThrow('Sin cuota');
      expect(gemini.writeThread).toHaveBeenCalledTimes(1);
    });

    it('no trata como cuota un error cualquiera del proveedor', async () => {
      gemini.writeThread.mockRejectedValue(new Error('500 del servidor'));

      await expect(orchestrateThread(params)).rejects.toThrow('500 del servidor');
      expect(gemini.writeThread).toHaveBeenCalledTimes(1);
    });
  });

  describe('memoria entre corridas', () => {
    /** Lo que el escritor recibió en su primera llamada de la corrida. */
    const firstWriterFixes = (): string[] => gemini.writeThread.mock.calls[0][0].fixes ?? [];

    it('le devuelve al escritor el motivo del bloqueo de la corrida anterior', async () => {
      gemini.writeThread.mockResolvedValue({ data: draft(), tokens: 1, provider: 'gemini' });
      gemini.critique.mockResolvedValue({
        data: { verdict: 'approved', summary: 'Listo.', issues: [] },
        tokens: 1, provider: 'gemini',
      });

      await orchestrateThread({
        ...params,
        history: [{
          at: '2026-09-17T12:00:00.000Z',
          attempt: 1,
          provider: 'gemini',
          // Una vuelta bloqueada se persiste con los fixes VIEJOS (vacíos acá)
          // y el motivo real en `reasons`. Es el caso que antes se perdía.
          fixes: [],
          verdict: 'blocked',
          reasons: ['El gancho promete un dato que el hilo no entrega.'],
        }],
      });

      expect(firstWriterFixes()).toContain('El gancho promete un dato que el hilo no entrega.');
    });

    it('sigue pasando los fixes de una vuelta de reescritura', async () => {
      gemini.writeThread.mockResolvedValue({ data: draft(), tokens: 1, provider: 'gemini' });
      gemini.critique.mockResolvedValue({
        data: { verdict: 'approved', summary: 'Listo.', issues: [] },
        tokens: 1, provider: 'gemini',
      });

      await orchestrateThread({
        ...params,
        history: [{
          at: '2026-09-17T12:00:00.000Z',
          attempt: 1,
          provider: 'gemini',
          fixes: ['tweet_2: la afirmación no se sostiene. Corrección: citar el artículo.'],
          verdict: 'rewrite',
          reasons: ['ruido que no hace falta repetir'],
        }],
      });

      const fixes = firstWriterFixes();
      expect(fixes).toContain('tweet_2: la afirmación no se sostiene. Corrección: citar el artículo.');
      // Las razones de una vuelta de reescritura ya están representadas en sus
      // fixes: sumarlas otra vez solo engorda el prompt.
      expect(fixes).not.toContain('ruido que no hace falta repetir');
    });

    it('no repite un mismo motivo que aparece en varias vueltas', async () => {
      gemini.writeThread.mockResolvedValue({ data: draft(), tokens: 1, provider: 'gemini' });
      gemini.critique.mockResolvedValue({
        data: { verdict: 'approved', summary: 'Listo.', issues: [] },
        tokens: 1, provider: 'gemini',
      });

      const entry = (attempt: number) => ({
        at: '2026-09-17T12:00:00.000Z',
        attempt,
        provider: 'gemini' as const,
        fixes: [],
        verdict: 'blocked' as const,
        reasons: ['El mismo motivo de siempre.'],
      });

      await orchestrateThread({ ...params, history: [entry(1), entry(2)] });

      const repeated = firstWriterFixes().filter((fix) => fix === 'El mismo motivo de siempre.');
      expect(repeated).toHaveLength(1);
    });
  });
});