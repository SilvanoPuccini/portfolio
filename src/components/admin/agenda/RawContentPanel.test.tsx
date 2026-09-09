import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RawContentPanel } from './RawContentPanel';
import type { PostPublication } from '@/lib/post-publications/types';

const refresh = vi.fn();
const push = vi.fn();

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh, push }) }));

const publication: PostPublication = {
  post_slug: 'test-post',
  raw_title: 'Original title',
  raw_content: 'Draft',
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
};

describe('RawContentPanel', () => {
  const writeText = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    refresh.mockReset();
    push.mockReset();
    writeText.mockReset();
    writeText.mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
  });

  it('copies the current edited title and raw text', async () => {
    render(<RawContentPanel item={publication} />);

    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Edited title' } });
    fireEvent.click(screen.getByLabelText('Copiar título'));

    fireEvent.click(screen.getByRole('button', { name: 'Editar texto' }));
    fireEvent.change(screen.getByLabelText('Texto en bruto'), {
      target: { value: 'Edited full raw text' },
    });
    fireEvent.click(screen.getByLabelText('Copiar texto en bruto'));

    await waitFor(() => {
      expect(writeText).toHaveBeenNthCalledWith(1, 'Edited title');
      expect(writeText).toHaveBeenNthCalledWith(2, 'Edited full raw text');
    });
  });

  it('patches title and schedule from the detail editor', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ item: publication }), { status: 200 }),
    );
    render(<RawContentPanel item={publication} />);

    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Updated title' } });
    fireEvent.change(screen.getByLabelText('Programado para'), { target: { value: '2026-09-14T11:30' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar fecha y título' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [, options] = fetchMock.mock.calls[0];
    expect(JSON.parse(String(options?.body))).toEqual({
      raw_title: 'Updated title',
      scheduled_at: new Date('2026-09-14T11:30').toISOString(),
    });
    expect(refresh).toHaveBeenCalled();
  });

  it('keeps the delete dialog open and reports an API failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Database unavailable' }), { status: 500 }),
    );
    render(<RawContentPanel item={publication} />);

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar post' }));

    expect(await screen.findByText('Database unavailable')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Eliminar de la agenda' })).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
