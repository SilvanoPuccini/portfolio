import type { PostPublicationStatus } from '@/lib/post-publications/types';

/** Los mismos tres estados del resto del admin, más el operativo de fallo. */
export type XThreadStatus = PostPublicationStatus | 'error';

export interface XTweet {
  text: string;
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
