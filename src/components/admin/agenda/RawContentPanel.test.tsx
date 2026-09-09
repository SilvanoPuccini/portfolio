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

function bodyOf(call: [unknown, RequestInit | undefined]) {
  return JSON.parse(String(call[1]?.body));
}

describe('RawContentPanel', () => {
  const writeText = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    refresh.mockReset();
    push.mockReset();
    writeText.mockReset();
    writeText.mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  });

  it('copies the title and the text as they stand on screen', async () => {
    render(<RawContentPanel item={publication} />);

    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Edited title' } });
    fireEvent.click(screen.getByLabelText('Copiar título'));

    fireEvent.change(screen.getByLabelText('Texto en bruto'), { target: { value: 'Edited full raw text' } });
    fireEvent.click(screen.getByLabelText('Copiar texto'));

    await waitFor(() => {
      expect(writeText).toHaveBeenNthCalledWith(1, 'Edited title');
      expect(writeText).toHaveBeenNthCalledWith(2, 'Edited full raw text');
    });
  });

  it('saves the title and the schedule on blur, without a save button', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ item: publication }), { status: 200 }),
    );
    render(<RawContentPanel item={publication} />);

    const title = screen.getByLabelText('Título');
    fireEvent.change(title, { target: { value: 'Updated title' } });
    fireEvent.blur(title);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(bodyOf(fetchMock.mock.calls[0] as never)).toEqual({ raw_title: 'Updated title' });

    const date = screen.getByLabelText('Programado para');
    fireEvent.change(date, { target: { value: '2026-09-14T11:30' } });
    fireEvent.blur(date);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(bodyOf(fetchMock.mock.calls[1] as never)).toEqual({
      scheduled_at: new Date('2026-09-14T11:30').toISOString(),
    });
    expect(refresh).toHaveBeenCalled();
  });

  it('saves the text on blur and does not resend it when nothing changed', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ item: publication }), { status: 200 }),
    );
    render(<RawContentPanel item={publication} />);

    const text = screen.getByLabelText('Texto en bruto');
    fireEvent.blur(text);
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.change(text, { target: { value: 'Rewritten body' } });
    fireEvent.blur(text);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(bodyOf(fetchMock.mock.calls[0] as never)).toEqual({ raw_content: 'Rewritten body' });
  });

  it('sends an attached markdown file for the server to convert', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ item: { ...publication, raw_content: 'Converted text' } }), { status: 200 }),
    );
    render(<RawContentPanel item={publication} />);

    fireEvent.change(screen.getByLabelText('.md'), {
      target: { files: [new File(['# Titulo\n\nCuerpo del post'], 'post.md', { type: 'text/markdown' })] },
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(bodyOf(fetchMock.mock.calls[0] as never)).toEqual({
      source_markdown: '# Titulo\n\nCuerpo del post',
    });
  });

  it('reports a failed delete in place and does not navigate away', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Database unavailable' }), { status: 500 }),
    );
    render(<RawContentPanel item={publication} />);

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar de la agenda' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sí, eliminar de la agenda' }));

    expect(await screen.findByText('Database unavailable')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
