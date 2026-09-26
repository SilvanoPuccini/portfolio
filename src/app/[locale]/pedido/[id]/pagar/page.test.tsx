import { beforeEach, expect, it, vi } from 'vitest';
import { isValidElement, type ReactNode } from 'react';
import { paquetePorSlug, totalPedido } from '@/content/servicios';
import { PagoPedido } from '@/components/pedido/PagoPedido';
import Page from './page';
const mocks = vi.hoisted(() => ({ load: vi.fn(), quote: vi.fn() }));
vi.mock('@/lib/leads/cargar-pedido', () => ({ cargarPedidoCompleto: mocks.load, money: String }));
vi.mock('@/lib/leads/exchange-rate', () => ({ quoteFor: mocks.quote }));
vi.mock('@/lib/leads/pedido-pasos', () => ({ redirigirA: () => null }));
function containsPayment(node: ReactNode): boolean {
 if (Array.isArray(node)) return node.some(containsPayment);
 if (!isValidElement<{ children?: ReactNode }>(node)) return false;
 return node.type === PagoPedido || containsPayment(node.props.children);
}
beforeEach(() => vi.clearAllMocks());
it('does not request a zero transfer or exchange quote for an unactivated monthly plan', async () => {
 const pkg = paquetePorSlug('cuidado-basico')!;
 mocks.load.mockResolvedValue({ etapa: 'pago', lead: { pais: null }, paquete: pkg,
  pedido: { id: 'order', total_usd: 0, mensual_usd: 40 }, resumen: totalPedido(pkg, [], []), espera: 0 });
 const page = await Page({ params: Promise.resolve({ locale: 'en', id: 'order' }) });
 expect(containsPayment(page)).toBe(false);
 expect(mocks.quote).not.toHaveBeenCalled();
});
