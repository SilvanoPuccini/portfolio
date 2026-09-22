import { describe, expect, it } from 'vitest';

import { etapaDelPedido } from './etapa-pedido';

const pedido = { firmado_at: null as string | null, lead_id: null as string | null };
const lead = {
  estado: 'contrato_enviado',
  contrato_firma_token: 'tok',
  contrato_firmado_at: null as string | null,
  pago_estado: null as string | null,
};

describe('etapaDelPedido', () => {
  it('sin datos del cliente, lo primero es pedirlos', () => {
    expect(etapaDelPedido(pedido, null)).toBe('datos');
  });

  it('con el contrato creado y sin firmar, se firma', () => {
    expect(etapaDelPedido({ ...pedido, lead_id: 'l1' }, lead)).toBe('firma');
  });

  it('firmado, toca pagar', () => {
    expect(etapaDelPedido(
      { ...pedido, lead_id: 'l1', firmado_at: '2026-09-22T10:00:00Z' },
      { ...lead, contrato_firmado_at: '2026-09-22T10:00:00Z' },
    )).toBe('pago');
  });

  it('la firma del lead alcanza aunque el pedido no esté marcado', () => {
    // El webhook puede marcar una cosa y no la otra: lo que vale es que la
    // firma exista, no dónde quedó anotada.
    expect(etapaDelPedido({ ...pedido, lead_id: 'l1' }, { ...lead, contrato_firmado_at: 'ya' }))
      .toBe('pago');
  });

  it('con el pago informado, espera la confirmación', () => {
    expect(etapaDelPedido(
      { ...pedido, lead_id: 'l1', firmado_at: 'ya' },
      { ...lead, contrato_firmado_at: 'ya', pago_estado: 'informado' },
    )).toBe('esperando');
  });

  it('con el pago confirmado, el circuito terminó', () => {
    for (const estado of ['cerrado', 'facturado', 'entregado']) {
      expect(etapaDelPedido(
        { ...pedido, lead_id: 'l1', firmado_at: 'ya' },
        { ...lead, estado, contrato_firmado_at: 'ya' },
      )).toBe('listo');
    }
  });

  it('el pago confirmado a mano también cierra', () => {
    expect(etapaDelPedido(
      { ...pedido, lead_id: 'l1', firmado_at: 'ya' },
      { ...lead, contrato_firmado_at: 'ya', pago_estado: 'pagado' },
    )).toBe('listo');
  });

  it('un pedido con lead pero sin contrato vuelve a pedir los datos', () => {
    expect(etapaDelPedido({ ...pedido, lead_id: 'l1' }, { ...lead, contrato_firma_token: null }))
      .toBe('datos');
  });
});
