import { createHash } from 'crypto';

import { contratoComoTexto, type DatosDelContrato } from '@/content/contrato';

/**
 * La firma del contrato en nuestro propio sitio.
 *
 * El cliente lee el contrato completo en pantalla, escribe su nombre y
 * acepta. Eso es una firma electrónica: vale para un contrato como este, y lo
 * que la sostiene es la evidencia que se guarda alrededor.
 *
 * Por eso se guarda todo: cuándo, desde qué dirección, con qué navegador, el
 * texto completo del contrato en ese momento y su huella digital. Si algún
 * día hay que probar qué se firmó, se prueba con eso.
 *
 * La huella es lo que ata las dos puntas: si el contrato archivado no da la
 * misma huella que la guardada al firmar, es que alguien lo cambió después.
 */

export interface DatosDeFirma {
  ip: string;
  navegador: string;
}

export interface EvidenciaDeFirma {
  nombre: string;
  ip: string;
  navegador: string;
  firmadoAt: string;
  /** El contrato completo, tal como lo leyó. */
  texto: string;
  /** SHA-256 de ese texto. */
  huella: string;
}

const MAX_NAVEGADOR = 300;

/** La huella del contrato exacto que se está firmando. */
export function huellaDelContrato(data: DatosDelContrato): string {
  return createHash('sha256').update(contratoComoTexto(data), 'utf8').digest('hex');
}

/**
 * Si el nombre escrito es el del contrato.
 *
 * Se comparan sin acentos, sin mayúsculas y sin espacios de más: el que firma
 * escribe su nombre a mano y no tiene por qué acertarle a la tilde. Lo que no
 * se acepta es otro nombre, ni la mitad.
 */
export function nombreCoincide(escrito: string, esperado: string): boolean {
  const normal = (valor: string) => valor
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

  const a = normal(escrito);
  return a.length > 0 && a === normal(esperado);
}

export function evidenciaDeFirma(
  data: DatosDelContrato,
  nombre: string,
  datos: DatosDeFirma,
  ahora: Date = new Date(),
): EvidenciaDeFirma {
  return {
    nombre: nombre.trim(),
    ip: datos.ip.slice(0, 60),
    navegador: datos.navegador.slice(0, MAX_NAVEGADOR),
    firmadoAt: ahora.toISOString(),
    texto: contratoComoTexto(data),
    huella: huellaDelContrato(data),
  };
}
