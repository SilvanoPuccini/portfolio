import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: vi.fn(),
}));

import { getSupabaseAdmin } from '@/lib/supabase';
import { POST } from '@/app/api/questionnaire/route';

const VALID_TOKEN = 'valid-token-uuid';
const MOCK_ANSWERS = {
  q1: 'We need to solve X',
  q2: 'Success looks like Y',
  q3: 'No prior solutions',
  q4: 'Just me',
  q5: '3 months',
  q6: 'Nothing else',
};

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/questionnaire', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

function makeSupabaseMock(opts: {
  selectResult: { data: unknown; error: unknown };
  updateResult?: { error: unknown };
}) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(opts.selectResult),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue(opts.updateResult ?? { error: null }),
      }),
    }),
  };
}

describe('POST /api/questionnaire', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 on valid uncompleted token', async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(
      makeSupabaseMock({
        selectResult: { data: { id: 'q-123', completed_at: null }, error: null },
        updateResult: { error: null },
      }) as never,
    );

    const req = makeRequest({ token: VALID_TOKEN, answers: MOCK_ANSWERS });
    const res = await POST(req);
    const body = await res.json() as { success: boolean };

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('returns 404 when token not found', async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(
      makeSupabaseMock({
        selectResult: { data: null, error: { message: 'no rows' } },
      }) as never,
    );

    const req = makeRequest({ token: 'nonexistent-token', answers: MOCK_ANSWERS });
    const res = await POST(req);

    expect(res.status).toBe(404);
  });

  it('returns 409 when token already completed', async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(
      makeSupabaseMock({
        selectResult: {
          data: { id: 'q-456', completed_at: '2026-07-06T10:00:00Z' },
          error: null,
        },
      }) as never,
    );

    const req = makeRequest({ token: VALID_TOKEN, answers: MOCK_ANSWERS });
    const res = await POST(req);

    expect(res.status).toBe(409);
  });

  it('returns 400 when token is missing', async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue({} as never);

    const req = makeRequest({ answers: MOCK_ANSWERS });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when answers are missing', async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue({} as never);

    const req = makeRequest({ token: VALID_TOKEN });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

/**
 * Lo contestado tiene que aterrizar en la venta.
 *
 * Guardar el jsonb no alcanza: la ficha del lead lee columnas. Mientras esto
 * no existió, el cliente contestaba seis preguntas y la llamada arrancaba
 * igual de vacía, con el panel pidiendo que averiguaras lo que ya te habían
 * escrito.
 */
function supabasePorTabla(lead: Record<string, unknown> | null) {
  const updateLeads = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  const updateQuestionnaires = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });

  const from = vi.fn().mockImplementation((tabla: string) => {
    if (tabla === 'leads') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: lead, error: null }),
            single: vi.fn().mockResolvedValue({ data: lead, error: null }),
          }),
        }),
        update: updateLeads,
      };
    }
    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'q-1', lead_id: 'lead-1', completed_at: null },
            error: null,
          }),
        }),
      }),
      update: updateQuestionnaires,
    };
  });

  vi.mocked(getSupabaseAdmin).mockReturnValue({ from } as never);
  return { updateLeads, updateQuestionnaires };
}

/** Todo lo que se escribió sobre `leads`, en un solo objeto. */
function escritoEnLead(updateLeads: ReturnType<typeof vi.fn>) {
  return Object.assign({}, ...updateLeads.mock.calls.map((call) => call[0])) as Record<string, unknown>;
}

describe('POST /api/questionnaire — lo contestado aterriza en la venta', () => {
  beforeEach(() => vi.clearAllMocks());

  it('copia a la venta lo que el cliente escribió', async () => {
    const { updateLeads } = supabasePorTabla({});

    await POST(makeRequest({
      token: VALID_TOKEN,
      answers: {
        q1: 'Anoto los pedidos en un cuaderno',
        q2: 'Pierdo 2 horas por día',
        q5: 'Antes del verano',
        q6: 'Entre 1500 y 2500',
      },
    }));

    expect(escritoEnLead(updateLeads)).toMatchObject({
      que_construir: 'Anoto los pedidos en un cuaderno',
      problema: 'Pierdo 2 horas por día',
      plazo: 'Antes del verano',
      presupuesto_rango: 'Entre 1500 y 2500',
    });
  });

  it('no pisa lo que ya estaba cargado a mano en el panel', async () => {
    const { updateLeads } = supabasePorTabla({ presupuesto_rango: 'USD 3000 acordado' });

    await POST(makeRequest({
      token: VALID_TOKEN,
      answers: { q6: 'No sé todavía', q5: 'Para marzo' },
    }));

    const escrito = escritoEnLead(updateLeads);
    expect(escrito.plazo).toBe('Para marzo');
    expect(escrito).not.toHaveProperty('presupuesto_rango');
  });

  it('sigue guardando el servicio elegido junto con el resto', async () => {
    const { updateLeads } = supabasePorTabla({});

    await POST(makeRequest({
      token: VALID_TOKEN,
      answers: { servicio: 'Vender online', q5: 'Para marzo' },
    }));

    const escrito = escritoEnLead(updateLeads);
    expect(escrito.service).toBeTruthy();
    expect(escrito.plazo).toBe('Para marzo');
  });

  it('no toca la venta cuando no hay nada nuevo que copiar', async () => {
    const { updateLeads, updateQuestionnaires } = supabasePorTabla({ plazo: 'Ya estaba' });

    await POST(makeRequest({ token: VALID_TOKEN, answers: { q5: 'Para marzo' } }));

    // Las respuestas sí se guardan; lo que no pasa es un UPDATE al pedo.
    expect(updateQuestionnaires).toHaveBeenCalled();
    expect(updateLeads).not.toHaveBeenCalled();
  });

  it('guarda las respuestas aunque el volcado a la venta falle', async () => {
    const { updateQuestionnaires } = supabasePorTabla(null);

    const res = await POST(makeRequest({ token: VALID_TOKEN, answers: { q5: 'Para marzo' } }));

    // El cliente ya hizo su parte: perder sus respuestas porque no se pudo
    // leer el lead sería castigarlo por un problema nuestro.
    expect(res.status).toBe(200);
    expect(updateQuestionnaires).toHaveBeenCalled();
  });
});
