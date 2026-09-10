import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AgendaCalendar } from './AgendaCalendar';
import type { AgendaItem } from '@/lib/agenda/types';

function item(slug: string, channel: AgendaItem['channel'] = 'blog', overrides: Partial<AgendaItem> = {}): AgendaItem {
  return {
    id: `${channel}:${slug}`,
    channel,
    source_id: slug,
    title: `Post ${slug}`,
    detail_path: channel === 'blog' ? `/admin/agenda/${slug}` : channel === 'linkedin' ? `/admin/content/${slug}` : '/admin/x',
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

/**
 * Tiempo más largo que el de por defecto, a propósito.
 *
 * El calendario dibuja un mes entero: 42 celdas, cada una con sus botones y
 * sus chips en SVG. En jsdom ese render es lento de verdad, y con la suite
 * completa corriendo en paralelo pasaba los 5 s por defecto de forma
 * intermitente. No es lentitud del componente en el navegador: es el costo de
 * armar ese árbol sin motor de layout.
 */
describe('AgendaCalendar', { timeout: 20_000 }, () => {
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

    // Se busca por texto y no por rol con nombre: `getByRole` con `name`
    // calcula el nombre accesible de TODOS los botones del calendario, que son
    // varias decenas, y bajo carga se pasa del tiempo límite. El texto visible
    // prueba lo mismo y es una búsqueda directa.
    expect(screen.queryByText('Post three')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('+1 más'));
    fireEvent.click(screen.getByText('Post three').closest('button')!);

    expect(onSelect).toHaveBeenCalledWith('blog:three');
  });

  it('starts creation from a day with its date and default publication time', () => {
    const onCreate = vi.fn();
    render(
      <AgendaCalendar items={[]} selectedId={null} onSelect={vi.fn()} onCreate={onCreate} />,
    );

    fireEvent.click(screen.getByLabelText('Crear post el 13/9/2026'));

    expect(onCreate).toHaveBeenCalledWith('2026-09-13T10:00');
  });

  it('identifies channel, title and state for each calendar entry', () => {
    render(<AgendaCalendar items={[item('linkedin-one', 'linkedin')]} selectedId={null} onSelect={vi.fn()} onCreate={vi.fn()} />);
    expect(screen.getByLabelText('Post linkedin-one, LinkedIn, Planificado, incompleta')).toBeInTheDocument();
  });

  it('names the channel with a word, not an abbreviation', () => {
    render(<AgendaCalendar items={[item('uno'), item('dos', 'linkedin')]} selectedId={null} onSelect={vi.fn()} onCreate={vi.fn()} />);

    expect(screen.getAllByText('BLOG').length).toBeGreaterThan(0);
    expect(screen.getAllByText('LINKEDIN').length).toBeGreaterThan(0);
  });

  it('gives X its own silhouette so three channels stay apart at a glance', () => {
    render(<AgendaCalendar
      items={[item('uno'), item('dos', 'linkedin'), item('tres', 'x')]}
      selectedId={null} onSelect={vi.fn()} onCreate={vi.fn()}
    />);

    expect(screen.getAllByText('BLOG').length).toBeGreaterThan(0);
    expect(screen.getAllByText('LINKEDIN').length).toBeGreaterThan(0);
    expect(screen.getAllByText('X').length).toBeGreaterThan(0);
  });

  it('labels which channel each weekday carries, so nothing lands on the wrong day', () => {
    render(<AgendaCalendar items={[]} selectedId={null} onSelect={vi.fn()} onCreate={vi.fn()} />);

    // Domingo lleva el blog; martes y viernes, LinkedIn. Está rotulado en la
    // cabecera para que no haya que saberlo de memoria.
    expect(screen.getByText('Domingo')).toBeInTheDocument();
    expect(screen.getByText('Martes')).toBeInTheDocument();
    expect(screen.getByText('Viernes')).toBeInTheDocument();
  });

  it('opens the day with its pieces and closes without leaving the calendar', () => {
    const onSelect = vi.fn();
    render(<AgendaCalendar items={[item('del-dia')]} selectedId={null} onSelect={onSelect} onCreate={vi.fn()} />);

    fireEvent.click(screen.getByLabelText('Ver el 13/9/2026'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Ver y editar el texto'));
    expect(onSelect).toHaveBeenCalledWith('blog:del-dia');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('marks a piece that still has no material so it reads apart from a ready one', () => {
    render(<AgendaCalendar
      items={[item('sin-material', 'linkedin'), item('completa', 'blog', { has_content: true, has_pdf: true, is_ready: true })]}
      selectedId={null} onSelect={vi.fn()} onCreate={vi.fn()}
    />);

    expect(screen.getByLabelText('Post sin-material, LinkedIn, Planificado, incompleta')).toBeInTheDocument();
    expect(screen.getByLabelText('Post completa, Blog, Planificado')).toBeInTheDocument();
  });
});
