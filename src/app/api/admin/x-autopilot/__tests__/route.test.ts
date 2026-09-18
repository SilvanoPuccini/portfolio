import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin: vi.fn() }));
vi.mock('@/lib/admin-auth', () => ({ isAuthorized: vi.fn().mockReturnValue(true) }));

import { getSupabaseAdmin } from '@/lib/supabase';
import { isAuthorized } from '@/lib/admin-auth';
import { GET, POST } from '@/app/api/admin/x-autopilot/route';

type ReadResult = { data: { x_autopilot: boolean } | null; error: { message: string } | null };

/**
 * `.from()` se llama dos veces en un POST: una para leer el estado actual y
 * otra para guardarlo. El mock devuelve la misma cadena para las dos y expone
 * el upsert para poder afirmar sobre lo que realmente se escribió.
 */
function supabaseMock(read: ReadResult, upsertError: { message: string } | null = null) {
  const upsert = vi.fn().mockResolvedValue({ error: upsertError });
  const from = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue(read) }),
    }),
    upsert,
  });
  vi.mocked(getSupabaseAdmin).mockReturnValue({ from } as never);
  return { from, upsert };
}

const getRequest = () => new NextRequest('http://localhost/api/admin/x-autopilot');
const postRequest = (body?: unknown) => new NextRequest('http://localhost/api/admin/x-autopilot', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

describe('/api/admin/x-autopilot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isAuthorized).mockReturnValue(true);
  });

  it('rejects unauthenticated reads without touching the database', async () => {
    vi.mocked(isAuthorized).mockReturnValue(false);

    const response = await GET(getRequest());

    expect(response.status).toBe(401);
    expect(getSupabaseAdmin).not.toHaveBeenCalled();
  });

  it('reports the stored value as available', async () => {
    supabaseMock({ data: { x_autopilot: true }, error: null });

    const body = await (await GET(getRequest())).json();

    expect(body).toEqual({ autopilot: true, available: true });
  });

  it('falls back to manual mode when the row does not exist yet', async () => {
    supabaseMock({ data: null, error: null });

    const body = await (await GET(getRequest())).json();

    expect(body).toEqual({ autopilot: false, available: true });
  });

  it('flags the setting as unavailable when the table is missing', async () => {
    supabaseMock({ data: null, error: { message: 'relation "site_settings" does not exist' } });

    const body = await (await GET(getRequest())).json();

    // Sin `available: false` el panel mostraría "modo manual" y nadie se
    // enteraría de que la migración 022 nunca corrió.
    expect(body.available).toBe(false);
    expect(body.autopilot).toBe(false);
    expect(body.detail).toContain('site_settings');
  });

  it('toggles the stored value when no explicit value is sent', async () => {
    const { upsert } = supabaseMock({ data: { x_autopilot: false }, error: null });

    const body = await (await POST(postRequest())).json();

    expect(body).toEqual({ autopilot: true, available: true });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, x_autopilot: true }),
      { onConflict: 'id' },
    );
  });

  it('honours an explicit value instead of toggling', async () => {
    const { upsert } = supabaseMock({ data: { x_autopilot: true }, error: null });

    const body = await (await POST(postRequest({ autopilot: true }))).json();

    expect(body.autopilot).toBe(true);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ x_autopilot: true }),
      { onConflict: 'id' },
    );
  });

  it('refuses to write when the setting table is not there', async () => {
    const { upsert } = supabaseMock({ data: null, error: { message: 'relation "site_settings" does not exist' } });

    const response = await POST(postRequest({ autopilot: true }));

    expect(response.status).toBe(503);
    expect((await response.json()).error).toContain('migración 022');
    expect(upsert).not.toHaveBeenCalled();
  });

  it('surfaces a failed write instead of reporting a mode it never saved', async () => {
    supabaseMock({ data: { x_autopilot: false }, error: null }, { message: 'permission denied' });

    const response = await POST(postRequest({ autopilot: true }));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.autopilot).toBeUndefined();
    expect(body.error).toContain('permission denied');
  });
});
