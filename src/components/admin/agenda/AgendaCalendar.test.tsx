import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AgendaCalendar } from './AgendaCalendar';
import type { AgendaItem } from '@/lib/agenda/types';

function item(slug: string, channel: 'blog' | 'linkedin' = 'blog', overrides: Partial<AgendaItem> = {}): AgendaItem {
  return {
    id: `${channel}:${slug}`,
    channel,
    source_id: slug,
    title: `Post ${slug}`,
    detail_path: channel === 'blog' ? `/admin/agenda/${slug}` : `/admin/content/${slug}`,
    scheduled_at: '2026-09-13T13:00:00.000Z',
    status: 'planificado',
    pre_approved_at: null,
    published_at: null,
    has_content: false,
    content_chars: 0,
    has_pdf: false,
    is_ready: false,
    ...overrides,
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
        selectedId={null}
        onSelect={onSelect}
        onCreate={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: /Post three, Blog, Planificado/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('+1 más'));
    fireEvent.click(screen.getByRole('button', { name: /Post three, Blog, Planificado/ }));

    expect(onSelect).toHaveBeenCalledWith('blog:three');
  }, 10_000);

  it('starts creation from a day with its date and default publication time', () => {
    const onCreate = vi.fn();
    render(
      <AgendaCalendar items={[]} selectedId={null} onSelect={vi.fn()} onCreate={onCreate} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Crear post el 13\/9\/2026/ }));

    expect(onCreate).toHaveBeenCalledWith('2026-09-13T10:00');
  });

  it('identifies channel, title and state for each calendar entry', () => {
    render(<AgendaCalendar items={[item('linkedin-one', 'linkedin')]} selectedId={null} onSelect={vi.fn()} onCreate={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Post linkedin-one, LinkedIn, Planificado/ })).toBeInTheDocument();
  });

  it('marks a piece that still has no material so it reads apart from a ready one', () => {
    render(<AgendaCalendar
      items={[item('sin-material', 'linkedin'), item('completa', 'blog', { has_content: true, has_pdf: true, is_ready: true })]}
      selectedId={null} onSelect={vi.fn()} onCreate={vi.fn()}
    />);

    expect(screen.getByRole('button', { name: 'Post sin-material, LinkedIn, Planificado, incompleta' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Post completa, Blog, Planificado' })).toBeInTheDocument();
  });
});
