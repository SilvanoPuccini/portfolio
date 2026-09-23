import { describe, expect, it } from 'vitest';

import {
  MAX_COMPROBANTE, extensionDe, motivoLegible, nombreVisible,
  revisarComprobante, rutaDelComprobante,
} from './comprobante';

/**
 * El comprobante de la transferencia.
 *
 * El cliente tocaba «ya transferí» y del otro lado no quedaba nada que mirar.
 * Con el archivo adjunto el aviso llega con la prueba.
 */

const archivo = (over: Partial<{ size: number; type: string; name: string }> = {}) => ({
  size: 120_000, type: 'image/png', name: 'comprobante.png', ...over,
});

describe('revisarComprobante', () => {
  it('acepta la captura del banco', () => {
    expect(revisarComprobante(archivo())).toBeNull();
  });

  it('acepta el PDF que manda el banco', () => {
    expect(revisarComprobante(archivo({ type: 'application/pdf', name: 'x.pdf' }))).toBeNull();
  });

  it('acepta la foto sacada con el teléfono', () => {
    // Un iPhone manda heic y un Android jpeg: los dos son el mismo gesto.
    expect(revisarComprobante(archivo({ type: 'image/heic' }))).toBeNull();
    expect(revisarComprobante(archivo({ type: 'image/jpeg' }))).toBeNull();
  });

  it('rechaza lo que no es un comprobante', () => {
    expect(revisarComprobante(archivo({ type: 'application/zip' }))).toBe('tipo');
    expect(revisarComprobante(archivo({ type: 'text/html' }))).toBe('tipo');
  });

  it('rechaza lo que pesa más que una captura', () => {
    expect(revisarComprobante(archivo({ size: MAX_COMPROBANTE + 1 }))).toBe('pesado');
  });

  it('acepta justo el límite, no uno menos', () => {
    expect(revisarComprobante(archivo({ size: MAX_COMPROBANTE }))).toBeNull();
  });

  it('un archivo vacío no es un archivo', () => {
    expect(revisarComprobante(archivo({ size: 0 }))).toBe('vacio');
    expect(revisarComprobante(null)).toBe('vacio');
  });
});

describe('motivoLegible', () => {
  it('le habla al cliente, no al programador', () => {
    expect(motivoLegible('tipo')).toContain('imagen o un PDF');
    expect(motivoLegible('pesado')).toContain('8 MB');
    expect(motivoLegible('vacio')).toContain('Probá de nuevo');
  });

  it('nunca le muestra un código ni una cantidad de bytes', () => {
    for (const motivo of ['vacio', 'pesado', 'tipo'] as const) {
      expect(motivoLegible(motivo)).not.toMatch(/\d{5,}/);
    }
  });
});

describe('rutaDelComprobante', () => {
  it('guarda cada comprobante bajo su venta y su pedido', () => {
    expect(rutaDelComprobante('lead-1', 'pedido-1', 'foto.png', 'uuid-1'))
      .toBe('lead-1/pedido-1/uuid-1.png');
  });

  it('el nombre del cliente no elige carpeta', () => {
    // «../../otra-carpeta/x.png» escribiría fuera de lo suyo.
    const ruta = rutaDelComprobante('lead-1', 'pedido-1', '../../otra/x.png', 'uuid-1');

    expect(ruta).toBe('lead-1/pedido-1/uuid-1.png');
    expect(ruta).not.toContain('..');
  });

  it('un archivo sin extensión se guarda igual', () => {
    expect(rutaDelComprobante('l', 'p', 'comprobante', 'u')).toBe('l/p/u');
  });

  it('ignora una extensión que no parece una extensión', () => {
    expect(extensionDe('x.esto-no-es-una-extension')).toBe('');
    expect(extensionDe('x.PNG')).toBe('.png');
  });
});

describe('nombreVisible', () => {
  it('saca lo que rompe una ruta de Windows', () => {
    expect(nombreVisible('compro:bante/1*.png')).toBe('compro bante 1 .png');
  });

  it('nunca queda vacío', () => {
    expect(nombreVisible('   ')).toBe('comprobante');
  });
});
