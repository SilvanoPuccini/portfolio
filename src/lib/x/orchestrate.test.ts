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
});