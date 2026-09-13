import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { XThreadRow } from './XThreadRow';
import type { XThreadListItem } from '@/lib/x/types';

function item(status: XThreadListItem['status'], overrides: Partial<XThreadListItem> = {}): XThreadListItem {
  return {
    id: 'thread-1',
    post_slug: 'post',
    angle_id: 'angle',
    angle_summary: 'Angle | question',
    thesis: null,
    reply_with_link: null,
    status,
    scheduled_at: '2026-09-13T13:00:00.000Z',
    pre_approved_at: '2026-09-12T13:00:00.000Z',
    published_at: status === 'publicado' ? '2026-09-13T14:00:00.000Z' : null,
    published_ids: [],
    published_url: null,
    approved_fingerprint: 'approved',
    generation_attempts: 1,
    publish_attempts: 0,
    last_error: null,
    plan: null,
    rewrite_history: [],
    deleted_at: null,
    created_at: '2026-09-12T12:00:00.000Z',
    updated_at: '2026-09-12T12:00:00.000Z',
    tweet_count: 4,
    has_content: true,
    preview: 'First tweet',
    ...overrides,
  };
}

function renderRow(status: XThreadListItem['status'], onChangeStatus = vi.fn(), overrides: Partial<XThreadListItem> = {}) {
  render(<XThreadRow
    item={item(status, overrides)}
    expanded={false}
    onToggle={vi.fn()}
    onGenerate={vi.fn()}
    onSave={vi.fn()}
    onSaveDate={vi.fn()}
    onPublish={vi.fn()}
    onChangeStatus={onChangeStatus}
    onDelete={vi.fn()}
    onMarkRemoved={vi.fn()}
    busy={false}
  />);
  return onChangeStatus;
}

describe('XThreadRow status controls', () => {
  it('distinguishes API publishing from manual status marking', () => {
    const onChangeStatus = renderRow('preaprobado');

    expect(screen.getByRole('button', { name: 'Publicar ahora' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Marcar publicado' }));
    expect(onChangeStatus).toHaveBeenCalledWith('publicado');
  });

  it('lets a published thread return to pre-approved without losing its publication guard', () => {
    const onChangeStatus = renderRow('publicado');

    fireEvent.click(screen.getByRole('button', { name: '← Volver a preaprobado' }));
    expect(onChangeStatus).toHaveBeenCalledWith('preaprobado');
  });

  it('clearly disables error recovery when neither approval nor prior publication makes it safe', () => {
    renderRow('error', vi.fn(), { approved_fingerprint: null, published_at: null });

    expect(screen.getByRole('button', { name: 'Recuperar como preaprobado' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Marcar publicado' })).toBeDisabled();
  });
});
