import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

vi.mock('node:crypto', () => {
  throw new Error('Browser messages must not load server crypto');
});

import { CREDITS_DEPLETED_MESSAGE } from './messages';

describe('browser-safe X messages', () => {
  it('preserves the existing credit notice without loading server crypto', () => {
    expect(CREDITS_DEPLETED_MESSAGE).toBe('Sin crédito en X: copiá y publicá a mano.');
  });

  it('keeps the browser row independent of the server API client', () => {
    const source = readFileSync(new URL('../../components/admin/x/XThreadRow.tsx', import.meta.url), 'utf8');
    expect(source).toContain("from '@/lib/x/messages'");
    expect(source).not.toContain("from '@/lib/x/client'");
  });
});
