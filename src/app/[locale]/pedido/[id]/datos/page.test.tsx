import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isValidElement, type ReactNode } from 'react';
import { firmarSesion } from '@/lib/leads/acceso-cliente';
import { AccesoGate } from '@/components/pedido/AccesoGate';
import Page from './page';

const state = vi.hoisted(() => ({
  cookie: undefined as string | undefined,
  queries: [] as string[],
  signed: true,
  snapshot: null as unknown,
}));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => state.cookie ? { value: state.cookie } : undefined }) }));
vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('not found'); } }));
vi.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: () => ({ from: (table: string) => ({ select: (columns: string) => {
    state.queries.push(`${table}:${columns}`);
    return { eq: () => ({ maybeSingle: async () => ({ data: table === 'pedidos'
      ? columns === 'configuracion_snapshot'
        ? state.snapshot ? { configuracion_snapshot: state.snapshot } : null
        : { id: 'order-a', paquete: 'landing', extras: [], calificacion: {}, lead_id: 'lead-a' }
      : { contrato_firmado_at: state.signed ? '2026-01-01' : null, kickoff_datos: { secret: 'PRIVATE_MATERIAL' }, kickoff_completado_at: '2026-01-02' } }) }) };
  } }) }),
}));

function payload(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(payload);
  if (isValidElement(node)) return payload(node.props);
  if (node && typeof node === 'object') return Object.fromEntries(Object.entries(node).map(([key, value]) => [key, payload(value)]));
  return node;
}

function findGate(node: ReactNode): Record<string, unknown> | undefined {
  if (Array.isArray(node)) return node.map(findGate).find(Boolean);
  if (!isValidElement<{ children?: ReactNode }>(node)) return;
  if (node.type === AccesoGate) return node.props as Record<string, unknown>;
  return findGate(node.props.children);
}

describe('project materials server authorization', () => {
  afterEach(() => vi.unstubAllEnvs());
  beforeEach(() => {
    vi.stubEnv('ADMIN_SESSION_SECRET', 'test-only-secret');
    state.cookie = undefined;
    state.queries = [];
    state.signed = true;
    state.snapshot = null;
  });

  it.each(['missing', 'forged', 'expired', 'other-order'])('does not load or serialize materials for a %s session', async (session) => {
    if (session === 'forged') state.cookie = 'forged';
    if (session === 'expired') state.cookie = firmarSesion('order-a', 'test-only-secret', new Date(0));
    if (session === 'other-order') state.cookie = firmarSesion('order-b', 'test-only-secret');
    const page = await Page({ params: Promise.resolve({ locale: 'en', id: 'order-a' }) });
    expect(state.queries.some((query) => query.startsWith('leads:'))).toBe(false);
    expect(state.queries).not.toContain('pedidos:configuracion_snapshot');
    const gate = findGate(page);
    expect(gate).toMatchObject({ pedidoId: 'order-a', verificado: false, locale: 'en' });
    expect(gate).not.toHaveProperty('iniciales');
    expect(gate).not.toHaveProperty('plan');
    expect(JSON.stringify(payload(page))).not.toContain('PRIVATE_MATERIAL');
  });

  it('loads saved materials after the server receives the verified order cookie', async () => {
    state.cookie = firmarSesion('order-a', 'test-only-secret');
    state.snapshot = {
      schemaVersion: 1, catalogVersion: '2026-09-27', policyVersion: '2026-09-26',
      createdAt: '2026-09-27T12:00:00.000Z', locale: 'es',
      package: { id: 'landing', label: 'Frozen Landing', description: 'Frozen description', oneTimeUsd: 450, recurringUsd: 0,
        included: ['Frozen scope'], excluded: ['Frozen exclusion'], deliveryDays: 10 },
      extras: [], answers: [], charges: { oneTimeUsd: 450, recurringUsd: 0 }, responsibilities: [],
    };
    const page = await Page({ params: Promise.resolve({ locale: 'es', id: 'order-a' }) });
    expect(findGate(page)).toMatchObject({ verificado: true, iniciales: { secret: 'PRIVATE_MATERIAL' }, yaCompletado: true, locale: 'es' });
    expect(JSON.stringify(payload(page))).toContain('Frozen Landing');
  });

  it('preserves the signed-contract prerequisite for authorized visitors', async () => {
    state.cookie = firmarSesion('order-a', 'test-only-secret');
    state.signed = false;
    const page = await Page({ params: Promise.resolve({ locale: 'es', id: 'order-a' }) });
    expect(findGate(page)).toBeUndefined();
    expect(JSON.stringify(payload(page))).not.toContain('PRIVATE_MATERIAL');
  });
});
