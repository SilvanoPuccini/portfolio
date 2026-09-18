import type { PostPublicationStatus } from '@/lib/post-publications/types';
import { c, tint } from './../tokens';

export const STATUS_LABELS: Record<PostPublicationStatus, string> = {
  planificado: 'Planificado',
  preaprobado: 'Preaprobado',
  publicado: 'Publicado',
};

/**
 * El color dice el estado y nada más. Los tonos salen de la capa semántica;
 * el fondo es el mismo tono al 10-12 %, para que la pastilla se lea sin pedir
 * un color propio.
 */
export const STATUS_COLORS: Record<PostPublicationStatus, { bg: string; color: string }> = {
  planificado: { bg: tint(c.planned, '1f'), color: c.textDim },
  preaprobado: { bg: tint(c.ready, '1a'), color: c.ready },
  publicado: { bg: tint(c.published, '1a'), color: c.published },
};

export function StatusBadge({ status }: { status: PostPublicationStatus }) {
  const { bg, color } = STATUS_COLORS[status];
  return (
    <span
      style={{
        fontSize: 11,
        padding: '3px 10px',
        borderRadius: 20,
        fontFamily: 'monospace',
        background: bg,
        color,
        whiteSpace: 'nowrap',
      }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
