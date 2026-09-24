import { describe, expect, it } from 'vitest';

import { lineaDeTiempo } from './linea-de-tiempo';

/**
 * Lo que pasa después de comprar, con fechas.
 *
 * El cliente cargaba su material y la pantalla le decía «Listo» y nada más:
 * pagó y no sabía cuándo iba a tener su sitio. La incertidumbre es lo que
 * hace que alguien escriba «¿y? ¿cómo va?» a los tres días.
 */

const BASE = {
  cobradoAt: '2026-09-24T14:00:00-03:00',
  materialAt: '2026-09-25T10:00:00-03:00',
  plazoMaximo: 7,
  espera: 0,
  locale: 'es' as const,
};

describe('lineaDeTiempo', () => {
  it('lo hecho queda tildado y lo que falta, con fecha', () => {
    const pasos = lineaDeTiempo(BASE);

    expect(pasos.map((p) => p.id)).toEqual(['pago', 'material', 'arranque', 'entrega', 'ajustes', 'garantia']);
    expect(pasos[0].hecho).toBe(true);
    expect(pasos[1].hecho).toBe(true);
    expect(pasos[3].hecho).toBe(false);
  });

  it('la entrega cuenta días hábiles desde lo último que faltaba: el material', () => {
    // Viernes 25/09 + 7 hábiles = martes 06/10.
    const entrega = lineaDeTiempo(BASE).find((p) => p.id === 'entrega')!;

    expect(entrega.fecha).toContain('6 de octubre');
  });

  it('con espera, el arranque se corre y lo dice', () => {
    const arranque = lineaDeTiempo({ ...BASE, espera: 3 }).find((p) => p.id === 'arranque')!;

    expect(arranque.fecha).toContain('30 de septiembre');
  });

  it('sin espera, se arranca ya', () => {
    const arranque = lineaDeTiempo(BASE).find((p) => p.id === 'arranque')!;

    expect(arranque.detalle).toMatch(/ya/i);
  });

  it('en inglés se lee en inglés', () => {
    const entrega = lineaDeTiempo({ ...BASE, locale: 'en' }).find((p) => p.id === 'entrega')!;

    expect(entrega.fecha).toContain('October 6');
  });
});
