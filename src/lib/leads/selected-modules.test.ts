import { describe, expect, it } from 'vitest';
import { parseSelectedModules, proposalModules } from './selected-modules';

const OK = [
  { slug: 'catalogo', label: 'Catálogo de productos', horas: 24.4 },
  { slug: 'pagos', label: 'Pagos online', horas: 16 },
];

describe('parseSelectedModules', () => {
  it('devuelve los módulos guardados, con las horas redondeadas', () => {
    expect(parseSelectedModules(OK)).toEqual([
      { slug: 'catalogo', label: 'Catálogo de productos', horas: 24 },
      { slug: 'pagos', label: 'Pagos online', horas: 16 },
    ]);
  });

  it('sin módulos guardados devuelve una lista vacía', () => {
    expect(parseSelectedModules(null)).toEqual([]);
    expect(parseSelectedModules(undefined)).toEqual([]);
    expect(parseSelectedModules('catalogo, pagos')).toEqual([]);
    expect(parseSelectedModules({})).toEqual([]);
  });

  it('descarta la fila rota en vez de meterla en la propuesta', () => {
    // «undefined — NaN h» en un PDF que ve el cliente es peor que no listarlo.
    expect(parseSelectedModules([
      ...OK,
      { slug: 'roto' },
      { slug: 'sin-horas', label: 'Algo', horas: 'muchas' },
      { slug: 'cero', label: 'Otro', horas: 0 },
      null,
    ])).toHaveLength(2);
  });
});

describe('parseSelectedModules con líneas de catálogo', () => {
  const CATALOGO = [
    { slug: 'web-cinco-secciones', label: 'Web de cinco secciones', precioUsd: 790 },
    { slug: 'agenda', label: 'Agenda de turnos', precioUsd: 150 },
  ];

  it('acepta una línea con precio cerrado y sin horas', () => {
    const parsed = parseSelectedModules(CATALOGO);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].precioUsd).toBe(790);
    expect(parsed[0].horas).toBeUndefined();
  });

  it('descarta la fila que no tiene ni horas ni precio', () => {
    expect(parseSelectedModules([{ slug: 'x', label: 'Algo' }])).toEqual([]);
    expect(parseSelectedModules([{ slug: 'x', label: 'Algo', precioUsd: 0 }])).toEqual([]);
  });

  it('una línea puede tener las dos cosas', () => {
    const parsed = parseSelectedModules([{ slug: 'x', label: 'Algo', horas: 10, precioUsd: 300 }]);
    expect(parsed[0]).toMatchObject({ horas: 10, precioUsd: 300 });
  });
});

describe('proposalModules', () => {
  it('deja lo que el documento necesita: nombre y horas', () => {
    expect(proposalModules(OK)).toEqual([
      { label: 'Catálogo de productos', hours: 24 },
      { label: 'Pagos online', hours: 16 },
    ]);
  });
});
