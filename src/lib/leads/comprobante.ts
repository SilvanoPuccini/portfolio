/**
 * El comprobante de la transferencia.
 *
 * Hasta acá el cliente tocaba «ya transferí» y del otro lado no quedaba nada
 * que mirar: había que ir al banco, buscar el movimiento y adivinar cuál era.
 * Esa es la traba real del cobro, no el botón.
 *
 * Con el archivo adjunto el circuito cierra: el aviso llega con la prueba, se
 * puede verificar en el momento y el cliente sabe que mandó algo, no que
 * apretó un botón y quedó esperando.
 */

/** Lo que puede ser un comprobante: una captura o el PDF del banco. */
export const TIPOS_COMPROBANTE = new Set([
  'image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/heic',
  'application/pdf',
]);

/**
 * Ocho megas. Un comprobante es una captura de pantalla o una hoja de PDF;
 * lo que pesa más que eso no es un comprobante, es otra cosa.
 */
export const MAX_COMPROBANTE = 8 * 1024 * 1024;

export type RechazoComprobante = 'vacio' | 'pesado' | 'tipo';

export interface ArchivoEntrante {
  size: number;
  type: string;
  name: string;
}

/** Por qué no se acepta, o `null` si está bien. */
export function revisarComprobante(archivo: ArchivoEntrante | null): RechazoComprobante | null {
  if (!archivo || archivo.size === 0) return 'vacio';
  if (archivo.size > MAX_COMPROBANTE) return 'pesado';
  if (!TIPOS_COMPROBANTE.has(archivo.type)) return 'tipo';
  return null;
}

/** Lo que se le dice al cliente. Nunca un código ni un número de bytes. */
export function motivoLegible(rechazo: RechazoComprobante): string {
  switch (rechazo) {
    case 'vacio': return 'No llegó ningún archivo. Probá de nuevo.';
    case 'pesado': return 'El comprobante supera los 8 MB. Mandá una captura o el PDF del banco.';
    case 'tipo': return 'Tiene que ser una imagen o un PDF: la captura o el comprobante del banco.';
  }
}

/** Solo la extensión, en minúscula y sin rarezas. */
export function extensionDe(nombre: string): string {
  const punto = nombre.lastIndexOf('.');
  if (punto < 0) return '';
  const ext = nombre.slice(punto + 1).toLowerCase();
  return /^[a-z0-9]{1,5}$/.test(ext) ? `.${ext}` : '';
}

/**
 * Dónde se guarda. Lo arma el servidor entero: un archivo llamado
 * «../../otra-carpeta/x.png» escribiría fuera de lo suyo, así que del nombre
 * que manda el navegador solo sobrevive la extensión.
 */
export function rutaDelComprobante(leadId: string, pedidoId: string, nombre: string, id: string): string {
  return `${leadId}/${pedidoId}/${id}${extensionDe(nombre)}`;
}

/** Para mostrarlo en el panel sin que rompa nada. */
export function nombreVisible(nombre: string): string {
  return nombre.replace(/[\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120) || 'comprobante';
}

export interface TipoComprobante {
  mime: string;
  extension: string;
  /** Imagen se muestra con <img>; PDF, en el visor del navegador. */
  clase: 'imagen' | 'pdf';
}

/**
 * El tipo de verdad del archivo, por sus primeros bytes.
 *
 * `revisarComprobante` mira el tipo que declara el navegador, y eso lo
 * escribe quien sube el archivo: un HTML o un SVG con scripts llegaba como
 * «image/png» y se guardaba como tal. Esto mira lo que el archivo ES. Lo que
 * no es una imagen conocida o un PDF devuelve `null` y no se guarda.
 */
export function tipoReal(bytes: Buffer | Uint8Array): TipoComprobante | null {
  const b = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  const ascii = (desde: number, hasta: number) => b.subarray(desde, hasta).toString('latin1');

  if (b.length >= 8 && b.readUInt32BE(0) === 0x89504e47 && b.readUInt32BE(4) === 0x0d0a1a0a) {
    return { mime: 'image/png', extension: '.png', clase: 'imagen' };
  }
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    return { mime: 'image/jpeg', extension: '.jpg', clase: 'imagen' };
  }
  if (b.length >= 12 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') {
    return { mime: 'image/webp', extension: '.webp', clase: 'imagen' };
  }
  if (b.length >= 5 && ascii(0, 5) === '%PDF-') {
    return { mime: 'application/pdf', extension: '.pdf', clase: 'pdf' };
  }
  // AVIF y HEIC son contenedores ISO: «ftyp» en el byte 4 y la marca después.
  if (b.length >= 12 && ascii(4, 8) === 'ftyp') {
    const marca = ascii(8, 12);
    if (marca === 'avif' || marca === 'avis') return { mime: 'image/avif', extension: '.avif', clase: 'imagen' };
    if (['heic', 'heix', 'hevc', 'mif1', 'msf1'].includes(marca)) {
      return { mime: 'image/heic', extension: '.heic', clase: 'imagen' };
    }
  }
  return null;
}
