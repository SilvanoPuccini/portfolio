import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHmac } from 'crypto';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin: vi.fn() }));

import { getSupabaseAdmin } from '@/lib/supabase';
import { POST } from '@/app/api/webhooks/calcom/route';

const SECRET = 'secreto-de-prueba';

/**
 * Lee el estado actual del lead y captura lo que la ruta escriba.
 * `select` es para la lectura previa; `update` para el guardado.
 */
function supabaseWithLead(estado: string | null) {
  const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  const from = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: estado === null ? null : { estado }, error: null }),
      }),
    }),
    update,
  });
  vi.mocked(getSupabaseAdmin).mockReturnValue({ from } as never);
  return update;
}

function paidRequest(triggerEvent = 'BOOKING_PAID') {
  const body = JSON.stringify({
    triggerEvent,
    payload: { attendees: [{ email: 'lucia@example.com' }] },
  });
  const signature = createHmac('sha256', SECRET).update(body).digest('hex');
  return new NextRequest('http://localhost/api/webhooks/calcom', {
    method: 'POST',
    headers: { 'x-cal-signature-256': signature, 'Content-Type': 'application/json' },
    body,
  });
}

describe('webhook de Cal.com — el pago mueve la venta', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CALCOM_WEBHOOK_SECRET = SECRET;
  });

  it('cierra la venta cuando entra el pago', async () => {
    const update = supabaseWithLead('presupuestado');

    const body = await (await POST(paidRequest())).json();

    // Antes esto solo escribía pago_estado y el lead quedaba figurando como
    // abierto: alguien ya cobrado aparecía en la lista como en conversación.
    expect(update).toHaveBeenCalledWith({ pago_estado: 'pagado', estado: 'cerrado' });
    expect(body.action).toBe('pago_confirmado_y_cerrado');
  });

  it('sigue registrando el pago sin retroceder una venta ya facturada', async () => {
    const update = supabaseWithLead('facturado');

    const body = await (await POST(paidRequest())).json();

    expect(update).toHaveBeenCalledWith({ pago_estado: 'pagado' });
    expect(body.action).toBe('pago_confirmado');
  });

  it('no revive un lead descartado', async () => {
    const update = supabaseWithLead('descartado');

    await POST(paidRequest());

    // Un cobro sobre un lead dado de baja puede ser un error de facturación.
    // Se registra el pago, pero la venta no se reabre a espaldas de nadie.
    expect(update).toHaveBeenCalledWith({ pago_estado: 'pagado' });
  });

  it('rechaza una firma inválida sin tocar la base', async () => {
    supabaseWithLead('presupuestado');
    const request = new NextRequest('http://localhost/api/webhooks/calcom', {
      method: 'POST',
      headers: { 'x-cal-signature-256': 'firma-falsa' },
      body: JSON.stringify({ triggerEvent: 'BOOKING_PAID', payload: {} }),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(getSupabaseAdmin).not.toHaveBeenCalled();
  });
});

/**
 * Los otros eventos de Cal.com.
 *
 * Existían sin un solo test: el código se veía correcto y nadie sabía si
 * funcionaba. Estos no reemplazan una llamada real —el webhook depende de que
 * Cal.com mande lo que decimos que manda— pero sí fijan qué hace el panel con
 * cada aviso que llega.
 */
function eventRequest(triggerEvent: string, payload: Record<string, unknown> = {}) {
  const body = JSON.stringify({
    triggerEvent,
    payload: { attendees: [{ email: 'lucia@example.com' }], ...payload },
  });
  const signature = createHmac('sha256', SECRET).update(body).digest('hex');
  return new NextRequest('http://localhost/api/webhooks/calcom', {
    method: 'POST',
    headers: { 'x-cal-signature-256': signature, 'Content-Type': 'application/json' },
    body,
  });
}

describe('webhook de Cal.com — el resto del circuito de la llamada', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CALCOM_WEBHOOK_SECRET = SECRET;
  });

  it('agenda la llamada y guarda la fecha', async () => {
    const update = supabaseWithLead('nuevo');

    const body = await (await POST(
      eventRequest('BOOKING_CREATED', { startTime: '2026-09-25T14:00:00.000Z' }),
    )).json();

    expect(update).toHaveBeenCalledWith({
      estado: 'llamada_agendada', fecha_llamada: '2026-09-25T14:00:00.000Z',
    });
    expect(body.action).toBe('llamada_agendada');
  });

  it('mueve la fecha al reprogramar sin tocar el estado', async () => {
    const update = supabaseWithLead('llamada_agendada');

    await POST(eventRequest('BOOKING_RESCHEDULED', { startTime: '2026-09-30T10:00:00.000Z' }));

    expect(update).toHaveBeenCalledWith({ fecha_llamada: '2026-09-30T10:00:00.000Z' });
  });

  it('al cancelar devuelve el lead a nuevo y borra la fecha', async () => {
    const update = supabaseWithLead('llamada_agendada');

    await POST(eventRequest('BOOKING_CANCELLED'));

    expect(update).toHaveBeenCalledWith({ estado: 'nuevo', fecha_llamada: null });
  });

  it('marca el no-show cuando el cliente no aparece', async () => {
    const update = supabaseWithLead('llamada_agendada');

    await POST(eventRequest('BOOKING_NO_SHOW'));

    expect(update).toHaveBeenCalledWith({ estado: 'no_show' });
  });

  it('pasa a «en conversación» cuando termina la reunión', async () => {
    const update = supabaseWithLead('llamada_agendada');

    const body = await (await POST(eventRequest('MEETING_ENDED'))).json();

    expect(update).toHaveBeenCalledWith({ estado: 'en conversación' });
    expect(body.action).toBe('en_conversacion');
  });

  it('guarda el link de la grabación', async () => {
    const update = supabaseWithLead('en conversación');

    await POST(eventRequest('RECORDING_DOWNLOAD_LINK_READY', {
      downloadLink: 'https://cal.com/rec/abc123',
    }));

    expect(update).toHaveBeenCalledWith({ grabacion_url: 'https://cal.com/rec/abc123' });
  });

  it('une los segmentos de la transcripción en un solo texto', async () => {
    const update = supabaseWithLead('en conversación');

    await POST(eventRequest('TRANSCRIPTION_GENERATED', {
      transcription: [{ text: 'Hola, contame' }, { text: 'Necesito un catálogo' }],
    }));

    expect(update).toHaveBeenCalledWith({
      transcripcion: 'Hola, contame\nNecesito un catálogo',
    });
  });

  it('no guarda una transcripción vacía', async () => {
    const update = supabaseWithLead('en conversación');

    const body = await (await POST(eventRequest('TRANSCRIPTION_GENERATED', {
      transcription: [{ text: '  ' }],
    }))).json();

    expect(update).not.toHaveBeenCalled();
    expect(body.action).toBe('ignored');
  });

  it('ignora un evento que no conoce sin tocar la base', async () => {
    const update = supabaseWithLead('nuevo');

    const body = await (await POST(eventRequest('ALGO_NUEVO_DE_CALCOM'))).json();

    expect(body.action).toBe('ignored');
    expect(update).not.toHaveBeenCalled();
  });

  it('rechaza un webhook sin correo de asistente', async () => {
    supabaseWithLead('nuevo');
    const body = JSON.stringify({ triggerEvent: 'MEETING_ENDED', payload: {} });
    const signature = createHmac('sha256', SECRET).update(body).digest('hex');

    const response = await POST(new NextRequest('http://localhost/api/webhooks/calcom', {
      method: 'POST',
      headers: { 'x-cal-signature-256': signature, 'Content-Type': 'application/json' },
      body,
    }));

    // Sin correo no hay a quién actualizar: el lead se busca por ahí.
    expect(response.status).toBe(400);
  });
});
