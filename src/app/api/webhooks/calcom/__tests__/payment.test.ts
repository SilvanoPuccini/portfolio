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
