import { describe, expect, it } from 'vitest';

import { etapaDelPedido } from './etapa-pedido';

const pedido = { firmado_at: null as string | null, lead_id: null as string | null };
const lead = {
  estado: 'contrato_enviado',
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

  /**
   * La etapa la define la venta, no un token de un tercero.
   *
   * Cuando la firma se hacía con Documenso, `contrato_firma_token` era la
   * prueba de que había un contrato listo, y sin él la etapa volvía a
   * «datos». Desde que se firma en nuestro sitio ese campo queda null para
   * siempre: el cliente firmaba, la página recargaba, no encontraba token y
   * lo devolvía al primer paso —con el botón del contrato otra vez habilitado
   * y el pago inalcanzable— por más que hubiera firmado.
   *
   * El campo salió del tipo para que nadie lo vuelva a poner en el camino. El
   * contrato se arma del catálogo: si la venta existe, hay qué firmar.
   */
  it('un pedido sin venta todavía pide los datos', () => {
    // Nadie dejó nombre ni correo: no hay a quién ponerle el contrato.
    expect(etapaDelPedido({ ...pedido, lead_id: null }, lead)).toBe('datos');
    expect(etapaDelPedido({ ...pedido, lead_id: 'l1' }, null)).toBe('datos');
  });

  it('con la venta creada hay contrato que firmar, venga de donde venga', () => {
    expect(etapaDelPedido({ ...pedido, lead_id: 'l1' }, lead)).toBe('firma');
  });
});
