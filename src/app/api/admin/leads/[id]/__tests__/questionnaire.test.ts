import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin: vi.fn() }));
vi.mock('@/lib/admin-auth', () => ({ isAuthorized: vi.fn().mockReturnValue(true) }));
vi.mock('@/lib/resend', () => ({ sendCrmEmail: vi.fn() }));

import { getSupabaseAdmin } from '@/lib/supabase';
import { isAuthorized } from '@/lib/admin-auth';
import { sendCrmEmail } from '@/lib/resend';
import { GET, POST } from '@/app/api/admin/leads/[id]/questionnaire/route';

const LEAD = { nombre: 'Ferrelon', email: 'hola@ferrelon.com' };

/** `leads` da la ficha; `questionnaires` el que ya existe, si existe. */
function supabase(existing: Record<string, unknown> | null) {
  const insert = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: { id: 'q-new', token: 'tok-new' }, error: null }),
    }),
  });

  const from = vi.fn((table: string) => (table === 'questionnaires'
    ? {
      insert,
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: existing, error: null }),
            }),
          }),
        }),
      }),
    }
    : {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: LEAD, error: null }) }),
      }),
    }));

  vi.mocked(getSupabaseAdmin).mockReturnValue({ from } as never);
  return insert;
}

const params = Promise.resolve({ id: 'lead-1' });
const post = (body: unknown = {}) => POST(
  new NextRequest('http://localhost/x', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }),
  { params },
);
const get = () => GET(new NextRequest('http://localhost/x'), { params });

const ENVIADO = {
  id: 'q-1', token: 'tok-1', created_at: '2026-09-20T12:00:00.000Z', completed_at: null, answers: null,
};

describe('el cuestionario previo a la llamada', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isAuthorized).mockReturnValue(true);
    vi.mocked(sendCrmEmail).mockResolvedValue(undefined as never);
  });

  it('la primera vez lo crea y lo manda', async () => {
    const insert = supabase(null);

    const response = await post();

    expect(response.status).toBe(201);
    expect(insert).toHaveBeenCalledWith({ lead_id: 'lead-1' });
    expect(vi.mocked(sendCrmEmail).mock.calls[0][0]).toBe('hola@ferrelon.com');
  });

  it('el asunto va en español', async () => {
    // Le escribe a un cliente latinoamericano, no a un usuario de un SaaS.
    supabase(null);

    await post();

    expect(vi.mocked(sendCrmEmail).mock.calls[0][1]).toBe('Unas preguntas antes de nuestra llamada');
  });

  it('no lo manda dos veces por un click de más', async () => {
    const insert = supabase(ENVIADO);

    const response = await post();
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.yaEnviado).toBe(true);
    expect(body.enviadoEl).toBe('2026-09-20T12:00:00.000Z');
    expect(insert).not.toHaveBeenCalled();
    expect(sendCrmEmail).not.toHaveBeenCalled();
  });

  it('reenviarlo manda el MISMO link, no uno nuevo', async () => {
    // Dos links vivos es el cliente contestando uno y vos mirando el otro.
    const insert = supabase(ENVIADO);

    const response = await post({ reenviar: true });

    expect(response.status).toBe(200);
    expect(insert).not.toHaveBeenCalled();
    expect(vi.mocked(sendCrmEmail).mock.calls[0][2]).toContain('/questionnaire/tok-1');
    expect(vi.mocked(sendCrmEmail).mock.calls[0][1]).toContain('reenvío');
  });

  it('si ya lo contestó no se le pide el trabajo de nuevo', async () => {
    supabase({ ...ENVIADO, completed_at: '2026-09-21T10:00:00.000Z' });

    const response = await post({ reenviar: true });

    expect(response.status).toBe(409);
    expect((await response.json()).error).toContain('ya completó');
    expect(sendCrmEmail).not.toHaveBeenCalled();
  });

  it('el panel puede preguntar en qué estado está', async () => {
    supabase(ENVIADO);

    const body = await (await get()).json();

    expect(body).toMatchObject({ enviado: true, enviadoEl: '2026-09-20T12:00:00.000Z', completadoEl: null });
    expect(body.url).toContain('/questionnaire/tok-1');
  });

  it('sin cuestionario todavía, lo dice', async () => {
    supabase(null);

    expect(await (await get()).json()).toEqual({ enviado: false });
  });

  it('pide sesión de admin', async () => {
    vi.mocked(isAuthorized).mockReturnValue(false);

    expect((await get()).status).toBe(401);
    expect((await post()).status).toBe(401);
  });

  it('devuelve las respuestas con su pregunta al lado', async () => {
    // Guardadas y nunca mostradas es exactamente lo mismo que no tenerlas.
    supabase({
      ...ENVIADO,
      completed_at: '2026-09-21T10:00:00.000Z',
      answers: { q1: 'Tomo pedidos por WhatsApp', q2: '  ', q4: 'Decido yo' },
    });

    const body = await (await get()).json();

    expect(body.respuestas).toHaveLength(2);
    expect(body.respuestas[0]).toMatchObject({
      answer: 'Tomo pedidos por WhatsApp',
      question: { para: 'Situación' },
    });
    expect(body.respuestas[1].question.para).toBe('Decisor');
  });

  it('un cuestionario sin contestar no inventa respuestas', async () => {
    supabase(ENVIADO);

    expect((await (await get()).json()).respuestas).toEqual([]);
  });
});
