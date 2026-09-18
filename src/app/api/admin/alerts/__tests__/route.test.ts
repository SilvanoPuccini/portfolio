import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin: vi.fn() }));
vi.mock('@/lib/admin-auth', () => ({ isAuthorized: vi.fn().mockReturnValue(true) }));

import { getSupabaseAdmin } from '@/lib/supabase';
import { isAuthorized } from '@/lib/admin-auth';
import { GET } from '@/app/api/admin/alerts/route';

type Result = { data?: unknown[]; count?: number; error?: { message: string } | null };

/**
 * Un builder de PostgREST que ignora los filtros y resuelve con lo que se le
 * dijo por tabla. Los filtros se prueban contra la base real; acá lo que
 * importa es que cada consulta llegue a su regla.
 */
function supabaseWith(byTable: Record<string, Result>) {
  const from = vi.fn((table: string) => {
    const result = byTable[table] ?? { data: [], count: 0, error: null };
    const chain: Record<string, unknown> = {};
    const step = () => chain;
    for (const method of ['select', 'eq', 'neq', 'gte', 'lt', 'not', 'is']) {
      chain[method] = vi.fn(step);
    }
    // El builder es "thenable": await sobre la cadena devuelve el resultado.
    chain.then = (resolve: (value: Result) => unknown) =>
      Promise.resolve({ error: null, ...result }).then(resolve);
    return chain;
  });
  vi.mocked(getSupabaseAdmin).mockReturnValue({ from } as never);
  return from;
}

const request = () => new NextRequest('http://localhost/api/admin/alerts');
const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString();

describe('GET /api/admin/alerts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isAuthorized).mockReturnValue(true);
  });

  it('rejects an unauthenticated call without touching the database', async () => {
    vi.mocked(isAuthorized).mockReturnValue(false);

    const response = await GET(request());

    expect(response.status).toBe(401);
    expect(getSupabaseAdmin).not.toHaveBeenCalled();
  });

  it('returns an empty list when nothing needs attention', async () => {
    supabaseWith({});

    const body = await (await GET(request())).json();

    expect(body.alerts).toEqual([]);
    expect(body.incomplete).toBeUndefined();
  });

  it('turns rows into alerts, most urgent first', async () => {
    supabaseWith({
      messages: { count: 3 },
      leads: { data: [{ id: 'l1', created_at: hoursAgo(72) }] },
      x_threads: { count: 1 },
    });

    const body = await (await GET(request())).json();
    const ids = body.alerts.map((alert: { id: string }) => alert.id);

    expect(ids[0]).toBe('leads-sin-contactar');
    expect(ids).toContain('mensajes-sin-leer');
    expect(ids).toContain('hilos-con-problema');
  });

  it('reports a partial read instead of pretending everything is calm', async () => {
    supabaseWith({
      messages: { count: 2 },
      x_threads: { error: { message: 'timeout' }, count: 0 },
    });

    const body = await (await GET(request())).json();

    // El resto de los avisos siguen: media lista es mejor que un panel vacío.
    expect(body.alerts.map((alert: { id: string }) => alert.id)).toContain('mensajes-sin-leer');
    expect(body.incomplete).toContain('hilos');
  });

  it('flags a published post whose newsletter never went out', async () => {
    supabaseWith({
      post_publications: { data: [{ post_slug: 'el-post', notify_error: 'SMTP timeout' }], count: 0 },
    });

    const body = await (await GET(request())).json();
    const alert = body.alerts.find((a: { id: string }) => a.id === 'newsletter-sin-enviar');

    expect(alert).toBeDefined();
    expect(alert.severity).toBe('urgent');
  });
});
