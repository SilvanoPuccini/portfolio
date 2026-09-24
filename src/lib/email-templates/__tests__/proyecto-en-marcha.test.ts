import { describe, expect, it } from 'vitest';

import { proyectoEnMarchaHtml } from '../proyecto-en-marcha';
import { lineaDeTiempo } from '@/lib/leads/linea-de-tiempo';

/**
 * El cliente tocaba «terminé» y no le llegaba nada. Si cerraba la pestaña,
 * no tenía cómo volver a su pedido.
 */

const html = proyectoEnMarchaHtml({
  nombre: 'Nutrición Infantil',
  paquete: 'Landing',
  urlPedido: 'https://silvanopuccini.dev/es/pedido/p1/listo',
  pasos: lineaDeTiempo({
    cobradoAt: '2026-09-24T14:00:00-03:00',
    materialAt: '2026-09-25T10:00:00-03:00',
    plazoMaximo: 10,
    espera: 0,
    locale: 'es',
  }),
});

describe('proyectoEnMarchaHtml', () => {
  it('agradece y dice qué compró', () => {
    expect(html).toContain('¡Gracias, Nutrición! Tu Landing ya está en marcha');
  });

  it('dice cuándo se entrega', () => {
    expect(html).toMatch(/hasta el .* de octubre/);
  });

  it('trae el camino de vuelta a su pedido', () => {
    expect(html).toContain('https://silvanopuccini.dev/es/pedido/p1/listo');
    expect(html).toContain('Ver mi pedido');
  });
});
