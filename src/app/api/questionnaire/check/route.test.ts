import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin: vi.fn() }));

import { getSupabaseAdmin } from '@/lib/supabase';
import { GET } from './route';

const TOKEN = 'token-uuid';

function supabaseCon(questionnaire: unknown, lead: unknown) {
  const tabla = (data: unknown) => ({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data, error: data ? null : { message: 'not found' } }),
      }),
    }),
  });
  return { from: vi.fn((name: string) => tabla(name === 'questionnaires' ? questionnaire : lead)) };
}

function pedido(qs = `token=${TOKEN}`) {
  return new NextRequest(`http://localhost/api/questionnaire/check?${qs}`);
}

beforeEach(() => vi.clearAllMocks());

describe('GET /api/questionnaire/check', () => {
  it('devuelve las preguntas que le faltan a este cliente', async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(
      supabaseCon(
        { id: 'q1', lead_id: 'lead-1', completed_at: null },
        { presupuesto_rango: 'USD 1000', plazo: null, problema: null, que_construir: null, service: null, service_data: null, guia_respuestas: null },
      ) as never,
    );

    const res = await GET(pedido());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.completed).toBe(false);
    // Ya dijo el presupuesto en la web: no se lo preguntamos de nuevo.
    expect(body.questions.some((q: { para: string }) => q.para === 'Presupuesto')).toBe(false);
    expect(body.questions.length).toBeGreaterThan(0);
  });

  it('las trae en inglés si lo piden', async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(
      supabaseCon({ id: 'q1', lead_id: 'lead-1', completed_at: null }, {}) as never,
    );

    const body = await (await GET(pedido(`token=${TOKEN}&lang=en`))).json();
    expect(body.questions[0].text).toMatch(/[a-z]/);
    expect(body.questions[0].text).not.toMatch(/¿/);
  });

  it('un cuestionario ya contestado no trae preguntas', async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(
      supabaseCon({ id: 'q1', lead_id: 'lead-1', completed_at: '2026-09-01T00:00:00Z' }, {}) as never,
    );

    const body = await (await GET(pedido())).json();
    expect(body.completed).toBe(true);
    expect(body.questions).toEqual([]);
  });

  it('sin token no responde nada', async () => {
    const res = await GET(new NextRequest('http://localhost/api/questionnaire/check'));
    expect(res.status).toBe(400);
  });

  it('un token que no existe da 404', async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(supabaseCon(null, null) as never);
    expect((await GET(pedido())).status).toBe(404);
  });
});
