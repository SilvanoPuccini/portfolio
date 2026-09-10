import type { PostPublicationStatus } from '@/lib/post-publications/types';

export type AgendaChannel = 'blog' | 'linkedin' | 'x';

export interface AgendaItem {
  id: string;
  channel: AgendaChannel;
  source_id: string;
  title: string;
  scheduled_at: string;
  status: PostPublicationStatus;
  detail_path: string;
  has_content: boolean;
  content_chars: number;
  /** Solo el carrusel de LinkedIn necesita PDF; blog y X van siempre en true. */
  has_pdf: boolean;
  /**
   * Si la pieza cumple todo lo que su canal exige para salir de planificado.
   * Refleja la validación del servidor para que el calendario pueda pintar en
   * ámbar lo que todavía no se puede preaprobar, sin intentar el PATCH.
   */
  is_ready: boolean;
  pre_approved_at: string | null;
  published_at: string | null;
}
