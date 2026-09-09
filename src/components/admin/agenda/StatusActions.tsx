'use client';

import { useState } from 'react';
import { s } from '@/components/admin/AdminShell';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { preApprovalBlockReason } from '@/lib/post-publications/types';
import type { PostPublicationStatus } from '@/lib/post-publications/types';

const primaryHover = 'transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]';
const ghostHover = 'transition-colors hover:border-[#00d4d4] hover:text-[#00d4d4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]';

type Pending = 'publicar' | 'ocultar' | null;

/**
 * Lo mínimo que estos botones necesitan saber de una pieza. Se declara acá y no
 * se importa la fila del listado de blog porque el mismo circuito de estados lo
 * usan ahora las piezas de LinkedIn, que no comparten esa forma.
 */
export interface StatusActionTarget {
  title: string;
  status: PostPublicationStatus;
  has_content: boolean;
  /**
   * Motivo por el que esta pieza todavía no puede salir de planificado. El
   * blog solo necesita texto, pero el carrusel de LinkedIn también necesita
   * el PDF, y ese requisito lo conoce quien la arma, no este botón.
   */
  blockedReason?: string | null;
}

/** Botones de transición de estado, siempre bidireccionales: nada de callejones sin salida. */
export function StatusActions({
  item,
  onChange,
}: {
  item: StatusActionTarget;
  onChange: (status: PostPublicationStatus) => void;
}) {
  const [pending, setPending] = useState<Pending>(null);

  // El servidor rechaza igual una preaprobación sin texto; acá el botón se
  // apaga para que el motivo se vea antes de hacer clic, no después en un
  // error. El listado no trae el texto, solo si existe.
  const blocked = item.blockedReason ?? (item.has_content ? null : preApprovalBlockReason(null));

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      {item.status === 'planificado' && (
        <>
          <button
            className={blocked ? '' : primaryHover}
            style={{
              ...s.btn,
              ...(blocked ? { opacity: 0.4, cursor: 'not-allowed' } : {}),
            }}
            disabled={Boolean(blocked)}
            title={blocked ?? undefined}
            onClick={() => onChange('preaprobado')}
          >
            Marcar preaprobado →
          </button>
          {blocked && (
            <span style={{ fontSize: 11, color: '#fbbf24', maxWidth: 190, lineHeight: 1.4 }}>
              {blocked}
            </span>
          )}
        </>
      )}

      {item.status === 'preaprobado' && (
        <>
          <button className={ghostHover} style={s.btnGhost} onClick={() => onChange('planificado')}>
            ← Volver a planificado
          </button>
          <button className={primaryHover} style={s.btn} onClick={() => setPending('publicar')}>
            Publicar ahora →
          </button>
        </>
      )}

      {item.status === 'publicado' && (
        <button className={ghostHover} style={s.btnGhost} onClick={() => setPending('ocultar')}>
          ← Ocultar (volver a preaprobado)
        </button>
      )}

      {pending === 'publicar' && (
        <ConfirmDialog
          title="Publicar ahora"
          message={`"${item.title}" se hace visible en el sitio y se le manda el newsletter a toda la lista. El mail no se puede deshacer.`}
          confirmLabel="Publicar y mandar el mail"
          onCancel={() => setPending(null)}
          onConfirm={() => {
            setPending(null);
            onChange('publicado');
          }}
        />
      )}

      {pending === 'ocultar' && (
        <ConfirmDialog
          title="Ocultar del sitio"
          message={`"${item.title}" vuelve a preaprobado y deja de verse en el sitio. El mail que ya se mandó no se vuelve a mandar si lo republicás.`}
          confirmLabel="Ocultar"
          tone="danger"
          onCancel={() => setPending(null)}
          onConfirm={() => {
            setPending(null);
            onChange('preaprobado');
          }}
        />
      )}
    </div>
  );
}
