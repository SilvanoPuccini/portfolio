import { describe, expect, it } from 'vitest';
import { clienteSummary, diagnosticoSummary, llamadaSummary, ventaSummary } from './sheet-summary';

describe('clienteSummary', () => {
  it('resume lo que pidió y avisa cuánto falta', () => {
    const line = clienteSummary({
      que_construir: 'Un catálogo con stock', presupuesto_rango: 'USD 300-800',
    });

    expect(line).toContain('Un catálogo con stock');
    expect(line).toContain('USD 300-800');
    expect(line).toMatch(/faltan \d+ datos/);
  });

  it('cae en el problema si no dijo qué construir', () => {
    expect(clienteSummary({ problema: 'Pierde pedidos por WhatsApp' })).toContain('Pierde pedidos');
  });

  it('corta los textos largos: es una línea, no un párrafo', () => {
    const line = clienteSummary({ que_construir: 'x'.repeat(200) });
    expect(line.length).toBeLessThan(120);
  });

  it('lo dice cuando no hay nada', () => {
    expect(clienteSummary({})).toContain('Todavía no contestó');
  });
});

describe('llamadaSummary', () => {
  it('sin anotar, lo dice', () => {
    expect(llamadaSummary({})).toContain('Sin anotar');
  });

  it('cuenta preguntas y calificación', () => {
    const line = llamadaSummary({ 'problema.donde': 'Se pierden pedidos' });

    expect(line).toMatch(/1 de \d+ preguntas/);
    expect(line).toContain('califica 1/7');
  });

  it('avisa cuando la venta no se sostiene', () => {
    expect(llamadaSummary({ 'problema.donde': 'algo' })).toContain('le falta para sostenerse');
  });

  it('deja de avisar cuando califica', () => {
    const line = llamadaSummary({
      'problema.donde': 'a', 'problema.costo': 'b', 'problema.porque_ahora': 'c',
      'decision.quien': 'd', 'plata.rango': 'e',
    });

    expect(line).toContain('califica 5/7');
    expect(line).not.toContain('le falta');
  });
});

describe('diagnosticoSummary', () => {
  it('sin presupuesto lo dice', () => {
    expect(diagnosticoSummary({})).toBe('Sin presupuesto guardado');
  });

  it('resume monto, horas y módulos', () => {
    expect(diagnosticoSummary({
      monto_presupuestado: 3200, horas_calculadas: 80,
      modulos_seleccionados: [{ slug: 'catalogo', label: 'Catálogo', horas: 24 }],
    })).toBe('USD 3.200 · 80 h · 1 módulos');
  });

  it('avisa cuando hay precio pero nadie guardó el alcance', () => {
    // Esa propuesta sale sin módulos: es el bug que ya nos costó caro.
    expect(diagnosticoSummary({ monto_presupuestado: 3200, horas_calculadas: 80 }))
      .toContain('sin módulos cargados');
  });
});

describe('ventaSummary', () => {
  it('muestra la etapa y lo que hay en juego', () => {
    expect(ventaSummary({ estado: 'presupuestado', monto_presupuestado: 4800 }))
      .toBe('Propuesta enviada · USD 4.800 en juego');
  });

  it('la respuesta del cliente manda sobre el monto', () => {
    expect(ventaSummary({ estado: 'presupuestado', propuesta_respuesta: 'rechazada', monto_presupuestado: 4800 }))
      .toContain('dijo que no');
    expect(ventaSummary({ estado: 'contrato_enviado', propuesta_respuesta: 'aceptada' }))
      .toContain('aceptó la propuesta');
  });

  it('sin monto muestra solo la etapa', () => {
    expect(ventaSummary({ estado: 'nuevo' })).toBe('Nuevo');
  });
});
