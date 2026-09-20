import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ProposalDecision } from './ProposalDecision';

function mockApi(body: Record<string, unknown> = { ok: true }, ok = true) {
  const fetchMock = vi.fn().mockResolvedValue({ ok, json: async () => body });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const sent = (fetchMock: ReturnType<typeof mockApi>) =>
  JSON.parse(fetchMock.mock.calls[0][1].body as string);

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.unstubAllGlobals());

describe('ProposalDecision', () => {
  it('ofrece las tres salidas', () => {
    // Dos botones dejaban fuera la respuesta más común de una venta real.
    render(<ProposalDecision token="tok-1" />);

    expect(screen.getByRole('button', { name: /Acepto/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Dejámelo pensar/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /No por ahora/i })).toBeTruthy();
  });

  it('aceptar manda la respuesta y anuncia el contrato', async () => {
    const fetchMock = mockApi();
    render(<ProposalDecision token="tok-1" />);

    fireEvent.click(screen.getByRole('button', { name: /Acepto/i }));

    expect(sent(fetchMock)).toMatchObject({ token: 'tok-1', respuesta: 'aceptada' });
    expect(await screen.findByText(/te llega el contrato para firmar/i)).toBeTruthy();
  });

  it('«dejámelo pensar» pregunta cuándo, y agenda esa fecha', async () => {
    const fetchMock = mockApi();
    render(<ProposalDecision token="tok-1" />);

    fireEvent.click(screen.getByRole('button', { name: /Dejámelo pensar/i }));
    fireEvent.click(screen.getByRole('button', { name: /Una semana/i }));

    const body = sent(fetchMock);
    expect(body.respuesta).toBe('pensando');
    const days = (Date.parse(body.recordar) - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(6);
    expect(days).toBeLessThan(8);
  });

  it('quien lo pensaba puede volver y decidir', async () => {
    // Pedir tiempo no puede cerrarle la puerta: sería una trampa.
    mockApi();
    render(<ProposalDecision token="tok-1" answered="pensando" />);

    fireEvent.click(screen.getByRole('button', { name: /Quiero decidir ahora/i }));

    expect(screen.getByRole('button', { name: /Acepto/i })).toBeTruthy();
  });

  it('rechazar pide el motivo antes de mandarlo', async () => {
    const fetchMock = mockApi();
    render(<ProposalDecision token="tok-1" />);

    fireEvent.click(screen.getByRole('button', { name: /No por ahora/i }));
    fireEvent.change(screen.getByLabelText(/Por qué no avanzamos/i), { target: { value: 'Se pospuso' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar mi respuesta/i }));

    expect(sent(fetchMock)).toMatchObject({ respuesta: 'rechazada', motivo: 'Se pospuso' });
    expect(await screen.findByText(/Gracias por avisar/i)).toBeTruthy();
  });

  it('un «no» sin motivo se puede mandar igual', () => {
    const fetchMock = mockApi();
    render(<ProposalDecision token="tok-1" />);

    fireEvent.click(screen.getByRole('button', { name: /No por ahora/i }));
    fireEvent.click(screen.getByRole('button', { name: /Enviar mi respuesta/i }));

    expect(fetchMock).toHaveBeenCalled();
  });

  it('si ya respondió no vuelve a preguntar', () => {
    render(<ProposalDecision token="tok-1" answered="aceptada" />);

    expect(screen.queryByRole('button', { name: /Acepto/i })).toBeNull();
  });

  it('un error no deja al cliente sin saber qué hacer', async () => {
    mockApi({ error: 'Este link ya no está disponible.' }, false);
    render(<ProposalDecision token="tok-1" />);

    fireEvent.click(screen.getByRole('button', { name: /Acepto/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('ya no está disponible');
  });

  it('avisa cuando la propuesta ya fue respondida desde otro lado', async () => {
    mockApi({ yaRespondida: true }, false);
    render(<ProposalDecision token="tok-1" />);

    fireEvent.click(screen.getByRole('button', { name: /Acepto/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('ya fue respondida');
  });
});
