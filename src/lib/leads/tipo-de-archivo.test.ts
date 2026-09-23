import { describe, expect, it } from 'vitest';

import { nombreConExtension, tipoDeDocumento } from './tipo-de-archivo';

/**
 * El bug que estos tests existen para que no vuelva.
 *
 * El contrato firmado lo genera la librería `docx`, pero todo el camino lo
 * declaraba «application/pdf»: la ruta, el bucket, el adjunto del correo y el
 * endpoint. El navegador recibía un archivo de Word diciendo que era un PDF y
 * no lo podía abrir. El cliente veía «hay un problema con el PDF» sobre un
 * archivo que estaba sano, solo mal presentado.
 *
 * Un nombre de variable no es una fuente de verdad. Se mira el archivo.
 */

/** Los primeros bytes de un .docx real: es un ZIP. */
const DOCX = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]);
const PDF = Buffer.from('%PDF-1.7\n...');

describe('tipoDeDocumento', () => {
  it('reconoce un .docx por lo que es: un ZIP', () => {
    expect(tipoDeDocumento(DOCX)).toEqual({
      mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      extension: '.docx',
    });
  });

  it('reconoce un PDF de verdad', () => {
    expect(tipoDeDocumento(PDF)).toEqual({ mime: 'application/pdf', extension: '.pdf' });
  });

  it('no llama PDF a lo que no lo es', () => {
    // Es exactamente el error que rompía la descarga.
    expect(tipoDeDocumento(DOCX).mime).not.toBe('application/pdf');
  });

  it('a lo que no reconoce no le inventa un tipo', () => {
    const cualquiera = Buffer.from('esto no es un documento');

    expect(tipoDeDocumento(cualquiera)).toEqual({
      mime: 'application/octet-stream',
      extension: '',
    });
  });

  it('aguanta un archivo vacío o cortado sin romperse', () => {
    expect(tipoDeDocumento(Buffer.alloc(0)).mime).toBe('application/octet-stream');
    expect(tipoDeDocumento(Buffer.from('%PD')).mime).toBe('application/octet-stream');
  });

  it('acepta un Uint8Array, que es lo que devuelven las APIs del navegador', () => {
    expect(tipoDeDocumento(new Uint8Array(DOCX)).extension).toBe('.docx');
  });
});

describe('nombreConExtension', () => {
  it('le pone la extensión que de verdad le toca', () => {
    expect(nombreConExtension('Contrato Estefanía', tipoDeDocumento(DOCX)))
      .toBe('Contrato Estefanía.docx');
  });

  it('corrige la extensión equivocada en vez de sumarle otra', () => {
    // «Contrato.pdf» de un .docx no puede quedar «Contrato.pdf.docx».
    expect(nombreConExtension('Contrato.pdf', tipoDeDocumento(DOCX)))
      .toBe('Contrato.docx');
  });

  it('no toca la que ya está bien', () => {
    expect(nombreConExtension('Contrato.docx', tipoDeDocumento(DOCX))).toBe('Contrato.docx');
    expect(nombreConExtension('Contrato.pdf', tipoDeDocumento(PDF))).toBe('Contrato.pdf');
  });

  it('con un tipo desconocido no agrega nada', () => {
    expect(nombreConExtension('Contrato', tipoDeDocumento(Buffer.from('x')))).toBe('Contrato');
  });
});
