import type { XThread } from './types';

export const PLAN_EXHAUSTED_PREFIX = 'PLAN_EXHAUSTED: ';

/** Recognize legacy rows as well as newly generated exhaustion errors. */
export function isPlanExhausted(error: string | null | undefined): boolean {
  return Boolean(error && (error.startsWith(PLAN_EXHAUSTED_PREFIX)
    || /^Los \d+ ángulos del plan ya están cubiertos por hilos aprobados/.test(error)
    || error.startsWith('Esta fila no tiene el guion de la semana guardado:')));
}

export function canReplanThread(thread: Pick<XThread, 'status' | 'last_error' | 'published_at' | 'published_ids'>): boolean {
  return thread.status === 'error' && isPlanExhausted(thread.last_error)
    && !thread.published_at && !(thread.published_ids?.length);
}
