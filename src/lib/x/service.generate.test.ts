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
  approvedThreadTexts: vi.fn(async () => [] as string[][]),
}));

vi.mock('./orchestrate', () => orchestrate);
vi.mock('./repository', () => repository);
vi.mock('./gemini', () => ({ planWeek: vi.fn() }));
vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin: vi.fn() }));

import { getSupabaseAdmin } from '@/lib/supabase';
import { planWeek } from './gemini';
import { generateThread, replanThread } from './service';
import type { XAngle, XThread, XRewriteHistoryEntry } from './types';

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
    expect(repository.approvedThreadTexts).toHaveBeenCalledExactlyOnceWith('thread-1');
    expect(orchestrate.orchestrateThread.mock.calls[0][0].approvedThreads).toEqual([]);
  });

  it('does not blame the plan when the row never had one', async () => {
    orchestrate.orchestrateThread.mockResolvedValue(repetitionBlock);

    const updates = await generateThread(thread({ plan: null })) as unknown as Record<string, string>;

    // Una fila sin guion prueba UN ángulo reconstruido. Decir "todos los
    // ángulos ya están cubiertos" mandaba a replanificar algo que no existía.
    expect(orchestrate.orchestrateThread).toHaveBeenCalledTimes(1);
    expect(updates.last_error).toContain('no tiene el guion guardado');
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

  it('persists fallback identity with its history and resumes that same angle', async () => {
    let stored = thread();
    repository.updateThread.mockImplementation(async (_id, updates) => {
      stored = { ...stored, ...updates } as XThread;
      return { ...stored };
    });
    orchestrate.orchestrateThread.mockImplementation(async (params) => {
      await params.onAttempt({ at: '2026-10-14', attempt: 1, provider: 'gemini',
        fixes: [params.selectedAngleId], verdict: 'blocked', reasons: [REPETITION] });
      return repetitionBlock;
    });

    await generateThread(stored);

    expect(stored.angle_id).toBe('dos');
    expect(stored.angle_summary).toBe('Segundo ángulo | ¿Y ahora?');
    expect(stored.rewrite_history[0].fixes).toEqual(['dos']);
    const savedHistory = stored.rewrite_history;
    orchestrate.orchestrateThread.mockClear();
    await generateThread(stored);
    expect(orchestrate.orchestrateThread.mock.calls[0][0]).toMatchObject({
      selectedAngleId: 'dos', history: savedHistory,
    });
    expect(repository.updateThread).toHaveBeenCalledWith('thread-1', expect.objectContaining({
      angle_id: 'dos', rewrite_history: expect.any(Array),
    }));
  });

  it('keeps fallback identity if the fallback stops for another reason', async () => {
    let stored = thread();
    repository.updateThread.mockImplementation(async (_id, updates) => {
      stored = { ...stored, ...updates } as XThread;
      return { ...stored };
    });
    orchestrate.orchestrateThread.mockImplementation(async (params) => {
      await params.onAttempt({ at: '2026-10-14', attempt: 1, provider: 'gemini', fixes: [],
        verdict: 'blocked', reasons: [params.selectedAngleId] });
      return params.selectedAngleId === 'uno' ? repetitionBlock
        : { ...repetitionBlock, reasons: ['Falta material'] };
    });
    await generateThread(stored);
    expect(stored.angle_id).toBe('dos');
    expect(stored.rewrite_history[0].reasons).toEqual(['dos']);
    expect(stored.last_error).toBe('Falta material');
  });
});

describe('replanThread', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    articleInDatabase();
    repository.recentAngles.mockResolvedValue(['approved thesis']);
    repository.rejectedAngles.mockResolvedValue(['rejected thesis']);
    repository.updateThread.mockImplementation(async (_id, updates) => updates);
  });

  const exhausted = () => thread({ status: 'error', last_error:
    'Los 2 ángulos del plan ya están cubiertos por hilos aprobados de la semana. Replanificá la semana o usá otro post.',
    scheduled_at: '2026-10-15T16:00:00Z', rewrite_history: [{ fixes: ['old'] } as XRewriteHistoryEntry] });

  it('replaces only the failed row plan, clearing history without resetting attempts or schedule', async () => {
    const fresh = [{ id: 'fresh', summary: 'New treatment', question: 'Why?', anchor: 'source' }];
    vi.mocked(planWeek).mockResolvedValue({ data: { angles: fresh }, tokens: 1, provider: 'gemini' });
    await replanThread(exhausted());
    expect(repository.updateThread).toHaveBeenCalledExactlyOnceWith('thread-1', expect.objectContaining({
      status: 'planificado', plan: fresh, angle_id: 'fresh', rewrite_history: [],
      approved_fingerprint: null, tweets: [], last_error: null,
    }));
    const patch = repository.updateThread.mock.calls[0][1];
    for (const key of ['id', 'post_slug', 'scheduled_at', 'generation_attempts', 'published_at']) {
      expect(patch).not.toHaveProperty(key);
    }
    expect(repository.createWeek).not.toHaveBeenCalled();
    expect(orchestrate.orchestrateThread).not.toHaveBeenCalled();
    expect(planWeek).toHaveBeenCalledWith(expect.any(String), expect.any(String), ['approved thesis'],
      expect.arrayContaining(['rejected thesis', expect.stringContaining('Primer ángulo')]));
  });

  it.each(['empty', 'failure'])('leaves the row untouched on planner %s', async (outcome) => {
    const target = exhausted();
    const sibling = thread({ id: 'approved-sibling', status: 'preaprobado' });
    const state = [target, sibling];
    const before = JSON.stringify(state);
    repository.updateThread.mockImplementation(async (id, updates) => {
      const row = state.find((candidate) => candidate.id === id)!;
      Object.assign(row, updates);
      return { ...row };
    });
    if (outcome === 'empty') vi.mocked(planWeek).mockResolvedValue({ data: { angles: [] }, tokens: 1, provider: 'gemini' });
    else vi.mocked(planWeek).mockRejectedValue(new Error('provider unavailable'));
    await expect(replanThread(target)).rejects.toThrow();
    expect(repository.updateThread).not.toHaveBeenCalled();
    expect(JSON.stringify(state)).toBe(before);
  });

  it.each([
    { status: 'preaprobado' as const }, { published_at: '2026-10-01' },
    { published_ids: ['tweet-id'] }, { last_error: 'Missing source' },
  ])('refuses ineligible recovery without calling the planner: %j', async (overrides) => {
    await expect(replanThread({ ...exhausted(), ...overrides })).rejects.toThrow();
    expect(planWeek).not.toHaveBeenCalled();
    expect(repository.updateThread).not.toHaveBeenCalled();
  });
});
