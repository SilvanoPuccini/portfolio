import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: vi.fn().mockReturnValue(true) }));
vi.mock('@/lib/resend', () => ({ sendCrmEmail: vi.fn() }));

import { getSupabaseAdmin } from '@/lib/supabase';
import { rateLimit } from '@/lib/rate-limit';
import { sendCrmEmail } from '@/lib/resend';
import { POST } from './route';

const PEDIDO = { id: 'pedido-1', lead_id: 'lead-1', paquete: 'landing', extras: [] };
const LEAD = {
  id: 'lead-1', nombre: 'Estefanía', email: 'este@ejemplo.com',
  kickoff_datos: { negocio: 'Nutrición infantil' },
  kickoff_completado_at: null as string | null,
};

const update = vi.fn();

function supabase(pedido: unknown = PEDIDO, lead: unknown = LEAD) {
  update.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  vi.mocked(getSupabaseAdmin).mockReturnValue({
    from: vi.fn((tabla: string) => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: tabla === 'pedidos' ? pedido : lead, error: null }),
        }),
      }),
      update,
    })),
  } as never);
}

const post = (body: unknown, id = 'pedido-1') =>
  POST(
    new NextRequest('http://localhost/x', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  );

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(rateLimit).mockReturnValue(true);
  process.env.ADMIN_EMAIL = 'silvano@ejemplo.com';
  supabase();
});

describe('POST /api/pedido/[id]/datos', () => {
  it('guarda lo que el cliente escribió, sin pisar lo anterior', async () => {
    const res = await post({ datos: { whatsapp: '+54911' } });

    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      kickoff_datos: { negocio: 'Nutrición infantil', whatsapp: '+54911' },
    }));
  });

  it('un guardado parcial no avisa a nadie: es un borrador', async () => {
    await post({ datos: { whatsapp: '+54911' } });
    expect(sendCrmEmail).not.toHaveBeenCalled();
  });

  it('cuando dice que terminó, queda marcado y Silvano se entera', async () => {
    const res = await post({ datos: { whatsapp: '+54911' }, listo: true });

    expect(res.status).toBe(200);
    const guardado = update.mock.calls[0][0] as { kickoff_completado_at?: string };
    expect(guardado.kickoff_completado_at).toBeTruthy();

    const [para, asunto] = vi.mocked(sendCrmEmail).mock.calls[0];
    expect(para).toBe('silvano@ejemplo.com');
    expect(asunto).toMatch(/Estefanía/);
  });

  it('terminar dos veces no vuelve a avisar', async () => {
    supabase(PEDIDO, { ...LEAD, kickoff_completado_at: '2026-09-22T10:00:00Z' });
    await post({ datos: {}, listo: true });
    expect(sendCrmEmail).not.toHaveBeenCalled();
  });

  it('si el aviso falla, lo cargado no se pierde', async () => {
    vi.mocked(sendCrmEmail).mockRejectedValueOnce(new Error('Resend caído'));
    expect((await post({ datos: { x: '1' }, listo: true })).status).toBe(200);
    expect(update).toHaveBeenCalled();
  });

  it('descarta lo que no es texto: el cuerpo viene del navegador', async () => {
    await post({ datos: { negocio: { raro: true }, whatsapp: '+54911' } });
    const guardado = update.mock.calls[0][0] as { kickoff_datos: Record<string, unknown> };
    expect(guardado.kickoff_datos.negocio).toBe('Nutrición infantil');
    expect(guardado.kickoff_datos.whatsapp).toBe('+54911');
  });

  it('acepta las filas de los bloques repetidos', async () => {
    await post({ datos: { secciones: [{ titulo: 'Inicio', texto: 'Hola' }] } });
    const guardado = update.mock.calls[0][0] as { kickoff_datos: Record<string, unknown> };
    expect(guardado.kickoff_datos.secciones).toEqual([{ titulo: 'Inicio', texto: 'Hola' }]);
  });

  it('un pedido que no existe no guarda nada', async () => {
    supabase(null);
    expect((await post({ datos: {} })).status).toBe(404);
  });

  it('frena a quien insiste', async () => {
    vi.mocked(rateLimit).mockReturnValue(false);
    expect((await post({ datos: {} })).status).toBe(429);
  });
});
