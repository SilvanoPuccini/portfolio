'use client';

import { useEffect, useRef } from 'react';
import { s } from './AdminShell';

/**
 * Confirmación del admin. Reemplaza a `confirm()` del navegador, que se dibuja
 * pegado arriba de la ventana con el estilo del sistema operativo y no tiene
 * nada que ver con el resto del panel.
 */
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancelar',
  tone = 'primary',
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'primary' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Escape cierra y el foco arranca en el botón de confirmar: el confirm()
  // nativo hacía las dos cosas y se perderían al reemplazarlo.
  useEffect(() => {
    confirmRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const confirmStyle =
    tone === 'danger'
      ? { ...s.btn, background: '#f87171', color: '#0a0a14' }
      : s.btn;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(10, 10, 20, 0.85)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        style={{ ...s.card, maxWidth: 420, textAlign: 'center' as const }}
        onClick={(e) => e.stopPropagation()}
      >
        <p style={{ ...s.eyebrow, marginBottom: 8 }}>Confirmar</p>
        <h2 style={{ ...s.heading, fontSize: 18, marginBottom: 8 }}>{title}</h2>
        <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6, margin: '0 0 24px' }}>{message}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            className="transition-colors hover:border-[#00d4d4] hover:text-[#00d4d4]"
            onClick={onCancel}
            style={s.btnGhost}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            className="transition-[filter] hover:brightness-110"
            onClick={onConfirm}
            style={confirmStyle}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
