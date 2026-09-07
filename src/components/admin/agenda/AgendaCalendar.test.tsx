import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AgendaCalendar } from './AgendaCalendar';
import type { PostPublicationListItem } from '@/lib/post-publications/types';

function item(slug: string): PostPublicationListItem {
  return {
    post_slug: slug,
    raw_title: `Post ${slug}`,
    scheduled_at: '2026-09-13T13:00:00.000Z',
    status: 'planificado',
    notify_subscribers: true,
    pre_approved_at: null,
    published_at: null,
    notified_at: null,
    notify_attempts: 0,
    notify_error: null,
    deleted_at: null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    has_content: false,
    content_chars: 0,
  };
}

describe('AgendaCalendar', () => {
  beforeEach(() => vi.useFakeTimers({ now: new Date('2026-09-07T12:00:00.000Z') }));
  afterEach(() => vi.useRealTimers());

  it('reveals and allows selecting every post when a day overflows', () => {
    const onSelect = vi.fn();
    render(
      <AgendaCalendar
        items={[item('one'), item('two'), item('three')]}
        selectedSlug={null}
        onSelect={onSelect}
        onCreate={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Post three, Planificado' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Mostrar 1 post más/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Post three, Planificado' }));

    expect(onSelect).toHaveBeenCalledWith('three');
  });

  it('starts creation from a day with its date and default publication time', () => {
    const onCreate = vi.fn();
    render(
      <AgendaCalendar items={[]} selectedSlug={null} onSelect={vi.fn()} onCreate={onCreate} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Crear post el 13\/9\/2026/ }));

    expect(onCreate).toHaveBeenCalledWith('2026-09-13T10:00');
  });
});
