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
