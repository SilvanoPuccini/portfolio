import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin: vi.fn() }));
vi.mock('@/lib/admin-auth', () => ({ isAuthorized: vi.fn().mockReturnValue(true) }));
vi.mock('@/lib/leads/recommendation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/leads/recommendation')>()),
  draftRecommendation: vi.fn(),
}));

import { getSupabaseAdmin } from '@/lib/supabase';
import { isAuthorized } from '@/lib/admin-auth';
import { draftRecommendation } from '@/lib/leads/recommendation';
import { GET } from '@/app/api/admin/leads/[id]/recommendation/route';

const CATALOG = [{ slug: 'catalogo', label: 'Catálogo', horas_min: 20, horas_max: 30 }];

function supabase(lead: Record<string, unknown> | null) {
  const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  const from = vi.fn((table: string) => (table === 'modulos_presupuesto'
    ? { select: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: CATALOG, error: null }) }) }
    : {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: lead, error: null }) }),
      }),
      update,
    }));
  vi.mocked(getSupabaseAdmin).mockReturnValue({ from } as never);
  return update;
}

const LEAD = {
  nombre: 'Ferrelon',
  que_construir: 'Un catálogo con stock',
  problema: 'Pierden pedidos por WhatsApp',
  tiene_pagos: false,
  recomendacion: null,
  diagnostico_dolor: 'Se les caen 3 pedidos por semana',
  diagnostico_situacion: 'Toman pedidos por WhatsApp y cargan a mano',
};

const RECOMMENDATION = {
  problema: 'Pierden pedidos porque el stock vive en la cabeza de dos personas',
  solucion: 'Catálogo con stock en vivo',
  modulos: [{ slug: 'catalogo', porque: 'Es lo que resuelve el problema descrito' }],
  no_ofrecer: [{ que: 'Pasarela de pagos', porque: 'Hoy cobran por transferencia y no lo pidieron' }],
  objeciones: [{ objecion: 'Es caro', respuesta: 'Compararlo con los pedidos que pierden por mes' }],
  falta_preguntar: [],
  confianza: 'alta',
  provider: 'gemini',
  tokens: 900,
};

const params = Promise.resolve({ id: 'lead-1' });
const get = (query = '') => GET(new NextRequest(`http://localhost/x${query}`), { params });

describe('la recomendación de qué ofrecer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isAuthorized).mockReturnValue(true);
    vi.mocked(draftRecommendation).mockResolvedValue(RECOMMENDATION as never);
  });

  it('pide sesión de admin', async () => {
    vi.mocked(isAuthorized).mockReturnValue(false);
    expect((await get()).status).toBe(401);
  });

  it('arma la recomendación con el formulario, la llamada y el catálogo real', async () => {
    supabase(LEAD);

    const body = await (await get()).json();

    expect(draftRecommendation).toHaveBeenCalledWith(expect.objectContaining({
      formulario: expect.objectContaining({ que_construir: 'Un catálogo con stock' }),
      diagnostico: expect.objectContaining({ dolor: 'Se les caen 3 pedidos por semana' }),
      catalogo: CATALOG,
    }));
    expect(body.solucion).toBe('Catálogo con stock en vivo');
  });

  it('le pasa los huecos del formulario para que pida lo que falta', async () => {
    supabase(LEAD);

    await get();

    const { huecos } = vi.mocked(draftRecommendation).mock.calls[0][0];
    expect(huecos).toContain('Con qué presupuesto se maneja');
    expect(huecos).not.toContain('Qué quiere construir');
  });

  it('la guarda para no volver a gastar cuota', async () => {
    const update = supabase(LEAD);

    await get();

    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      recomendacion: expect.objectContaining({ solucion: 'Catálogo con stock en vivo' }),
    }));
  });

  it('reusa la guardada y con refresh escribe una nueva', async () => {
    supabase({ ...LEAD, recomendacion: { solucion: 'Lo de la vez pasada' } });

    const cached = await (await get()).json();
    expect(cached.solucion).toBe('Lo de la vez pasada');
    expect(draftRecommendation).not.toHaveBeenCalled();

    const fresh = await (await get('?refresh=1')).json();
    expect(fresh.solucion).toBe('Catálogo con stock en vivo');
  });

  it('sin cuota lo dice y no rompe la ficha', async () => {
    supabase(LEAD);
    vi.mocked(draftRecommendation).mockRejectedValue(new Error('Sin cuota'));

    const response = await get();

    expect(response.status).toBe(503);
    expect((await response.json()).error).toContain('Sin cuota');
  });

  it('un lead que no existe devuelve 404', async () => {
    supabase(null);
    expect((await get()).status).toBe(404);
  });
});
