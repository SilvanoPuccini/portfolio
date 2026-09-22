import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHmac } from 'crypto';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin: vi.fn() }));
vi.mock('@/lib/resend', () => ({ sendCrmEmail: vi.fn() }));
vi.mock('@/lib/leads/cuestionario', () => ({ asegurarCuestionario: vi.fn() }));

import { getSupabaseAdmin } from '@/lib/supabase';
import { sendCrmEmail } from '@/lib/resend';
import { asegurarCuestionario } from '@/lib/leads/cuestionario';
import { POST } from '@/app/api/webhooks/calcom/route';

const SECRET = 'secreto-de-prueba';

const LEAD = {
  id: 'lead-1', estado: 'nuevo', nombre: 'Estefanía', email: 'este@ejemplo.com',
  lead_token: 'tok-cliente', presupuesto_rango: null, plazo: null, problema: null,
  que_construir: null, service: null, service_data: null, guia_respuestas: null,
};

function supabase(lead: unknown = LEAD) {
  const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  vi.mocked(getSupabaseAdmin).mockReturnValue({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: lead, error: null }) }),
      }),
      update,
    })),
  } as never);
  return update;
}

function agendada(startTime = '2026-09-25T18:00:00.000Z') {
  const body = JSON.stringify({
    triggerEvent: 'BOOKING_CREATED',
    payload: { startTime, attendees: [{ email: 'este@ejemplo.com' }] },
  });
  return new NextRequest('http://localhost/api/webhooks/calcom', {
    method: 'POST',
    headers: {
      'x-cal-signature-256': createHmac('sha256', SECRET).update(body).digest('hex'),
      'Content-Type': 'application/json',
    },
    body,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CALCOM_WEBHOOK_SECRET = SECRET;
  process.env.NEXT_PUBLIC_SITE_URL = 'https://silvanopuccini.dev';
  vi.mocked(asegurarCuestionario).mockResolvedValue('tok-cuestionario');
  supabase();
});

describe('al agendar la llamada', () => {
  it('manda un solo correo, con la confirmación y las preguntas', async () => {
    await POST(agendada());

    expect(sendCrmEmail).toHaveBeenCalledTimes(1);

    const [para, asunto, html] = vi.mocked(sendCrmEmail).mock.calls[0];
    expect(para).toBe('este@ejemplo.com');
    expect(asunto).toMatch(/llamada/i);
    // Confirma cuándo es y lleva al cuestionario por el link único.
    expect(html).toContain('/cliente/tok-cliente');
    expect(html).toMatch(/25/);
  });

  it('el cuestionario se prepara solo: ya no hay que apretar un botón', async () => {
    await POST(agendada());
    expect(asegurarCuestionario).toHaveBeenCalledWith('lead-1');
  });

  it('si ya lo contestó, no le pide de nuevo las preguntas', async () => {
    vi.mocked(asegurarCuestionario).mockResolvedValue(null);

    await POST(agendada());

    const html = vi.mocked(sendCrmEmail).mock.calls[0][2] as string;
    expect(html).not.toMatch(/contestar las preguntas/i);
  });

  it('una segunda llamada no vuelve a mandar el correo de bienvenida', async () => {
    supabase({ ...LEAD, estado: 'presupuestado' });

    await POST(agendada());

    expect(sendCrmEmail).not.toHaveBeenCalled();
  });

  it('si el correo falla, la llamada igual queda agendada', async () => {
    const update = supabase();
    vi.mocked(sendCrmEmail).mockRejectedValueOnce(new Error('Resend caído'));

    const res = await POST(agendada());

    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ estado: 'llamada_agendada' }));
  });
});
