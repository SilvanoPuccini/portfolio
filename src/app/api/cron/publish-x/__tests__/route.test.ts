import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/admin-auth', () => ({
  isCronAuthorized: vi.fn().mockReturnValue(true),
  isApiKeyAuthorized: vi.fn().mockReturnValue(false),
}));
vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin: vi.fn() }));
vi.mock('@/lib/x/client', () => ({ isCreditsDepletedError: vi.fn().mockReturnValue(false) }));
vi.mock('@/lib/x/repository', () => ({ dueNow: vi.fn(), pendingGeneration: vi.fn() }));
vi.mock('@/lib/x/service', () => ({ generateThread: vi.fn(), publishThreadNow: vi.fn() }));

import { isCronAuthorized } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import { dueNow, pendingGeneration } from '@/lib/x/repository';
import { generateThread, publishThreadNow } from '@/lib/x/service';
import { GET } from '@/app/api/cron/publish-x/route';

/** El interruptor vive en `site_settings`: una fila, una columna. */
function settings(result: { data: { x_autopilot: boolean } | null; error: { message: string } | null }) {
  const from = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue(result) }),
    }),
  });
  vi.mocked(getSupabaseAdmin).mockReturnValue({ from } as never);
}

const request = () => new NextRequest('http://localhost/api/cron/publish-x');

describe('GET /api/cron/publish-x — autopilot gate', () => {
  const originalFlag = process.env.X_AUTOPUBLISH;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isCronAuthorized).mockReturnValue(true);
    delete process.env.X_AUTOPUBLISH;
    vi.mocked(dueNow).mockResolvedValue([]);
    vi.mocked(pendingGeneration).mockResolvedValue([]);
  });

  afterEach(() => {
    if (originalFlag === undefined) delete process.env.X_AUTOPUBLISH;
    else process.env.X_AUTOPUBLISH = originalFlag;
  });

  it('keeps the env kill switch as the outermost brake', async () => {
    process.env.X_AUTOPUBLISH = 'off';

    const body = await (await GET(request())).json();

    expect(body).toMatchObject({ paused: true, reason: 'env' });
    expect(getSupabaseAdmin).not.toHaveBeenCalled();
  });

  it('does nothing while the panel is in manual mode', async () => {
    settings({ data: { x_autopilot: false }, error: null });

    const body = await (await GET(request())).json();

    expect(body).toMatchObject({ paused: true, reason: 'manual_mode', published: 0, generated: 0 });
    // Lo importante del modo manual: el cron no escribe ni publica solo.
    expect(publishThreadNow).not.toHaveBeenCalled();
    expect(generateThread).not.toHaveBeenCalled();
  });

  it('pauses with a distinct reason when the setting cannot be read', async () => {
    settings({ data: null, error: { message: 'relation "site_settings" does not exist' } });

    const body = await (await GET(request())).json();

    // Fail-safe, pero diagnosticable: un `manual_mode` acá taparía una
    // migración sin correr hasta que faltara un hilo.
    expect(body).toMatchObject({ paused: true, reason: 'settings_unavailable' });
    expect(body.detail).toContain('site_settings');
    expect(publishThreadNow).not.toHaveBeenCalled();
  });

  it('never publishes on a missing singleton row', async () => {
    settings({ data: null, error: null });

    const body = await (await GET(request())).json();

    expect(body).toMatchObject({ paused: true, reason: 'manual_mode' });
  });

  it('runs the full circuit once the autopilot is on', async () => {
    settings({ data: { x_autopilot: true }, error: null });

    const body = await (await GET(request())).json();

    expect(body.paused).toBeUndefined();
    expect(dueNow).toHaveBeenCalledOnce();
    expect(pendingGeneration).toHaveBeenCalledOnce();
  });

  it('rejects an unauthenticated call before reading any setting', async () => {
    vi.mocked(isCronAuthorized).mockReturnValue(false);

    const response = await GET(request());

    expect(response.status).toBe(401);
    expect(getSupabaseAdmin).not.toHaveBeenCalled();
  });
});
