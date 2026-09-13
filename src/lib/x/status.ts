import type { XThread, XThreadStatus } from './types';

/**
 * El circuito de estados de un hilo de X.
 *
 * Un cambio de estado no es un update cualquiera: es un contrato con el cron.
 * `published_at` es la marca que impide republicar — dueNow solo toma hilos
 * `preaprobado` SIN `published_at` — así que ninguna transición la borra: un
 * hilo que ya salió conserva su marca aunque vuelva a preaprobado o baje a
 * planificado, y el cron jamás lo vuelve a tomar solo.
 */

/** Transiciones manuales válidas del panel. El cron no pasa por acá. */
const ALLOWED: Record<XThreadStatus, readonly XThreadStatus[]> = {
  planificado: ['preaprobado'],
  preaprobado: ['planificado', 'publicado'],
  publicado: ['preaprobado'],
  error: ['preaprobado', 'publicado'],
};

export function isValidXTransition(from: XThreadStatus, to: XThreadStatus): boolean {
  return from === to || ALLOWED[from].includes(to);
}

/**
 * Motivo por el que una transición pedida no se aplica, o null si es válida.
 *
 * La regla de estados y la regla de contenido (huella de aprobación) viven
 * juntas acá para que el PATCH del admin y sus tests compartan una sola
 * fuente. Avanzar a `preaprobado` o `publicado` exige que el texto haya pasado
 * los controles al menos una vez (approved_fingerprint). La excepción es la
 * fila que ya salió con `published_at`: esa conserva su marca anti-republish y
 * puede volver a preaprobado (ocultar) sin huella.
 */
export function xTransitionBlockReason(
  thread: Pick<XThread, 'status' | 'approved_fingerprint' | 'published_at'>,
  to: XThreadStatus,
): string | null {
  if (!isValidXTransition(thread.status, to)) {
    return `Transición inválida: ${thread.status} → ${to}`;
  }
  const advancing = to === 'preaprobado' || to === 'publicado';
  if (advancing && !thread.approved_fingerprint && !thread.published_at) {
    return 'El hilo no tiene huella de aprobación. Escribilo o guardalo para validarlo antes de avanzar.';
  }
  return null;
}

/**
 * Los timestamps que una transición deja en la fila.
 *
 * `publicado` marca `published_at` si falta: "marcar publicado" declara que el
 * hilo ya salió de verdad (a mano, por ejemplo) y no publica nada. Con la
 * marca puesta, el cron nunca vuelve a tomarlo.
 *
 * `preaprobado` fija `pre_approved_at` si falta y conserva `published_at` de
 * la publicación anterior: bajar ahí es ocultar o recuperar, no despublicar.
 */
export function xStatusTimestampUpdates(
  current: Pick<XThread, 'pre_approved_at' | 'published_at'>,
  to: XThreadStatus,
): Record<string, string | null> {
  const now = new Date().toISOString();
  if (to === 'planificado') {
    return { pre_approved_at: null };
  }
  if (to === 'preaprobado') {
    return {
      pre_approved_at: current.pre_approved_at ?? now,
      last_error: null,
    };
  }
  if (to === 'publicado') {
    return {
      published_at: current.published_at ?? now,
      pre_approved_at: current.pre_approved_at ?? now,
      last_error: null,
    };
  }
  return {};
}