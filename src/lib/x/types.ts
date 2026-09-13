import type { PostPublicationStatus } from '@/lib/post-publications/types';

/** Los mismos tres estados del resto del admin, más el operativo de fallo. */
export type XThreadStatus = PostPublicationStatus | 'error';

export interface XTweet {
  text: string;
  /** Orden explícito dentro del hilo. 1-based, lo asigna la regla de reorden. */
  tweet_number?: number;
}

/** Respaldo de una afirmación contra la fuente. Nunca se publica. */
export interface XEvidence {
  target: string;
  claim: string;
  source_id: string;
  /** Fragmento literal del artículo o del perfil que sostiene la afirmación. */
  excerpt: string;
  type: 'personal' | 'technical' | 'inference' | 'hypothetical';
}

/** Qué motor corrió la última generación. Se guarda para el futuro informe. */
export type XProvider = 'gemini' | 'groq';

/**
 * Una vuelta del circuito escribir→validar→criticar.
 *
 * La historia se persiste y se le vuelve a pasar al escritor: reescribir sin
 * memoria hace que el modelo repita los mismos problemas en cada intento.
 */
export interface XRewriteHistoryEntry {
  /** Cuándo se generó este intento. ISO. */
  at: string;
  /** Vuelta dentro de la corrida: empieza en 1. */
  attempt: number;
  /** Qué motor escribió este borrador. */
  provider: XProvider;
  /** Problemas que se le pasaron al escritor en ESTE intento (vacíos en el 1). */
  fixes: string[];
  verdict?: 'rewrite' | 'blocked' | 'approved';
  reasons?: string[];
}

/** Cuántas vueltas de historia entran en el próximo prompt. Las más viejas se descartan. */
export const MAX_REWRITE_HISTORY = 12;

export interface XThread {
  id: string;
  post_slug: string;
  angle_id: string;
  angle_summary: string;
  thesis: string | null;
  tweets: XTweet[];
  reply_with_link: string | null;
  evidence: XEvidence[];
  status: XThreadStatus;
  scheduled_at: string;
  pre_approved_at: string | null;
  published_at: string | null;
  published_ids: string[];
  published_url: string | null;
  approved_fingerprint: string | null;
  generation_attempts: number;
  publish_attempts: number;
  last_error: string | null;
  /** Guion de la semana tal como se planificó. Re-planear es una acción explícita. */
  plan: XAngle[] | null;
  /** Vueltas de generación persistidas, con sus fixes y el motor que corrió. */
  rewrite_history: XRewriteHistoryEntry[];
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface XThreadListItem extends Omit<XThread, 'tweets' | 'evidence'> {
  tweet_count: number;
  has_content: boolean;
  preview: string;
}

/** Un ángulo del guion semanal: una idea y la pregunta que responde. */
export interface XAngle {
  id: string;
  summary: string;
  question: string;
}
