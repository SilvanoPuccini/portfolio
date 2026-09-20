import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/leads/proposal-response', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/leads/proposal-response')>()),
  recordProposalResponse: vi.fn(),
}));

import { recordProposalResponse } from '@/lib/leads/proposal-response';
import { POST } from './route';

const post = (body: unknown, ip = '1.1.1.1') => POST(new NextRequest('http://localhost/api/propuesta', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
  body: JSON.stringify(body),
}));

describe('POST /api/propuesta', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(recordProposalResponse).mockResolvedValue({ ok: true, answer: 'aceptada', contrato: 'enviado' });
  });

  it('registra la aceptación y avisa que el contrato salió', async () => {
    const body = await (await post({ token: 'tok-1', respuesta: 'aceptada' })).json();

    expect(recordProposalResponse).toHaveBeenCalledWith('tok-1', 'aceptada', undefined, undefined);
    expect(body).toMatchObject({ ok: true, contrato: 'enviado' });
  });

  it('pasa el motivo del rechazo', async () => {
    vi.mocked(recordProposalResponse).mockResolvedValue({ ok: true, answer: 'rechazada', contrato: 'no_corresponde' });

    await post({ token: 'tok-1', respuesta: 'rechazada', motivo: 'Se pospuso' });

    expect(recordProposalResponse).toHaveBeenCalledWith('tok-1', 'rechazada', 'Se pospuso', undefined);
  });

  it('rechaza una respuesta que no es ni sí ni no', async () => {
    const response = await post({ token: 'tok-1', respuesta: 'quizás' });

    expect(response.status).toBe(400);
    expect(recordProposalResponse).not.toHaveBeenCalled();
  });

  it('sin token no hace nada', async () => {
    expect((await post({ respuesta: 'aceptada' })).status).toBe(400);
    expect(recordProposalResponse).not.toHaveBeenCalled();
  });

  it('un link que ya no sirve lo dice sin filtrar nada del lead', async () => {
    vi.mocked(recordProposalResponse).mockResolvedValue({ ok: false, reason: 'not_found' });

    const response = await post({ token: 'viejo', respuesta: 'aceptada' });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(JSON.stringify(body)).not.toContain('lead');
  });

  it('una propuesta ya respondida no se vuelve a responder', async () => {
    vi.mocked(recordProposalResponse).mockResolvedValue({
      ok: false, reason: 'already_answered', answer: 'aceptada',
    });

    const response = await post({ token: 'tok-1', respuesta: 'aceptada' });

    expect(response.status).toBe(409);
    expect((await response.json()).yaRespondida).toBe(true);
  });

  it('corta a quien pruebe tokens en masa', async () => {
    // El token es la única puerta: sin límite se puede probar de a miles.
    const ip = '9.9.9.9';
    for (let i = 0; i < 10; i += 1) await post({ token: `t${i}`, respuesta: 'aceptada' }, ip);

    expect((await post({ token: 't11', respuesta: 'aceptada' }, ip)).status).toBe(429);
  });

  it('agenda el recordatorio que pidió el cliente', async () => {
    vi.mocked(recordProposalResponse).mockResolvedValue({ ok: true, answer: 'pensando', contrato: 'no_corresponde' });
    const enUnaSemana = new Date(Date.now() + 7 * 86_400_000).toISOString();

    await post({ token: 'tok-1', respuesta: 'pensando', recordar: enUnaSemana });

    expect(recordProposalResponse).toHaveBeenCalledWith('tok-1', 'pensando', undefined, enUnaSemana);
  });

  it('una fecha imposible no pierde el lead en silencio', async () => {
    // Ayer, o dentro de dos años, no son recordatorios: se cae a una semana.
    vi.mocked(recordProposalResponse).mockResolvedValue({ ok: true, answer: 'pensando', contrato: 'no_corresponde' });

    await post({ token: 'tok-1', respuesta: 'pensando', recordar: '2020-01-01T00:00:00.000Z' });

    const [, , , remindAt] = vi.mocked(recordProposalResponse).mock.calls[0];
    const days = (Date.parse(remindAt as string) - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(6);
    expect(days).toBeLessThan(8);
  });
});
