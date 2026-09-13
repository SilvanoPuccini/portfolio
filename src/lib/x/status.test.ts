import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isValidXTransition, xStatusTimestampUpdates, xTransitionBlockReason } from './status';

describe('X thread status transitions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-13T12:00:00.000Z'));
  });

  it('allows the editorial transitions and rejects unsafe shortcuts', () => {
    expect(isValidXTransition('planificado', 'preaprobado')).toBe(true);
    expect(isValidXTransition('preaprobado', 'publicado')).toBe(true);
    expect(isValidXTransition('publicado', 'preaprobado')).toBe(true);
    expect(isValidXTransition('planificado', 'publicado')).toBe(false);
    expect(isValidXTransition('publicado', 'planificado')).toBe(false);
  });

  it('permits credit-error recovery only when the content was approved', () => {
    const approvedError = { status: 'error' as const, approved_fingerprint: 'approved', published_at: null };
    const unapprovedError = { status: 'error' as const, approved_fingerprint: null, published_at: null };

    expect(xTransitionBlockReason(approvedError, 'preaprobado')).toBeNull();
    expect(xTransitionBlockReason(approvedError, 'publicado')).toBeNull();
    expect(xTransitionBlockReason(unapprovedError, 'publicado')).toContain('huella de aprobación');
  });

  it('allows a previously published row to return to pre-approved without a fingerprint', () => {
    expect(xTransitionBlockReason({
      status: 'publicado',
      approved_fingerprint: null,
      published_at: '2026-09-12T10:00:00.000Z',
    }, 'preaprobado')).toBeNull();
  });

  it('marks a manual publication once while preserving publication metadata', () => {
    const updates = xStatusTimestampUpdates({
      pre_approved_at: '2026-09-12T09:00:00.000Z',
      published_at: null,
    }, 'publicado');

    expect(updates).toEqual({
      published_at: '2026-09-13T12:00:00.000Z',
      pre_approved_at: '2026-09-12T09:00:00.000Z',
      last_error: null,
    });
    expect(updates).not.toHaveProperty('published_url');
    expect(updates).not.toHaveProperty('published_ids');
  });

  it('retains published_at when returning to pre-approved as the cron no-republish guard', () => {
    const publishedAt = '2026-09-12T10:00:00.000Z';
    const updates = xStatusTimestampUpdates({ pre_approved_at: null, published_at: publishedAt }, 'preaprobado');

    expect(updates).toEqual({
      pre_approved_at: '2026-09-13T12:00:00.000Z',
      last_error: null,
    });
    expect(updates).not.toHaveProperty('published_at');
  });
});
