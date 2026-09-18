import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin: vi.fn() }));
vi.mock('@/lib/admin-auth', () => ({ isAuthorized: vi.fn().mockReturnValue(true) }));

import { getSupabaseAdmin } from '@/lib/supabase';
import { isAuthorized } from '@/lib/admin-auth';
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
