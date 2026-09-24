import { describe, expect, it } from 'vitest';

import {
  MAX_COMPROBANTE, extensionDe, motivoLegible, nombreVisible,
  revisarComprobante, rutaDelComprobante, tipoReal,
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

describe('tipoReal — el tipo se mira en los bytes, no en lo que dice el navegador', () => {
  const bytes = (...partes: (number[] | string)[]) =>
    Buffer.concat(partes.map((p) => (typeof p === 'string' ? Buffer.from(p, 'latin1') : Buffer.from(p))));

  it('reconoce PNG, JPG, WEBP, PDF, AVIF y HEIC', () => {
    expect(tipoReal(bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 'resto'))?.mime).toBe('image/png');
    expect(tipoReal(bytes([0xff, 0xd8, 0xff, 0xe0], 'resto'))?.mime).toBe('image/jpeg');
    expect(tipoReal(bytes('RIFF', [0, 0, 0, 0], 'WEBPVP8 '))?.mime).toBe('image/webp');
    expect(tipoReal(bytes('%PDF-1.7\n'))?.mime).toBe('application/pdf');
    expect(tipoReal(bytes([0, 0, 0, 0x1c], 'ftypavif', 'resto'))?.mime).toBe('image/avif');
    expect(tipoReal(bytes([0, 0, 0, 0x18], 'ftypheic', 'resto'))?.mime).toBe('image/heic');
  });

  it('rechaza un HTML que dice ser una imagen', () => {
    expect(tipoReal(bytes('<!doctype html><script>alert(1)</script>'))).toBeNull();
  });

  it('rechaza un SVG, que puede llevar scripts adentro', () => {
    expect(tipoReal(bytes('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'))).toBeNull();
  });

  it('rechaza un ejecutable y un ZIP', () => {
    expect(tipoReal(bytes('MZ', [0x90, 0, 3, 0]))).toBeNull();
    expect(tipoReal(bytes([0x50, 0x4b, 0x03, 0x04], 'resto'))).toBeNull();
  });

  it('la extensión la pone el tipo real, no el nombre que mandaron', () => {
    expect(tipoReal(bytes('%PDF-1.4'))?.extension).toBe('.pdf');
  });
});
