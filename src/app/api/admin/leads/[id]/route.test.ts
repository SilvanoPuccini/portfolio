import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const state = vi.hoisted(() => ({
  authorized: true,
  queries: [] as string[],
  order: { id: 'order-latest', configuracion_snapshot: null as unknown } as Record<string, unknown> | null,
}));

vi.mock('@/lib/admin-auth', () => ({ isAuthorized: () => state.authorized }));
vi.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: () => ({
    from: (table: string) => ({
      select: (columns: string) => {
        state.queries.push(`${table}:${columns}`);
        const query = {
          eq: () => query,
          order: () => query,
          limit: () => query,
          single: async () => ({ data: { id: 'lead-a', nombre: 'Buyer' }, error: null }),
          maybeSingle: async () => ({ data: state.order, error: null }),
        };
        return query;
      },
    }),
  }),
}));

import { GET } from './route';

const request = () => new NextRequest('http://localhost/api/admin/leads/lead-a');
const params = { params: Promise.resolve({ id: 'lead-a' }) };

const snapshot = {
  schemaVersion: 1,
  catalogVersion: '2026-09-27',
  policyVersion: '2026-09-26',
  createdAt: '2026-09-27T12:00:00.000Z',
  locale: 'es',
  package: { id: 'retired-package', label: 'Frozen label', description: 'Frozen description', oneTimeUsd: 100, recurringUsd: 0,
    included: ['Frozen scope'], excluded: ['Frozen exclusion'], deliveryDays: 5 },
  extras: [], answers: [], charges: { oneTimeUsd: 100, recurringUsd: 0 }, responsibilities: [],
};

beforeEach(() => {
  state.authorized = true;
  state.queries = [];
  state.order = { id: 'order-latest', configuracion_snapshot: null };
});

describe('GET /api/admin/leads/[id] configuration projection', () => {
  it('returns the latest archived snapshot without re-resolving its package slug', async () => {
    state.order = { id: 'order-latest', configuracion_snapshot: snapshot };
    const response = await GET(request(), params);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      lead: {
        pedido_configuracion_order_id: 'order-latest',
        pedido_configuracion_snapshot: { package: { id: 'retired-package', label: 'Frozen label' } },
      },
    });
    expect(state.queries).toContain('pedidos:id, configuracion_snapshot');
  });

  it('represents missing or malformed legacy snapshots as unknown', async () => {
    state.order = { id: 'order-old', configuracion_snapshot: { package: { id: 'current-catalog-only' } } };
    const response = await GET(request(), params);
    expect(await response.json()).toMatchObject({ lead: { pedido_configuracion_order_id: 'order-old', pedido_configuracion_snapshot: null } });
  });

  it('does not read orders or serialize the snapshot to an unauthorized caller', async () => {
    state.authorized = false;
    state.order = { id: 'order-latest', configuracion_snapshot: snapshot };
    const response = await GET(request(), params);
    expect(response.status).toBe(401);
    expect(state.queries).toEqual([]);
    expect(await response.text()).not.toContain('Frozen label');
  });
});
