import { createHash, createHmac, randomInt, timingSafeEqual } from 'crypto';

/**
 * El acceso del cliente a su proyecto.
 *
 * El link del pedido es un uuid imposible de adivinar, pero un link se
 * comparte: se reenvía, se pega en un grupo, se ve en una pantalla
 * compartida. Para lo que de verdad importa —el contrato firmado y el
 * material que cargó— hace falta además un código que llega al mail de la
 * venta, el mismo donde firmó.
 *
 * No es una contraseña a propósito. Una contraseña se roba, se olvida, se
 * reutiliza de otro sitio y obliga a mantener recuperación. Un código que
 * vence en diez minutos no deja nada guardado que robar.
 */

/** Cuánto vive el código antes de dejar de servir. */
const MINUTOS_DEL_CODIGO = 10;

/** Cuántas veces se puede errar antes de tener que pedir otro. */
export const MAX_INTENTOS = 5;

/** Cuánto dura la sesión una vez que entró. Un proyecto dura semanas. */
export const DURACION_SESION_DIAS = 30;

/** Seis dígitos, sacados de una fuente criptográfica y no de Math.random. */
export function codigoNuevo(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

/**
 * El hash que se guarda.
 *
 * Lleva el id de la venta adentro para que el mismo código en dos ventas dé
 * hashes distintos: así nadie puede comparar filas entre sí.
 */
export function hashDeCodigo(codigo: string, leadId: string): string {
  return createHash('sha256').update(`${leadId}:${codigo}`).digest('hex');
}

export function vencimientoDelCodigo(ahora: Date = new Date()): string {
  return new Date(ahora.getTime() + MINUTOS_DEL_CODIGO * 60_000).toISOString();
}

/**
 * La sesión: el pedido, hasta cuándo vale, y la firma de las dos cosas.
 *
 * Va firmada y no cifrada porque no guarda ningún secreto: lo único que dice
 * es «quien trae esto probó su mail para este pedido». Lo que importa es que
 * no se pueda fabricar, y de eso se encarga la firma.
 */
export function firmarSesion(pedidoId: string, secreto: string, ahora: Date = new Date()): string {
  const vence = ahora.getTime() + DURACION_SESION_DIAS * 86_400_000;
  const cuerpo = `${pedidoId}.${vence}`;
  const firma = createHmac('sha256', secreto).update(cuerpo).digest('hex');
  return `${cuerpo}.${firma}`;
}

export function sesionValida(
  valor: string | undefined | null,
  pedidoId: string,
  secreto: string,
  ahora: Date = new Date(),
): boolean {
  if (!valor) return false;

  const partes = valor.split('.');
  if (partes.length !== 3) return false;

  const [id, vence, firma] = partes;
  if (id !== pedidoId) return false;

  const limite = Number(vence);
  if (!Number.isFinite(limite) || limite < ahora.getTime()) return false;

  const esperada = createHmac('sha256', secreto).update(`${id}.${vence}`).digest('hex');

  // Comparación de tiempo constante: comparar con === filtra, byte a byte,
  // cuánto de la firma era correcto.
  const a = Buffer.from(firma, 'hex');
  const b = Buffer.from(esperada, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

/** El nombre de la cookie donde vive la sesión del cliente. */
export const COOKIE_ACCESO = 'pedido_acceso';

/**
 * Si quien pide probó su mail para este pedido.
 *
 * Se usa en todo lo que expone datos del cliente: su contrato y su material.
 * El resto del circuito —elegir, firmar, ver cómo pagar— queda sin puerta a
 * propósito: es el camino de la venta y cada paso de más ahí es alguien que
 * no compra.
 */
export function tieneAcceso(
  cookie: string | undefined | null,
  pedidoId: string,
  ahora: Date = new Date(),
): boolean {
  const secreto = process.env.ADMIN_SESSION_SECRET;
  if (!secreto) return false;
  return sesionValida(cookie, pedidoId, secreto, ahora);
}
