import { describe, expect, it } from 'vitest';

import { diasDeEspera, HORAS_UTILES_POR_DIA, LIBRE_SIN_ESPERA, sumarDiasHabiles } from './capacidad';

/**
 * La agenda que no se prende fuego.
 *
 * Los plazos del contrato valen para un proyecto a la vez. Si entran cinco
 * catálogos con cobro el mismo día, el quinto no se puede entregar en 25 días
 * hábiles por más que se prometa. Lo que llena la agenda no es la cantidad de
 * pedidos sino el trabajo que suman: seis landings no complican, seis
 * automatizaciones sí.
 */

describe('diasDeEspera', () => {
  it('con poca demanda no suma nada: se arranca ya', () => {
    expect(diasDeEspera(0)).toBe(0);
    // Dos landings en curso entran en la semana libre.
    expect(diasDeEspera(30)).toBe(0);
    expect(diasDeEspera(LIBRE_SIN_ESPERA)).toBe(0);
  });

  it('lo que pasa de la semana libre se suma como días de espera', () => {
    expect(diasDeEspera(LIBRE_SIN_ESPERA + 1)).toBe(1);
    expect(diasDeEspera(LIBRE_SIN_ESPERA + HORAS_UTILES_POR_DIA * 3)).toBe(3);
  });

  it('pesa el trabajo, no la cantidad: cuatro catálogos con cobro esperan más que seis landings', () => {
    const seisLandings = diasDeEspera(6 * 15);
    const cuatroCatalogos = diasDeEspera(4 * 40);

    expect(cuatroCatalogos).toBeGreaterThan(seisLandings);
  });

  it('no se rompe con datos raros', () => {
    expect(diasDeEspera(-10)).toBe(0);
    expect(diasDeEspera(Number.NaN)).toBe(0);
  });
});

describe('sumarDiasHabiles', () => {
  it('saltea el fin de semana', () => {
    // Jueves 24/09/2026 + 2 hábiles = lunes 28/09.
    const lunes = sumarDiasHabiles(new Date('2026-09-24T12:00:00-03:00'), 2);
    expect(lunes.getDay()).toBe(1);
    expect(lunes.getDate()).toBe(28);
  });

  it('desde un sábado, el primer hábil es el lunes', () => {
    const lunes = sumarDiasHabiles(new Date('2026-09-26T12:00:00-03:00'), 1);
    expect(lunes.getDate()).toBe(28);
  });
});
