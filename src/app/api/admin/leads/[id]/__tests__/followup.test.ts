import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin: vi.fn() }));
vi.mock('@/lib/admin-auth', () => ({ isAuthorized: vi.fn().mockReturnValue(true) }));
vi.mock('@/lib/resend', () => ({ sendCrmEmail: vi.fn() }));
vi.mock('@/lib/leads/followup', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/leads/followup')>()),
  draftFollowup: vi.fn(),
}));

import { getSupabaseAdmin } from '@/lib/supabase';
import { isAuthorized } from '@/lib/admin-auth';
import { sendCrmEmail } from '@/lib/resend';
import { draftFollowup } from '@/lib/leads/followup';
import { GET, POST } from '@/app/api/admin/leads/[id]/followup/route';

function supabaseWithLead(lead: Record<string, unknown> | null) {
  const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  const from = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: lead, error: null }) }),
    }),
    update,
  });
  vi.mocked(getSupabaseAdmin).mockReturnValue({ from } as never);
  return update;
}

const LEAD = {
  nombre: 'Ferrelon',
  email: 'hola@ferrelon.com',
  estado: 'presupuestado',
  monto_presupuestado: 4800,
  proposal_sent_at: new Date(Date.now() - 9 * 86_400_000).toISOString(),
  diagnostico_requerimiento: 'Catálogo con stock',
  diagnostico_dolor: 'Pierden pedidos por WhatsApp',
  diagnostico_preocupaciones: 'El costo',
};

const params = Promise.resolve({ id: 'lead-1' });
const get = () => GET(new NextRequest('http://localhost/x'), { params });
const post = (body: unknown) => POST(
  new NextRequest('http://localhost/x', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }),
  { params },
);

describe('el borrador de seguimiento', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isAuthorized).mockReturnValue(true);
    vi.mocked(draftFollowup).mockResolvedValue({
      subject: '¿Seguimos con el catálogo?',
      body: 'Te escribo por la propuesta.',
      provider: 'gemini',
      tokens: 320,
    });
  });

  it('escribe pero NO manda', async () => {
    // La frontera entera: la IA redacta, la persona decide.
    supabaseWithLead(LEAD);

    const body = await (await get()).json();

    expect(body.subject).toBe('¿Seguimos con el catálogo?');
    expect(sendCrmEmail).not.toHaveBeenCalled();
  });

  it('le pasa al modelo lo que se habló en la llamada', async () => {
    supabaseWithLead(LEAD);

    await get();

    expect(draftFollowup).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Ferrelon',
      daysWaiting: 9,
      concerns: 'El costo',
      pain: 'Pierden pedidos por WhatsApp',
    }));
  });

  it('si no hay cuota lo dice, sin romper el resto', async () => {
    supabaseWithLead(LEAD);
    vi.mocked(draftFollowup).mockRejectedValue(new Error('Sin cuota'));

    const response = await get();

    // El aviso del tablero sigue ahí y el correo se puede escribir a mano.
    expect(response.status).toBe(503);
    expect((await response.json()).error).toContain('Sin cuota');
  });

  it('manda solo el texto aprobado', async () => {
    supabaseWithLead(LEAD);

    await post({ subject: 'Asunto corregido', body: 'Texto que edité yo.' });

    expect(sendCrmEmail).toHaveBeenCalledWith(
      'hola@ferrelon.com', 'Asunto corregido', expect.stringContaining('Texto que edité yo.'),
    );
  });

  it('no manda un correo vacío', async () => {
    supabaseWithLead(LEAD);

    const response = await post({ subject: 'Solo asunto' });

    expect(response.status).toBe(400);
    expect(sendCrmEmail).not.toHaveBeenCalled();
  });

  it('reinicia el reloj del silencio al enviar', async () => {
    // Si no, el aviso quedaría clavado en rojo aunque hayas hecho el
    // seguimiento: el silencio se cuenta desde el último contacto.
    const update = supabaseWithLead(LEAD);

    await post({ subject: 'Asunto', body: 'Texto' });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ proposal_sent_at: expect.any(String) }),
    );
  });

  it('no reinicia el reloj si el correo no salió', async () => {
    const update = supabaseWithLead(LEAD);
    vi.mocked(sendCrmEmail).mockRejectedValue(new Error('Resend caído'));

    const response = await post({ subject: 'Asunto', body: 'Texto' });

    expect(response.status).toBe(502);
    expect(update).not.toHaveBeenCalled();
  });

  it('rechaza sin sesión', async () => {
    vi.mocked(isAuthorized).mockReturnValue(false);
    expect((await get()).status).toBe(401);
  });
});
