import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PostEngagement } from './PostEngagement';

function response(body: unknown, ok = true): Response {
  return { ok, json: vi.fn().mockResolvedValue(body) } as unknown as Response;
}

describe('PostEngagement', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
  });

  it('optimistically updates a reaction and rolls back when the API fails', async () => {
    let rejectReaction: (reason?: unknown) => void = () => undefined;
    const reactionRequest = new Promise<Response>((_resolve, reject) => {
      rejectReaction = reject;
    });
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation((_input, init) => {
      if (!init?.method) return Promise.resolve(response({ data: { likeCount: 2, reaction: null } }));
      const body = JSON.parse(String(init.body)) as { action: string };
      if (body.action === 'view') return Promise.resolve(response({ data: { recorded: true } }));
      return reactionRequest;
    });

    render(<PostEngagement slug="test-post" title="Test post" locale="en" />);
    const likeButton = await screen.findByRole('button', { name: 'Like: 2' });

    fireEvent.click(likeButton);
    expect(screen.getByText('3')).toBeInTheDocument();
    rejectReaction(new Error('network failure'));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Like: 2' })).toBeInTheDocument());
    expect(screen.getByRole('status')).toHaveTextContent('Could not update');
    expect(fetchMock).toHaveBeenCalled();
  });

  it('copies the URL and records share intent only after clipboard success', async () => {
    const clipboardWrite = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: clipboardWrite },
    });
    const actions: string[] = [];
    vi.spyOn(globalThis, 'fetch').mockImplementation((_input, init) => {
      if (!init?.method) return Promise.resolve(response({ data: { likeCount: 1, reaction: null } }));
      const body = JSON.parse(String(init.body)) as { action: string };
      actions.push(body.action);
      return Promise.resolve(response({ data: { recorded: true } }));
    });

    render(<PostEngagement slug="test-post" title="Test post" locale="en" />);
    await screen.findByRole('button', { name: 'Like: 1' });
    await waitFor(() => expect(actions).toContain('view'));

    fireEvent.click(screen.getByRole('button', { name: 'Share' }));

    await waitFor(() => expect(clipboardWrite).toHaveBeenCalledWith(window.location.href));
    await waitFor(() => expect(actions).toContain('share'));
    expect(screen.getByRole('status')).toHaveTextContent('Link copied.');
  });
});
