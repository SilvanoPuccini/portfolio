import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const repository = vi.hoisted(() => ({
  getThread: vi.fn(),
  threadsScheduledOn: vi.fn(),
  softDelete: vi.fn(),
  updateThread: vi.fn(),
  allowedUrls: vi.fn(() => []),
}));

vi.mock('@/lib/admin-auth', () => ({ isAuthorized: () => true }));
vi.mock('@/lib/x/repository', () => repository);

import { PATCH } from './route';
import type { XThread } from '@/lib/x/types';

function thread(overrides: Partial<XThread> = {}): XThread {
  return {
    id: 'thread-1', post_slug: 'post', angle_id: 'angle', angle_summary: 'Angle | question',
    thesis: null, tweets: [{ text: 'Hook', tweet_number: 1 }], reply_with_link: null,
    evidence: [], status: 'preaprobado', scheduled_at: '2026-09-13T13:00:00.000Z',
    pre_approved_at: '2026-09-12T13:00:00.000Z', published_at: null,
    published_ids: ['existing-id'], published_url: 'https://x.com/user/status/existing-id',
    approved_fingerprint: 'approved', generation_attempts: 1, publish_attempts: 0,
    last_error: null, plan: null, rewrite_history: [], deleted_at: null,
    created_at: '2026-09-12T12:00:00.000Z', updated_at: '2026-09-12T12:00:00.000Z',
    ...overrides,
  };
}

function patch(status: XThread['status']) {
  return PATCH(new NextRequest('http://localhost/api/admin/x-threads/thread-1', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ status }),
  }), { params: Promise.resolve({ id: 'thread-1' }) });
}

describe('PATCH /api/admin/x-threads/[id] status', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-13T14:00:00.000Z'));
    repository.getThread.mockReset();
    repository.updateThread.mockReset();
  });

  it('rejects an invalid status transition with 400 before writing', async () => {
    repository.getThread.mockResolvedValue(thread({ status: 'planificado' }));

    const response = await patch('publicado');

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: 'Transición inválida: planificado → publicado' });
    expect(repository.updateThread).not.toHaveBeenCalled();
  });

  it('marks a manual publication without replacing its existing X metadata', async () => {
    const current = thread();
    repository.getThread.mockResolvedValue(current);
    repository.updateThread.mockImplementation(async (_id: string, updates: Record<string, unknown>) => ({
      ...current,
      ...updates,
    }));

    const response = await patch('publicado');

    expect(response.status).toBe(200);
    expect(repository.updateThread).toHaveBeenCalledWith('thread-1', expect.objectContaining({
      status: 'publicado',
      published_at: '2026-09-13T14:00:00.000Z',
    }));
    const updates = repository.updateThread.mock.calls[0][1];
    expect(updates).not.toHaveProperty('published_url');
    expect(updates).not.toHaveProperty('published_ids');
  });
});
