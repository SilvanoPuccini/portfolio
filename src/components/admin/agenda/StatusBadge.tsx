import type { PostPublicationStatus } from '@/lib/post-publications/types';

export const STATUS_LABELS: Record<PostPublicationStatus, string> = {
  planificado: 'Planificado',
  preaprobado: 'Preaprobado',
  publicado: 'Publicado',
};

export const STATUS_COLORS: Record<PostPublicationStatus, { bg: string; color: string }> = {
  planificado: { bg: 'rgba(100,116,139,0.12)', color: '#64748b' },
  preaprobado: { bg: 'rgba(0,212,212,0.1)', color: '#00d4d4' },
  publicado: { bg: 'rgba(74,222,128,0.1)', color: '#4ade80' },
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
