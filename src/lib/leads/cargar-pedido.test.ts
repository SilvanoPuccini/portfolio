import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin: vi.fn() }));
vi.mock('./capacidad', () => ({ esperaDelPedido: vi.fn().mockResolvedValue(0) }));
import { getSupabaseAdmin } from '@/lib/supabase';
import { cargarPedidoCompleto } from './cargar-pedido';
import { revisionFromConfiguration } from './contract-from-configuration';
import type { ConfigurationSnapshot } from '@/lib/order-configuration-snapshot';

const config: ConfigurationSnapshot = {
  schemaVersion: 1, catalogVersion: 'old', policyVersion: 'old', createdAt: '2026-01-01T00:00:00.000Z', locale: 'es',
  package: { id: 'retired-package', label: 'Frozen retired package', description: 'Frozen description',
    oneTimeUsd: 500, recurringUsd: 0, included: ['Frozen scope'], excluded: ['Frozen out of scope'], deliveryDays: 12 },
  extras: [], answers: [], charges: { oneTimeUsd: 500, recurringUsd: 0 }, responsibilities: [],
};
const contract = revisionFromConfiguration(config, { nombre: 'Buyer', localidad: null, pais: 'Argentina' }, 'Argentina');

function setOrder(order: Record<string, unknown>) {
  vi.mocked(getSupabaseAdmin).mockReturnValue({
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: order }) }) }) }),
  } as never);
}

describe('cargarPedidoCompleto archived configuration fallback', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads a frozen order whose package no longer exists in the live catalog', async () => {
    setOrder({ id: 'order', paquete: 'retired-package', extras: [], total_usd: 500, mensual_usd: 0,
      firmado_at: null, lead_id: null, configuracion_snapshot: config,
      contrato_snapshot: contract });
    const result = await cargarPedidoCompleto('order');
    expect(result?.paquete.nombre.es).toBe('Frozen retired package');
    expect(result?.resumen.paquete.incluye.es).toEqual(['Frozen scope']);
    expect(result?.pedido.contrato_snapshot).toEqual(contract);
  });

  it('keeps archived labels, terms and totals when the package still exists but live catalog changed', async () => {
    const existing = { ...config, package: { ...config.package, id: 'web-cinco-secciones', label: 'Archived offer', included: ['Archived only'] },
      extras: [{ id: 'agenda', label: 'Archived add-on', description: 'Original', amountUsd: 100, cadence: 'once' as const }] };
    setOrder({ id: 'order', paquete: 'web-cinco-secciones', extras: ['agenda'], total_usd: 600, mensual_usd: 0,
      firmado_at: null, lead_id: null, configuracion_snapshot: existing });
    const result = await cargarPedidoCompleto('order');
    expect(result?.paquete.nombre.es).toBe('Archived offer');
    expect(result?.paquete.incluye.es).toEqual(['Archived only']);
    expect(result?.resumen.extras[0].label.es).toBe('Archived add-on');
    expect(result?.resumen.totalUsd).toBe(500);
  });

  it('prefers a valid frozen contract when the configuration is malformed and package is retired', async () => {
    setOrder({ id: 'order', paquete: 'retired-package', extras: [], total_usd: 500, mensual_usd: 0,
      firmado_at: null, lead_id: null, configuracion_snapshot: { schemaVersion: 'broken' }, contrato_snapshot: contract });
    const result = await cargarPedidoCompleto('order');
    expect(result?.pedido.contrato_snapshot).toEqual(contract);
    expect(result?.paquete.nombre.es).toContain('Frozen description');
  });

  it('keeps unknown legacy orders unavailable when there is no archive', async () => {
    setOrder({ id: 'order', paquete: 'retired-package', extras: [], total_usd: 500, mensual_usd: 0,
      firmado_at: null, lead_id: null, configuracion_snapshot: null });
    expect(await cargarPedidoCompleto('order')).toBeNull();
  });
});
