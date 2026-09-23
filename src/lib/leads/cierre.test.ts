import { describe, expect, it } from 'vitest';

import { pasosDelCierre } from './cierre';

const base = {
  estado: 'presupuestado',
  monto_presupuestado: 940,
  proposal_sent_at: null as string | null,
  contract_sent_at: null as string | null,
  contrato_firmado_at: null as string | null,
  pago_estado: null as string | null,
  cobrado_at: null as string | null,
  factura_numero: null as string | null,
};

const ids = (lead: typeof base) => pasosDelCierre(lead).map((p) => p.id);
const estadoDe = (lead: typeof base, id: string) =>
  pasosDelCierre(lead).find((p) => p.id === id)?.estado;

describe('los pasos del cierre', () => {
  it('son los cuatro del circuito, siempre en el mismo orden', () => {
    expect(ids(base)).toEqual(['propuesta', 'contrato', 'pago', 'factura']);
  });

  it('sin presupuesto no se puede hacer nada todavía', () => {
    const sinPresupuesto = { ...base, monto_presupuestado: null };
    expect(pasosDelCierre(sinPresupuesto).every((p) => p.estado === 'bloqueado')).toBe(true);
  });

  it('con presupuesto, el primero es el que toca', () => {
    expect(estadoDe(base, 'propuesta')).toBe('toca');
    expect(estadoDe(base, 'contrato')).toBe('espera');
  });

  it('mandada la propuesta, toca el contrato', () => {
    const lead = { ...base, proposal_sent_at: '2026-09-22T10:00:00Z' };
    expect(estadoDe(lead, 'propuesta')).toBe('hecho');
    expect(estadoDe(lead, 'contrato')).toBe('toca');
  });

  it('firmado el contrato, toca el pago', () => {
    const lead = { ...base, proposal_sent_at: 'ya', contrato_firmado_at: 'ya' };
    expect(estadoDe(lead, 'contrato')).toBe('hecho');
    expect(estadoDe(lead, 'pago')).toBe('toca');
  });

  it('el pago informado por el cliente se ve distinto de un pago cobrado', () => {
    const informado = { ...base, proposal_sent_at: 'ya', contrato_firmado_at: 'ya', pago_estado: 'informado' };
    expect(estadoDe(informado, 'pago')).toBe('revisar');

    const cobrado = { ...informado, pago_estado: 'pagado', estado: 'cerrado' };
    expect(estadoDe(cobrado, 'pago')).toBe('hecho');
  });

  it('cobrado, lo que queda es facturar', () => {
    const lead = { ...base, estado: 'cerrado', proposal_sent_at: 'ya', contrato_firmado_at: 'ya' };
    expect(estadoDe(lead, 'factura')).toBe('toca');
  });

  it('con la factura emitida, el cierre terminó', () => {
    const lead = {
      ...base, estado: 'facturado', proposal_sent_at: 'ya',
      contrato_firmado_at: 'ya', factura_numero: 'A-0001-00000123',
    };
    expect(pasosDelCierre(lead).every((p) => p.estado === 'hecho')).toBe(true);
  });

  it('solo un paso puede ser el que toca: si no, no es una guía', () => {
    for (const lead of [
      base,
      { ...base, proposal_sent_at: 'ya' },
      { ...base, proposal_sent_at: 'ya', contrato_firmado_at: 'ya' },
      { ...base, estado: 'cerrado', proposal_sent_at: 'ya', contrato_firmado_at: 'ya' },
    ]) {
      expect(pasosDelCierre(lead).filter((p) => p.estado === 'toca')).toHaveLength(1);
    }
  });
});
