import { describe, expect, it } from 'vitest';
import {
  advanceOn, isKnownState, isManualEvent, phaseIndex, PIPELINE,
  type LeadEvent, type LeadState,
} from './pipeline';

describe('PIPELINE', () => {
  it('keeps the states the CRM already used', () => {
    // Nada de renombrar por gusto: las filas vivas quedarían huérfanas.
    for (const existing of ['nuevo', 'llamada_agendada', 'en conversación', 'presupuestado', 'cerrado'] as LeadState[]) {
      expect(PIPELINE).toContain(existing);
    }
  });

  it('runs from first contact to delivery', () => {
    expect(PIPELINE[0]).toBe('nuevo');
    expect(PIPELINE.at(-1)).toBe('entregado');
  });
});

describe('phaseIndex', () => {
  it('orders the pipeline forward', () => {
    expect(phaseIndex('nuevo')).toBeLessThan(phaseIndex('presupuestado'));
    expect(phaseIndex('presupuestado')).toBeLessThan(phaseIndex('cerrado'));
    expect(phaseIndex('cerrado')).toBeLessThan(phaseIndex('entregado'));
  });

  it('puts the dead ends outside the line', () => {
    // no_show y descartado no son "más adelante" que nada: son salidas.
    expect(phaseIndex('no_show')).toBe(-1);
    expect(phaseIndex('descartado')).toBe(-1);
  });
});

describe('advanceOn', () => {
  const cases: [LeadEvent, LeadState][] = [
    ['propuesta_enviada', 'presupuestado'],
    ['contrato_enviado', 'contrato_enviado'],
    ['pago_recibido', 'cerrado'],
    ['facturado', 'facturado'],
    ['entregado', 'entregado'],
  ];

  it.each(cases)('%s moves the lead to %s', (event, expected) => {
    expect(advanceOn(event, 'nuevo')).toBe(expected);
  });

  it('never walks backwards', () => {
    // Un webhook repetido o fuera de orden no puede rebobinar una venta ya
    // cobrada. Es el caso que hace que los estados dejen de ser confiables.
    expect(advanceOn('propuesta_enviada', 'cerrado')).toBeNull();
    expect(advanceOn('contrato_enviado', 'facturado')).toBeNull();
  });

  it('does nothing when the lead is already there', () => {
    expect(advanceOn('pago_recibido', 'cerrado')).toBeNull();
  });

  it('refuses to revive a discarded lead', () => {
    // Si lo descartaste, un pago tardío o un weblook demorado no lo resucita
    // a tus espaldas: eso lo decidís vos a mano.
    expect(advanceOn('pago_recibido', 'descartado')).toBeNull();
    expect(advanceOn('propuesta_enviada', 'descartado')).toBeNull();
  });

  it('lets a no-show move forward again: it is a detour, not an end', () => {
    expect(advanceOn('propuesta_enviada', 'no_show')).toBe('presupuestado');
  });

  it('treats an unknown state as a starting point rather than crashing', () => {
    // La columna es `text` libre: puede haber filas con cualquier cosa.
    expect(advanceOn('pago_recibido', 'cualquier-cosa' as LeadState)).toBe('cerrado');
  });
});

describe('isKnownState', () => {
  it('accepts every pipeline state and both dead ends', () => {
    expect(isKnownState('nuevo')).toBe(true);
    expect(isKnownState('entregado')).toBe(true);
    expect(isKnownState('descartado')).toBe(true);
    expect(isKnownState('no_show')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isKnownState('inventado')).toBe(false);
    expect(isKnownState('')).toBe(false);
  });
});

describe('contrato firmado', () => {
  it('se ubica entre el envío del contrato y el cobro', () => {
    expect(phaseIndex('contrato_enviado')).toBeLessThan(phaseIndex('contrato_firmado'));
    expect(phaseIndex('contrato_firmado')).toBeLessThan(phaseIndex('cerrado'));
  });

  it('avanza desde el contrato enviado', () => {
    expect(advanceOn('contrato_firmado', 'contrato_enviado')).toBe('contrato_firmado');
  });

  it('no rebobina una venta ya cobrada', () => {
    expect(advanceOn('contrato_firmado', 'cerrado')).toBeNull();
  });
});

describe('MANUAL_EVENTS', () => {
  it('deja afuera los hechos que dispara un correo real', () => {
    // Marcarlos a mano volvería a separar lo que pasó de lo que el panel
    // cree que pasó: justo el problema que el pipeline vino a cerrar.
    expect(isManualEvent('propuesta_enviada')).toBe(false);
    expect(isManualEvent('contrato_enviado')).toBe(false);
  });

  it('acepta los que sí decide una persona', () => {
    expect(isManualEvent('contrato_firmado')).toBe(true);
    expect(isManualEvent('pago_recibido')).toBe(true);
    expect(isManualEvent('facturado')).toBe(true);
    expect(isManualEvent('entregado')).toBe(true);
  });

  it('rechaza cualquier otra cosa', () => {
    expect(isManualEvent('inventado')).toBe(false);
  });
});
