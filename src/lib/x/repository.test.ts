import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin: vi.fn() }));

import { getSupabaseAdmin } from '@/lib/supabase';
import { appendRewriteHistory, siblingsOf } from './repository';
import { MAX_REWRITE_HISTORY, type XRewriteHistoryEntry } from './types';

function entry(attempt: number): XRewriteHistoryEntry {
  return {
    at: '2026-01-01T00:00:00.000Z',
    attempt,
    provider: 'gemini',
    fixes: [`fix-${attempt}`],
    verdict: 'rewrite',
  };
}

describe('appendRewriteHistory', () => {
  it('appends a new entry to the history', () => {
    const history = appendRewriteHistory([], entry(1));
    expect(history).toHaveLength(1);
    expect(history[0].attempt).toBe(1);
  });

  it('caps the history at MAX_REWRITE_HISTORY, dropping the oldest first', () => {
    let history: XRewriteHistoryEntry[] = [];
    for (let attempt = 1; attempt <= MAX_REWRITE_HISTORY + 3; attempt++) {
      history = appendRewriteHistory(history, entry(attempt));
    }
    expect(history).toHaveLength(MAX_REWRITE_HISTORY);
    expect(history[0].attempt).toBe(4);
    expect(history[history.length - 1].attempt).toBe(MAX_REWRITE_HISTORY + 3);
  });
});
describe('siblingsOf', () => {
  /** La cadena real: from().select().eq().in().is() */
  function supabaseReturning(rows: unknown[]) {
    const is = vi.fn().mockResolvedValue({ data: rows, error: null });
    const inFn = vi.fn().mockReturnValue({ is });
    const eq = vi.fn().mockReturnValue({ in: inFn });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    vi.mocked(getSupabaseAdmin).mockReturnValue({ from } as never);
    return { eq, in: inFn };
  }

  beforeEach(() => vi.clearAllMocks());

  it('only asks the database for approved siblings', async () => {
    const { eq, in: inFn } = supabaseReturning([]);

    await siblingsOf('mi-post');

    expect(eq).toHaveBeenCalledWith('post_slug', 'mi-post');
    // Los borradores en `error` son texto que el crítico YA rechazó y los
    // `planificado` no dicen nada todavía. Si entraran acá, el crítico los
    // leería como "ya publicado" y marcaría REPETITION contra basura propia.
    expect(inFn).toHaveBeenCalledWith('status', ['preaprobado', 'publicado']);
  });

  it('flattens the tweets of every sibling except the row being written', async () => {
    supabaseReturning([
      { id: 'a', tweets: [{ text: 'hermano uno' }, { text: 'hermano dos' }] },
      { id: 'yo', tweets: [{ text: 'mi propio borrador' }] },
      { id: 'b', tweets: null },
    ]);

    const texts = await siblingsOf('mi-post', 'yo');

    expect(texts).toEqual(['hermano uno', 'hermano dos']);
  });
});
