import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin: vi.fn() }));
vi.mock('@/lib/admin-auth', () => ({ isAuthorized: vi.fn().mockReturnValue(true) }));
vi.mock('@/lib/resend', () => ({ sendCrmEmail: vi.fn() }));

import { getSupabaseAdmin } from '@/lib/supabase';
import { isAuthorized } from '@/lib/admin-auth';
import { sendCrmEmail } from '@/lib/resend';
import { POST } from '@/app/api/admin/leads/[id]/advance/route';

function supabaseWithLead(estado: string | null) {
  const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  const from = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: estado === null ? null : { estado }, error: null,
        }),
      }),
    }),
    update,
  });
  vi.mocked(getSupabaseAdmin).mockReturnValue({ from } as never);
  return update;
}

const params = Promise.resolve({ id: 'lead-1' });
const post = (body: unknown) => POST(
  new NextRequest('http://localhost/api/admin/leads/lead-1/advance', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }),
  { params },
);

describe('POST /api/admin/leads/[id]/advance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isAuthorized).mockReturnValue(true);
  });

  it('rechaza sin sesión y sin tocar la base', async () => {
    vi.mocked(isAuthorized).mockReturnValue(false);
    expect((await post({ event: 'entregado' })).status).toBe(401);
    expect(getSupabaseAdmin).not.toHaveBeenCalled();
  });

  it('marca la firma del contrato con su fecha', async () => {
    const update = supabaseWithLead('contrato_enviado');

    const body = await (await post({ event: 'contrato_firmado' })).json();

    expect(body.estado).toBe('contrato_firmado');
    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      estado: 'contrato_firmado',
      contrato_firmado_at: expect.any(String),
    }));
  });

  it('guarda el porcentaje de seña que eligió la persona', async () => {
    const update = supabaseWithLead('contrato_firmado');

    await post({ event: 'pago_recibido', sena_pct: 30, sena_monto: 1500, pago_unico: false });

    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      estado: 'cerrado', sena_pct: 30, sena_monto: 1500, pago_unico: false,
    }));
  });

  it('confirmar el pago apaga el aviso de pago informado', async () => {
    // El cartel del panel lee `pago_estado`. Confirmar guardaba la fecha y
    // el estado del lead, pero dejaba `pago_estado` en «informado»: el aviso
    // amarillo seguía ahí después de haber cobrado.
    const update = supabaseWithLead('contrato_firmado');

    await post({ event: 'pago_recibido' });

    expect(update).toHaveBeenCalledWith(expect.objectContaining({ pago_estado: 'pagado' }));
  });

  it('exige el número de factura', async () => {
    const update = supabaseWithLead('cerrado');

    const response = await post({ event: 'facturado' });

    expect(response.status).toBe(400);
    expect(update).not.toHaveBeenCalled();
  });

  it('registra el hecho aunque la venta ya esté más adelante', async () => {
    const update = supabaseWithLead('entregado');

    const body = await (await post({ event: 'pago_recibido' })).json();

    // Nada retrocede, pero la fecha del cobro queda igual: el hecho ocurrió.
    expect(body.estado).toBeUndefined();
    expect(body.registrado).toBe('pago_recibido');
    const written = update.mock.calls[0][0] as Record<string, unknown>;
    expect(written).not.toHaveProperty('estado');
    expect(written).toHaveProperty('cobrado_at');
  });

  it('no acepta los hechos que dispara un correo real', async () => {
    const update = supabaseWithLead('en conversación');

    const response = await post({ event: 'propuesta_enviada' });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('se mueven al mandarse');
    expect(update).not.toHaveBeenCalled();
  });

  it('exige un motivo para dar una venta por perdida', async () => {
    const update = supabaseWithLead('presupuestado');

    const response = await post({ event: 'perdido' });

    // Un «descartado» sin razón no enseña nada para la próxima propuesta.
    expect(response.status).toBe(400);
    expect(update).not.toHaveBeenCalled();
  });

  it('guarda el motivo cuando se pierde la venta', async () => {
    const update = supabaseWithLead('presupuestado');

    const body = await (await post({ event: 'perdido', motivo: 'Eligió otro proveedor' })).json();

    expect(body.estado).toBe('descartado');
    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      estado: 'descartado',
      perdido_motivo: 'Eligió otro proveedor',
      perdido_at: expect.any(String),
    }));
  });

  it('devuelve 404 si el lead no existe', async () => {
    supabaseWithLead(null);
    expect((await post({ event: 'entregado' })).status).toBe(404);
  });
});

/**
 * Los correos del cierre.
 *
 * El pedido de pago va DESPUÉS de la firma, no antes: el contrato es lo que
 * respalda la venta, y firmar no le cuesta plata al cliente, así que hay mucha
 * menos fricción en ese orden. El agradecimiento va apenas entra el pago, que
 * es el momento de mayor ansiedad — acaba de soltar plata y no vio nada.
 */
describe('los correos que salen al avanzar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isAuthorized).mockReturnValue(true);
    vi.mocked(sendCrmEmail).mockResolvedValue(undefined as never);
  });

  /** La ficha completa que lee notifyClient para armar el correo. */
  function supabaseWithFullLead(estado: string, extra: Record<string, unknown> = {}) {
    const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    const from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              estado, nombre: 'Ferrelon', email: 'hola@ferrelon.com',
              monto_presupuestado: 4800, sena_pct: null, sena_monto: null,
              pago_unico: null, factura_numero: null, ...extra,
            },
            error: null,
          }),
        }),
      }),
      update,
    });
    vi.mocked(getSupabaseAdmin).mockReturnValue({ from } as never);
    return update;
  }

  it('la firma dispara el pedido de pago', async () => {
    supabaseWithFullLead('contrato_enviado');

    const body = await (await post({ event: 'contrato_firmado' })).json();

    expect(sendCrmEmail).toHaveBeenCalledOnce();
    expect(vi.mocked(sendCrmEmail).mock.calls[0][1]).toContain('pago');
    expect(body.correo).toMatchObject({ ok: true, tipo: 'pedido_de_pago' });
  });

  it('el cobro dispara el agradecimiento con los pasos que siguen', async () => {
    supabaseWithFullLead('contrato_firmado');

    const body = await (await post({ event: 'pago_recibido', sena_monto: 2400 })).json();

    const html = vi.mocked(sendCrmEmail).mock.calls[0][2];
    expect(html).toContain('Gracias, Ferrelon');
    expect(html).toContain('Qué pasa ahora');
    expect(body.correo).toMatchObject({ ok: true, tipo: 'pago_recibido' });
  });

  it('respeta los pasos que se escriban a mano', async () => {
    supabaseWithFullLead('contrato_firmado');

    await post({ event: 'pago_recibido', nextSteps: ['Arranco el lunes con el catálogo'] });

    expect(vi.mocked(sendCrmEmail).mock.calls[0][2]).toContain('Arranco el lunes con el catálogo');
  });

  it('permite registrar el hecho sin avisarle al cliente', async () => {
    supabaseWithFullLead('contrato_enviado');

    const body = await (await post({ event: 'contrato_firmado', notify: false })).json();

    expect(sendCrmEmail).not.toHaveBeenCalled();
    expect(body.estado).toBe('contrato_firmado');
  });

  it('facturar y entregar no le mandan nada al cliente', async () => {
    supabaseWithFullLead('cerrado');

    await post({ event: 'facturado', factura_numero: 'A-0001' });

    expect(sendCrmEmail).not.toHaveBeenCalled();
  });

  it('si el correo falla, el hecho queda registrado igual', async () => {
    // Un mail caído no puede deshacer un cobro que ya ocurrió.
    supabaseWithFullLead('contrato_firmado');
    vi.mocked(sendCrmEmail).mockRejectedValue(new Error('Resend caído'));

    const response = await post({ event: 'pago_recibido' });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.estado).toBe('cerrado');
    expect(body.correo).toMatchObject({ ok: false });
    expect(body.correo.detail).toContain('Resend caído');
  });
});
