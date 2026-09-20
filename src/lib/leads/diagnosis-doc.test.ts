import { describe, expect, it } from 'vitest';
import { buildDiagnosisDoc } from './diagnosis-doc';

const NOW = new Date('2026-09-21T15:00:00.000Z');

const LEAD = {
  nombre: 'Ferrelon',
  monto_presupuestado: 4800,
  horas_calculadas: 120,
  modulos_seleccionados: [
    { slug: 'catalogo', label: 'Catálogo de productos', horas: 24 },
    { slug: 'pagos', label: 'Pagos online', horas: 16 },
  ],
  recomendacion: {
    problema: 'Pierden pedidos porque el stock vive en dos cabezas',
    solucion: 'Catálogo con stock en vivo',
    modulos: [{ slug: 'catalogo', porque: 'Es lo que resuelve el problema' }],
    no_ofrecer: [{ que: 'App para celular', porque: 'No la pidió y duplica el costo' }],
    objeciones: [{ objecion: 'Es caro', respuesta: 'Compararlo con lo que pierden' }],
  },
};

describe('buildDiagnosisDoc', () => {
  it('sin presupuesto no hay documento', () => {
    // Un diagnóstico sin precio es una carta de intención: no se manda.
    expect(buildDiagnosisDoc({}, NOW)).toBeNull();
    expect(buildDiagnosisDoc({ monto_presupuestado: 0 }, NOW)).toBeNull();
  });

  it('arma el documento con el problema, la solución y lo que incluye', () => {
    const doc = buildDiagnosisDoc(LEAD, NOW)!;

    expect(doc.cliente).toBe('Ferrelon');
    expect(doc.problema).toContain('Pierden pedidos');
    expect(doc.solucion).toBe('Catálogo con stock en vivo');
    expect(doc.incluye).toEqual([
      { titulo: 'Catálogo de productos', detalle: 'Es lo que resuelve el problema', horas: 24 },
      { titulo: 'Pagos online', detalle: undefined, horas: 16 },
    ]);
  });

  it('NUNCA le manda al cliente las notas internas', () => {
    // «No le ofrezcas X porque no lo pidió» y las objeciones previstas están
    // escritas para Silvano. Mandárselas es adjuntar las notas de la reunión.
    const json = JSON.stringify(buildDiagnosisDoc(LEAD, NOW));

    expect(json).not.toContain('No la pidió');
    expect(json).not.toContain('objecion');
    expect(json).not.toContain('Compararlo con lo que pierden');
  });

  it('lo que no entra ahora queda como «más adelante», sin el motivo', () => {
    expect(buildDiagnosisDoc(LEAD, NOW)!.masAdelante).toEqual(['App para celular']);
  });

  it('calcula la seña sugerida y el saldo', () => {
    const { inversion } = buildDiagnosisDoc(LEAD, NOW)!;

    expect(inversion).toEqual({ total: 4800, sena: 2400, saldo: 2400, pct: 50 });
  });

  it('respeta la seña acordada por encima de la sugerida', () => {
    const { inversion } = buildDiagnosisDoc({ ...LEAD, sena_pct: 30 }, NOW)!;

    expect(inversion).toMatchObject({ sena: 1440, saldo: 3360, pct: 30 });
  });

  it('en un pago único no queda saldo', () => {
    const { inversion } = buildDiagnosisDoc({ ...LEAD, pago_unico: true }, NOW)!;

    expect(inversion).toMatchObject({ total: 4800, sena: 4800, saldo: 0, pct: 100 });
  });

  it('sin recomendación de IA usa lo anotado en la llamada', () => {
    const doc = buildDiagnosisDoc({
      ...LEAD,
      recomendacion: null,
      diagnostico_dolor: '¿Cuánto te cuesta eso por mes?\nPierden 3 pedidos por semana',
      diagnostico_requerimiento: '¿Qué es lo mínimo?\nUn catálogo con stock',
    }, NOW)!;

    // Se queda con la respuesta, no con la pregunta: el cliente no necesita
    // leer el interrogatorio.
    expect(doc.problema).toBe('Pierden 3 pedidos por semana');
    expect(doc.solucion).toBe('Un catálogo con stock');
  });

  it('muestra el mantenimiento solo si se acordó', () => {
    expect(buildDiagnosisDoc(LEAD, NOW)!.mantenimiento).toBeNull();
    expect(buildDiagnosisDoc({ ...LEAD, mantenimiento_mensual: 60 }, NOW)!.mantenimiento).toBe(60);
  });

  it('un presupuesto sin módulos guardados no inventa contenido', () => {
    expect(buildDiagnosisDoc({ ...LEAD, modulos_seleccionados: null }, NOW)!.incluye).toEqual([]);
  });
});
