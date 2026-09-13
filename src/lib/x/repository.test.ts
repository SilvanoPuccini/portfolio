import { describe, expect, it } from 'vitest';
import { appendRewriteHistory } from './repository';
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