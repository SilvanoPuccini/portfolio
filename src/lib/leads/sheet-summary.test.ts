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

  /**
   * El renglón y el semáforo de adentro tienen que decir lo mismo.
   *
   * El resumen contaba solo lo anotado en la llamada, así que una venta con
   * el cuestionario contestado se anunciaba como «califica 0/7 · le falta
   * para sostenerse» y adentro el semáforo mostraba 3/7. Dos números sobre lo
   * mismo, y el de afuera es el que se lee sin abrir.
   */
  it('cuenta también lo que el cliente contestó por escrito', () => {
    const line = llamadaSummary(
      { 'problema.donde': 'Se pierden pedidos' },
      { 'plata.rango': 'Entre 1500 y 2500', 'plata.cuando': 'Antes del verano' },
    );

    expect(line).toContain('califica 3/7');
  });

  it('no avisa que se enfría una venta que ya tiene lo suyo contestado', () => {
    const line = llamadaSummary(
      { 'problema.donde': 'Se pierden pedidos' },
      {
        'plata.rango': 'Entre 1500 y 2500',
        'plata.cuando': 'Antes del verano',
        'decision.quien': 'Lo decido con mi socio',
        'problema.costo': 'Dos horas por día',
      },
    );

    expect(line).not.toContain('le falta para sostenerse');
  });

  it('sigue diciendo «sin anotar» aunque haya contestado por escrito', () => {
    // La guía todavía no se tocó: el renglón habla del avance de la llamada.
    expect(llamadaSummary({}, { 'plata.rango': 'Entre 1500 y 2500' })).toContain('Sin anotar');
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
