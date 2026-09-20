import { describe, expect, it } from 'vitest';
import {
  keepKnownModules, recommendationInput, recommendationSystemPrompt, type CatalogModule,
} from './recommendation';

const CATALOG: CatalogModule[] = [
  { slug: 'catalogo', label: 'Catálogo de productos', horas_min: 20, horas_max: 30 },
  { slug: 'pagos', label: 'Pasarela de pagos', horas_min: 12, horas_max: 20 },
];

describe('recommendationSystemPrompt', () => {
  it('le pasa el catálogo real con slugs y horas', () => {
    const prompt = recommendationSystemPrompt(CATALOG);

    expect(prompt).toContain('catalogo: Catálogo de productos (20–30 h)');
    expect(prompt).toContain('pagos: Pasarela de pagos');
  });

  it('obliga a decir qué falta en vez de recomendar a ciegas', () => {
    // La regla que evita el error caro: un modelo siempre te da una
    // recomendación, tenga o no con qué sostenerla.
    const prompt = recommendationSystemPrompt(CATALOG);

    expect(prompt).toContain('falta_preguntar');
    expect(prompt.toLowerCase()).toContain('confianza «baja»');
    expect(prompt.toLowerCase()).toContain('no inventes módulos');
  });

  it('pide el alcance más chico ante la duda', () => {
    expect(recommendationSystemPrompt(CATALOG).toLowerCase()).toContain('más chico');
  });

  it('aguanta un catálogo vacío sin romper el prompt', () => {
    expect(recommendationSystemPrompt([])).toContain('(vacío)');
  });
});

describe('recommendationInput', () => {
  it('manda lo que hay y saca lo vacío', () => {
    const input = JSON.parse(recommendationInput({
      formulario: { que_construir: 'Un catálogo', plazo: null, secciones: '' },
      diagnostico: { dolor: 'Pierden pedidos', deseo: undefined },
      huecos: ['Con qué presupuesto se maneja'],
      catalogo: CATALOG,
    }));

    expect(input.formulario).toEqual({ que_construir: 'Un catálogo' });
    expect(input.diagnostico_de_la_llamada).toEqual({ dolor: 'Pierden pedidos' });
    expect(input.huecos_del_formulario).toEqual(['Con qué presupuesto se maneja']);
  });

  it('sin huecos no manda la lista vacía', () => {
    const input = JSON.parse(recommendationInput({
      formulario: {}, diagnostico: {}, huecos: [], catalogo: CATALOG,
    }));

    expect(input.huecos_del_formulario).toBeUndefined();
  });
});

describe('keepKnownModules', () => {
  it('descarta lo que el modelo inventó', () => {
    // «Analítica avanzada» suena bien y no se puede ni cotizar ni construir.
    const kept = keepKnownModules([
      { slug: 'catalogo', porque: 'Necesita mostrar productos' },
      { slug: 'analitica-avanzada', porque: 'Para medir todo' },
    ], CATALOG);

    expect(kept).toEqual([{ slug: 'catalogo', porque: 'Necesita mostrar productos' }]);
  });

  it('sin módulos devuelve la lista vacía', () => {
    expect(keepKnownModules([], CATALOG)).toEqual([]);
  });
});
