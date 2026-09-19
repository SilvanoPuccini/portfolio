import { describe, expect, it } from 'vitest';
import { pipelineValue, rowSummary, type LeadRow } from './row-summary';

const NOW = new Date('2026-09-18T15:00:00.000Z');
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 86_400_000).toISOString();
const hoursAgo = (hours: number) => new Date(NOW.getTime() - hours * 3_600_000).toISOString();

function lead(overrides: Partial<LeadRow> = {}): LeadRow {
  return {
    id: 'l1',
    nombre: 'Lucía',
    estado: 'nuevo',
    created_at: daysAgo(1),
    tipo_proyecto: 'Landing',
    monto_presupuestado: null,
    proposal_sent_at: null,
    contract_sent_at: null,
    fecha_llamada: null,
    ...overrides,
  };
}

describe('rowSummary', () => {
  it('a un lead recién entrado no le reclama nada', () => {
    const { line, risk } = rowSummary(lead({ created_at: hoursAgo(3) }), NOW);
    expect(risk).toBe(false);
    expect(line).toContain('Entró');
  });

  it('marca en riesgo un lead sin contactar pasadas las 48 h', () => {
    const { line, risk } = rowSummary(lead({ created_at: daysAgo(3) }), NOW);
    expect(risk).toBe(true);
    expect(line).toContain('Sin contactar');
    expect(line).toContain('3 días');
  });

  it('muestra cuándo es la llamada agendada', () => {
    const { line, risk } = rowSummary(
      lead({ estado: 'llamada_agendada', fecha_llamada: '2026-09-25T14:00:00.000Z' }), NOW,
    );
    expect(risk).toBe(false);
    expect(line).toContain('Llamada');
  });

  it('una propuesta reciente no está en riesgo', () => {
    const { risk } = rowSummary(
      lead({ estado: 'presupuestado', proposal_sent_at: daysAgo(2) }), NOW,
    );
    expect(risk).toBe(false);
  });

  it('a los 5 días la propuesta se enfría', () => {
    // El número es de Silvano: al sexto día el seguimiento llega tarde.
    const { line, risk } = rowSummary(
      lead({ estado: 'presupuestado', proposal_sent_at: daysAgo(9) }), NOW,
    );
    expect(risk).toBe(true);
    expect(line).toContain('sin respuesta');
    expect(line).toContain('9 días');
  });

  it('un no-show reclama desde el primer día', () => {
    const { line, risk } = rowSummary(lead({ estado: 'no_show' }), NOW);
    expect(risk).toBe(true);
    expect(line).toContain('No apareció');
  });

  it('un contrato vencido sin firmar reclama acción', () => {
    const { line, risk } = rowSummary(
      lead({ estado: 'contrato_enviado', contrato_vencido_at: daysAgo(1) }), NOW,
    );
    expect(risk).toBe(true);
    expect(line).toContain('vencido');
  });

  it('una venta ganada pide facturar, no espera', () => {
    const { line, risk } = rowSummary(lead({ estado: 'cerrado' }), NOW);
    expect(risk).toBe(false);
    expect(line).toContain('facturar');
  });

  it('una entrega hecha no reclama nada', () => {
    const { risk } = rowSummary(lead({ estado: 'entregado' }), NOW);
    expect(risk).toBe(false);
  });

  it('una venta perdida no aparece en riesgo', () => {
    // Perder duele, pero no es una tarea pendiente.
    const { risk } = rowSummary(lead({ estado: 'descartado' }), NOW);
    expect(risk).toBe(false);
  });

  it('dice «1 día» y no «1 días»', () => {
    const { line } = rowSummary(lead({ created_at: daysAgo(1).replace('T15', 'T10') }), NOW);
    expect(line).not.toContain('1 días');
  });
});

describe('pipelineValue', () => {
  it('suma solo lo que todavía está en juego', () => {
    const total = pipelineValue([
      lead({ estado: 'presupuestado', monto_presupuestado: 4800 }),
      lead({ estado: 'contrato_enviado', monto_presupuestado: 3200 }),
      // Ya cobrado: dejó de estar en la mesa.
      lead({ estado: 'cerrado', monto_presupuestado: 6400 }),
      // Perdido: nunca estuvo.
      lead({ estado: 'descartado', monto_presupuestado: 9000 }),
    ]);

    expect(total).toBe(8000);
  });

  it('ignora los leads sin monto', () => {
    expect(pipelineValue([lead({ estado: 'nuevo', monto_presupuestado: null })])).toBe(0);
  });

  it('devuelve cero con una lista vacía', () => {
    expect(pipelineValue([])).toBe(0);
  });
});
