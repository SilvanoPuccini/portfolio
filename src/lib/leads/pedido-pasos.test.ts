import { describe, expect, it } from 'vitest';

import { PASOS, avanceDelPaso, pasoDeEtapa, redirigirA, rutaDelPaso } from './pedido-pasos';
import type { EtapaPedido } from './etapa-pedido';

/**
 * Una dirección por paso.
 *
 * El circuito entero vivía en una sola URL que cambiaba de contenido. El
 * cliente tocaba «atrás» y el navegador lo sacaba del pedido, porque no había
 * paso anterior al que volver: probando la compra eso terminó en «se perdió
 * la página, chao, desapareció».
 */

describe('pasoDeEtapa', () => {
  it('cada etapa cae en su paso', () => {
    expect(pasoDeEtapa('datos')).toBe('resumen');
    expect(pasoDeEtapa('firma')).toBe('firmar');
    expect(pasoDeEtapa('pago')).toBe('pagar');
    expect(pasoDeEtapa('listo')).toBe('listo');
  });

  it('el que ya avisó que transfirió sigue en el paso del pago', () => {
    // No es un paso aparte: mandarlo a una pantalla nueva sería llevarlo a
    // otro lado para decirle que no hay nada que hacer.
    expect(pasoDeEtapa('esperando')).toBe('pagar');
  });

  it('ninguna etapa queda sin paso', () => {
    const etapas: EtapaPedido[] = ['datos', 'firma', 'pago', 'esperando', 'listo'];

    for (const etapa of etapas) {
      expect(PASOS.some((p) => p.paso === pasoDeEtapa(etapa))).toBe(true);
    }
  });
});

describe('rutaDelPaso', () => {
  it('el primer paso vive en la raíz: es por donde se entra', () => {
    expect(rutaDelPaso('es', 'abc', 'resumen')).toBe('/es/pedido/abc');
  });

  it('cada paso tiene su dirección, que se puede guardar y compartir', () => {
    expect(rutaDelPaso('es', 'abc', 'firmar')).toBe('/es/pedido/abc/firmar');
    expect(rutaDelPaso('es', 'abc', 'pagar')).toBe('/es/pedido/abc/pagar');
    expect(rutaDelPaso('es', 'abc', 'listo')).toBe('/es/pedido/abc/listo');
  });

  it('respeta el idioma en el que compró', () => {
    expect(rutaDelPaso('en', 'abc', 'pagar')).toBe('/en/pedido/abc/pagar');
  });
});

describe('redirigirA', () => {
  it('lo deja quieto si ya está donde corresponde', () => {
    expect(redirigirA('firma', 'firmar', 'es', 'abc')).toBeNull();
    expect(redirigirA('esperando', 'pagar', 'es', 'abc')).toBeNull();
  });

  it('no deja llegar al pago sin haber firmado', () => {
    // Escribir la dirección a mano no puede saltear el contrato.
    expect(redirigirA('firma', 'pagar', 'es', 'abc')).toBe('/es/pedido/abc/firmar');
  });

  it('no vuelve a mostrar el contrato de algo ya firmado', () => {
    expect(redirigirA('pago', 'firmar', 'es', 'abc')).toBe('/es/pedido/abc/pagar');
  });

  it('el link viejo de un pedido terminado lleva a donde terminó', () => {
    expect(redirigirA('listo', 'resumen', 'es', 'abc')).toBe('/es/pedido/abc/listo');
  });

  it('al que todavía no dejó sus datos lo manda a la raíz', () => {
    expect(redirigirA('datos', 'firmar', 'es', 'abc')).toBe('/es/pedido/abc');
  });
});

describe('avanceDelPaso', () => {
  it('numera los pasos desde uno, como los lee una persona', () => {
    expect(avanceDelPaso('resumen')).toEqual({ numero: 1, total: 4 });
    expect(avanceDelPaso('listo')).toEqual({ numero: 4, total: 4 });
  });

  it('el total es el largo de la lista y no un número escrito a mano', () => {
    expect(avanceDelPaso('firmar').total).toBe(PASOS.length);
  });
});
