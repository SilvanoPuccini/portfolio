import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isValidElement, type ReactNode } from 'react';
import { createRevision } from '@/lib/leads/contract-revision';
import { contratoDeVenta } from '@/content/contrato';
import { paquetePorSlug, totalPedido } from '@/content/servicios';
import { firmarVerificacion } from '@/lib/leads/acceso-cliente';
import { FirmaContrato } from '@/components/pedido/FirmaContrato';
import Page from './page';
const state = vi.hoisted(() => ({ cookie: undefined as string | undefined, load: vi.fn(), rpc: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => ({ value: state.cookie }) }) }));
vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('404'); }, redirect: () => { throw new Error('redirect'); } }));
vi.mock('@/lib/leads/cargar-pedido', () => ({ cargarPedidoCompleto: state.load, money: String }));
vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin: () => ({ rpc: state.rpc }) }));
vi.mock('@/lib/leads/pedido-pasos', () => ({ redirigirA: () => null }));
function propsOf(node: ReactNode): Record<string, unknown> | undefined {
  if (Array.isArray(node)) return node.map(propsOf).find(Boolean);
  if (!isValidElement<{ children?: ReactNode }>(node)) return;
  if (node.type === FirmaContrato) return node.props as Record<string, unknown>;
  return propsOf(node.props.children);
}
const pkg = paquetePorSlug('landing')!;
const frozen = createRevision(contratoDeVenta({ paquete: pkg, extras: [], cliente: { nombre: 'Original Buyer' }, totalUsd: 450, jurisdiccion: 'Original terms' }));
beforeEach(() => {
  vi.clearAllMocks();
  process.env.ADMIN_SESSION_SECRET = 'page-test';
  state.cookie = undefined;
  state.load.mockResolvedValue({ etapa: 'contrato', lead: { nombre: 'Original Buyer', email: 'buyer@example.test', pais: null },
    paquete: { ...pkg, incluye: { es: ['Changed catalog'], en: ['Changed catalog'] } }, pedido: { id: 'order', lead_id: 'lead', total_usd: 450, mensual_usd: 0 }, resumen: totalPedido(pkg, [], []), espera: 0 });
  state.rpc.mockResolvedValue({ data: frozen, error: null });
});
describe('verified contract display', () => {
  it('does not load buyer details or contract tokens before email verification', async () => {
    await Page({ params: Promise.resolve({ locale: 'en', id: 'order' }) });
    expect(state.load).not.toHaveBeenCalled();
    expect(state.rpc).not.toHaveBeenCalled();
  });
  it('shows the stored revision instead of changed catalog clauses', async () => {
    state.cookie = firmarVerificacion('order', 'page-test');
    const page = await Page({ params: Promise.resolve({ locale: 'en', id: 'order' }) });
    expect(propsOf(page)).toMatchObject({ revision: frozen.revision, clausulas: frozen.clausulas, nombreEsperado: 'Original Buyer' });
  });
});
