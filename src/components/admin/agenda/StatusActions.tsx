import { s } from '@/components/admin/AdminShell';
import type { PostPublication, PostPublicationStatus } from '@/lib/post-publications/types';

/** Botones de transición de estado, siempre bidireccionales: nada de callejones sin salida. */
export function StatusActions({
  item,
  onChange,
}: {
  item: PostPublication;
  onChange: (slug: string, status: PostPublicationStatus) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {item.status === 'planificado' && (
        <button style={s.btn} onClick={() => onChange(item.post_slug, 'preaprobado')}>
          Marcar preaprobado →
        </button>
      )}

      {item.status === 'preaprobado' && (
        <>
          <button style={s.btnGhost} onClick={() => onChange(item.post_slug, 'planificado')}>
            ← Volver a planificado
          </button>
          <button
            style={s.btn}
            onClick={() => {
              if (confirm(`¿Publicar "${item.raw_title}" ahora? Se hace visible y se manda el mail.`)) {
                onChange(item.post_slug, 'publicado');
              }
            }}
          >
            Publicar ahora →
          </button>
        </>
      )}

      {item.status === 'publicado' && (
        <button
          style={s.btnGhost}
          onClick={() => {
            if (confirm(`¿Ocultar "${item.raw_title}" de nuevo? Vuelve a preaprobado, deja de verse en el sitio.`)) {
              onChange(item.post_slug, 'preaprobado');
            }
          }}
        >
          ← Ocultar (volver a preaprobado)
        </button>
      )}
    </div>
  );
}
