/**
 * Qué es un archivo, mirándolo.
 *
 * Todo el camino del contrato firmado declaraba «application/pdf» de memoria:
 * la ruta terminaba en .pdf, el bucket lo guardaba con ese tipo, el correo lo
 * adjuntaba con esa extensión y el endpoint lo servía así. Pero el documento
 * lo genera la librería `docx`, que produce un .docx.
 *
 * El navegador recibía un archivo de Word diciendo que era un PDF y no lo
 * podía abrir: ni desde la página ni desde el correo. El cliente veía «hay un
 * problema con el PDF» sobre un archivo que estaba perfecto — solo estaba mal
 * presentado.
 *
 * Se detecta por los primeros bytes y no por lo que alguien creyó recordar.
 * Un nombre de variable no es una fuente de verdad.
 */

export interface TipoDeArchivo {
  mime: string;
  /** Con el punto, para pegar al final de un nombre. */
  extension: string;
}

const DOCX: TipoDeArchivo = {
  mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  extension: '.docx',
};

const PDF: TipoDeArchivo = { mime: 'application/pdf', extension: '.pdf' };

const DESCONOCIDO: TipoDeArchivo = { mime: 'application/octet-stream', extension: '' };

/**
 * El tipo real de un documento generado por nosotros.
 *
 * Solo distingue los dos que producimos. Un archivo que no es ninguno de los
 * dos se entrega como binario sin nombre inventado: mentirle al navegador es
 * justamente lo que rompía la descarga.
 */
export function tipoDeDocumento(bytes: Buffer | Uint8Array): TipoDeArchivo {
  const b = bytes instanceof Buffer ? bytes : Buffer.from(bytes);

  // «%PDF-»
  if (b.length >= 5 && b.subarray(0, 5).toString('latin1') === '%PDF-') return PDF;

  // Un .docx es un ZIP: «PK\x03\x04». Las otras firmas de ZIP («PK\x05\x06»
  // vacío, «PK\x07\x08» partido) no las produce Packer, pero se aceptan: un
  // ZIP nuestro solo puede ser el documento.
  if (b.length >= 4 && b[0] === 0x50 && b[1] === 0x4b) return DOCX;

  return DESCONOCIDO;
}

/** El nombre con la extensión que de verdad le corresponde. */
export function nombreConExtension(base: string, tipo: TipoDeArchivo): string {
  const limpio = base.replace(/\.(pdf|docx)$/i, '');
  return `${limpio}${tipo.extension}`;
}
