import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AccesoGate } from './AccesoGate';
import type { PlanKickoff } from '@/content/kickoff';

const refresh = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));
vi.mock('./KickoffForm', () => ({ KickoffForm: ({ iniciales }: { iniciales: unknown }) => <div data-testid="materials">{JSON.stringify(iniciales)}</div> }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.clearAllMocks(); });

// The legacy shape lets this regression run against the vulnerable implementation.
const lockedProps = { pedidoId: 'order-a', verificado: false as const, locale: 'en' as const, plan: {} as PlanKickoff, iniciales: {}, yaCompletado: false };

describe('material access after OTP', () => {
  it('refreshes server authorization after OTP and waits for server props before showing the form', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }));
    const { rerender } = render(<AccesoGate {...lockedProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mandame el código' }));
    fireEvent.change(await screen.findByLabelText('Tu código'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    expect(screen.queryByTestId('materials')).not.toBeInTheDocument();
    rerender(<AccesoGate {...lockedProps} verificado={true} iniciales={{}} />);
    expect(screen.getByTestId('materials')).toBeInTheDocument();
    rerender(<AccesoGate {...lockedProps} />);
    expect(screen.queryByTestId('materials')).not.toBeInTheDocument();
  });

  it('does not refresh or reveal the form after a rejected OTP', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ pista: 'te***@example.com' }) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Invalid code' }) }));
    render(<AccesoGate {...lockedProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mandame el código' }));
    fireEvent.change(await screen.findByLabelText('Tu código'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid code');
    expect(refresh).not.toHaveBeenCalled();
    expect(screen.queryByTestId('materials')).not.toBeInTheDocument();
  });
});
