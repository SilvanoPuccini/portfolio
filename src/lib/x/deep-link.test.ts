import { describe, expect, it } from 'vitest';
import { resolveXThreadDeepLink } from './deep-link';

describe('resolveXThreadDeepLink', () => {
  const threads = [
    { id: 'thread-old', scheduled_at: '2026-04-02T13:00:00.000Z' },
    { id: 'thread-current', scheduled_at: '2026-09-13T13:00:00.000Z' },
  ];

  it('selects the matching thread and moves the list period to its week', () => {
    expect(resolveXThreadDeepLink(threads, 'thread-old')).toEqual({
      id: 'thread-old',
      period: { mode: 'semana', anchor: '2026-04-02T13:00:00.000Z' },
    });
  });

  it('does not disturb normal list state when the query has no matching thread', () => {
    expect(resolveXThreadDeepLink(threads, 'missing')).toBeNull();
    expect(resolveXThreadDeepLink(threads, null)).toBeNull();
  });
});
