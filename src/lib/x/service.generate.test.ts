import { beforeEach, describe, expect, it, vi } from 'vitest';

const REPETITION = 'El ángulo ya lo cubrió otro hilo publicable de la semana: reescribirlo no lo vuelve distinto.';

const orchestrate = vi.hoisted(() => ({
  orchestrateThread: vi.fn(),
  fingerprint: vi.fn(() => 'fingerprint'),
  REPETITION_BLOCK_REASON: 'El ángulo ya lo cubrió otro hilo publicable de la semana: reescribirlo no lo vuelve distinto.',
}));
const repository = vi.hoisted(() => ({
  allowedUrls: vi.fn(() => [] as string[]),
  appendRewriteHistory: vi.fn((current: unknown[], entry: unknown) => [...current, entry]),
  siblingsOf: vi.fn(async () => [] as string[]),
  updateThread: vi.fn(async (_id: string, updates: Record<string, unknown>) => updates),
  createThread: vi.fn(),
  createWeek: vi.fn(),
  recentAngles: vi.fn(),
  rejectedAngles: vi.fn(),
}));

vi.mock('./orchestrate', () => orchestrate);
vi.mock('./repository', () => repository);
vi.mock('./gemini', () => ({ planWeek: vi.fn() }));
vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin: vi.fn() }));

import { getSupabaseAdmin } from '@/lib/supabase';
import { generateThread } from './service';
import type { XAngle, XThread } from './types';

/** El post del blog que `loadArticle` va a buscar. */
function articleInDatabase() {
  const maybeSingle = vi.fn().mockResolvedValue({
    data: {
      post_slug: 'mi-post',
      raw_title: 'Un título',
      raw_content: 'El texto completo del artículo.',
      scheduled_at: '2026-09-20T12:00:00.000Z',
    },
    error: null,
  });
  const from = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ is: vi.fn().mockReturnValue({ maybeSingle }) }),
    }),
  });
  vi.mocked(getSupabaseAdmin).mockReturnValue({ from } as never);
}

const ANGLES: XAngle[] = [
  { id: 'uno', summary: 'Primer ángulo', question: '¿Y?', anchor: 'dato uno' },
  { id: 'dos', summary: 'Segundo ángulo', question: '¿Y ahora?', anchor: 'dato dos' },
];

function thread(overrides: Partial<XThread> = {}): XThread {
  return {
    id: 'thread-1',
    post_slug: 'mi-post',
    angle_id: 'uno',
    angle_summary: 'Primer ángulo | ¿Y?',
    plan: ANGLES,
    rewrite_history: [],
    generation_attempts: 4,
    ...overrides,
  } as XThread;
}

/** Un bloqueo por repetición: el service prueba el ángulo siguiente. */
const repetitionBlock = { outcome: 'blocked', reasons: [REPETITION], attempts: 1, tokens: 10, lastDraft: null, provider: 'gemini' };

describe('generateThread — cuando se agotan los ángulos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    articleInDatabase();
    repository.appendRewriteHistory.mockImplementation((current: unknown[], entry: unknown) => [...current, entry]);
    repository.updateThread.mockImplementation(async (_id: string, updates: Record<string, unknown>) => updates);
    repository.allowedUrls.mockReturnValue([]);
    repository.siblingsOf.mockResolvedValue([]);
  });

  it('says how many angles it actually tried when the row has a stored plan', async () => {
    orchestrate.orchestrateThread.mockResolvedValue(repetitionBlock);

    const updates = await generateThread(thread()) as unknown as Record<string, string | number>;

    expect(orchestrate.orchestrateThread).toHaveBeenCalledTimes(2);
    expect(updates.status).toBe('error');
    expect(updates.last_error).toContain('Los 2 ángulos del plan');
    expect(updates.generation_attempts).toBe(6);
  });

  it('does not blame the plan when the row never had one', async () => {
    orchestrate.orchestrateThread.mockResolvedValue(repetitionBlock);

    const updates = await generateThread(thread({ plan: null })) as unknown as Record<string, string>;

    // Una fila sin guion prueba UN ángulo reconstruido. Decir "todos los
    // ángulos ya están cubiertos" mandaba a replanificar algo que no existía.
    expect(orchestrate.orchestrateThread).toHaveBeenCalledTimes(1);
    expect(updates.last_error).toContain('no tiene el guion de la semana guardado');
    expect(updates.last_error).not.toContain('Los 1 ángulos');
  });

  it('stops at the first non-repetition block instead of burning the rest of the plan', async () => {
    orchestrate.orchestrateThread.mockResolvedValue({
      outcome: 'blocked',
      reasons: ['Falta una fuente para el dato del post 2.'],
      attempts: 3, tokens: 30, lastDraft: null, provider: 'gemini',
    });

    const updates = await generateThread(thread()) as unknown as Record<string, string>;

    expect(orchestrate.orchestrateThread).toHaveBeenCalledTimes(1);
    expect(updates.last_error).toContain('Falta una fuente');
  });
});
