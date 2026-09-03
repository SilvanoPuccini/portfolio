export type PostPublicationStatus = 'planificado' | 'preaprobado' | 'publicado';

export interface PostPublication {
  post_slug: string;
  status: PostPublicationStatus;
  raw_title: string;
  raw_content: string | null;
  scheduled_at: string;
  notify_subscribers: boolean;
  pre_approved_at: string | null;
  published_at: string | null;
  notified_at: string | null;
  notify_attempts: number;
  notify_error: string | null;
  created_at: string;
  updated_at: string;
}

/** Transiciones válidas: no se puede saltear la preaprobación. */
const ALLOWED_TRANSITIONS: Record<PostPublicationStatus, PostPublicationStatus[]> = {
  planificado: ['preaprobado'],
  preaprobado: ['planificado', 'publicado'],
  publicado: ['preaprobado'],
};

export function isValidTransition(
  from: PostPublicationStatus,
  to: PostPublicationStatus,
): boolean {
  return from === to || ALLOWED_TRANSITIONS[from].includes(to);
}

export function hasRawContent(raw: string | null | undefined): boolean {
  return typeof raw === 'string' && raw.trim().length > 0;
}

/**
 * Preaprobar significa "leí este texto y está listo". Sin texto cargado no hay
 * nada que aprobar, y como publicar exige haber pasado por preaprobado, esta
 * sola regla también impide que se publique un post vacío, tanto desde el
 * botón como desde el cron del domingo.
 *
 * Devuelve el motivo del bloqueo, o null si la preaprobación es válida.
 */
export function preApprovalBlockReason(raw: string | null | undefined): string | null {
  return hasRawContent(raw)
    ? null
    : 'Este post no tiene texto cargado todavía. Cargá el texto antes de preaprobarlo.';
}

/**
 * Fila tal como la devuelve el listado del admin. No trae `raw_content`
 * (el texto entero de cada post) porque la pantalla solo necesita saber si
 * hay texto cargado, no leerlo.
 */
export interface PostPublicationListItem extends Omit<PostPublication, 'raw_content'> {
  has_content: boolean;
  content_chars: number;
}

export interface CreatePostPublicationRequest {
  post_slug: string;
  raw_title: string;
  raw_content?: string;
  scheduled_at: string;
  notify_subscribers?: boolean;
}

export interface UpdatePostPublicationRequest {
  raw_title?: string;
  raw_content?: string;
  scheduled_at?: string;
  notify_subscribers?: boolean;
  status?: PostPublicationStatus;
}

export function slugifyTitle(title: string): string {
  return title
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}
