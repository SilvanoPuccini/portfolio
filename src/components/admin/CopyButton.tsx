'use client';

import { useEffect, useRef, useState } from 'react';
import { s } from '@/components/admin/AdminShell';

type CopyStatus = 'idle' | 'copied' | 'error';

type CopyButtonProps = {
  text: string;
  label?: string;
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
};

export function CopyButton({
  text,
  label = 'Copiar',
  ariaLabel,
  className,
  style,
}: CopyButtonProps) {
  const [status, setStatus] = useState<CopyStatus>('idle');
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const disabled = !text.trim();

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  async function copy() {
    if (disabled) return;

    if (resetTimer.current) clearTimeout(resetTimer.current);

    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(text);
      setStatus('copied');
    } catch {
      setStatus('error');
    }

    resetTimer.current = setTimeout(() => setStatus('idle'), 2000);
  }

  return (
    <button
      type="button"
      className={className}
      style={{
        ...s.btnGhost,
        fontSize: 11,
        padding: '5px 12px',
        ...style,
        ...(status === 'copied' ? { color: '#4ade80', borderColor: 'rgba(74,222,128,0.35)' } : {}),
        ...(status === 'error' ? { color: '#f87171', borderColor: 'rgba(248,113,113,0.35)' } : {}),
        ...(disabled ? { cursor: 'not-allowed', opacity: 0.5 } : {}),
      }}
      aria-label={ariaLabel ?? label}
      aria-live="polite"
      disabled={disabled}
      onClick={copy}
    >
      {status === 'copied' ? '✓ Copiado' : status === 'error' ? 'No se pudo copiar' : label}
    </button>
  );
}
