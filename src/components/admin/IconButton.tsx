'use client';

import { useEffect, useRef, useState } from 'react';
import { c, tint } from './tokens';

/**
 * Acciones de fila. La información es lo grande; una acción es un ícono de 26px
 * que se nombra con aria-label y title, no un botón con cartel que compite con
 * el contenido por atención.
 */
const SIZE = 26;

const base: React.CSSProperties = {
  width: SIZE, height: SIZE, flexShrink: 0,
  display: 'grid', placeItems: 'center',
  background: 'transparent', border: `1px solid ${c.border}`,
  borderRadius: 6, color: c.textSoft, cursor: 'pointer', padding: 0,
};

export function CopyIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>;
}

export function CheckIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 6 9 17l-5-5" />
  </svg>;
}

export function CrossIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>;
}

export function ChevronIcon({ open }: { open: boolean }) {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden
    style={{ transition: 'transform .15s', transform: open ? 'rotate(180deg)' : 'none' }}>
    <path d="m6 9 6 6 6-6" />
  </svg>;
}

export function IconButton({ label, tone = c.textSoft, hoverTone = c.ready, onClick, children, disabled }: {
  label: string;
  tone?: string;
  hoverTone?: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const [hover, setHover] = useState(false);
  return <button type="button" aria-label={label} title={label} disabled={disabled}
    onClick={onClick}
    onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
    onFocus={() => setHover(true)} onBlur={() => setHover(false)}
    className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
    style={{
      ...base,
      color: disabled ? c.border : hover ? hoverTone : tone,
      borderColor: disabled ? c.border : hover ? hoverTone : c.border,
      background: hover && !disabled ? tint(hoverTone, '12') : 'transparent',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'color .12s, border-color .12s, background .12s',
    }}>{children}</button>;
}

/** Copiar con feedback en el mismo ícono: sin cartel, sin modal, sin toast. */
export function CopyIconButton({ text, label }: { text: string; label: string }) {
  const [state, setState] = useState<'idle' | 'ok' | 'fail'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  async function copy() {
    if (timer.current) clearTimeout(timer.current);
    try {
      if (!navigator.clipboard?.writeText) throw new Error('sin clipboard');
      await navigator.clipboard.writeText(text);
      setState('ok');
    } catch { setState('fail'); }
    timer.current = setTimeout(() => setState('idle'), 1600);
  }

  return <IconButton
    label={state === 'ok' ? 'Copiado' : state === 'fail' ? 'No se pudo copiar' : label}
    tone={state === 'ok' ? c.published : state === 'fail' ? c.late : c.textSoft}
    hoverTone={state === 'ok' ? c.published : c.ready}
    disabled={!text.trim()}
    onClick={copy}
  >{state === 'ok' ? <CheckIcon /> : <CopyIcon />}</IconButton>;
}

/**
 * Confirmación en el lugar: el ícono se convierte en la pregunta y se resuelve
 * ahí mismo. Un modal para borrar el texto de una fila es demasiada ceremonia.
 */
export function ConfirmIconButton({ label, question, tone = c.late, onConfirm, children, disabled }: {
  label: string;
  question: string;
  tone?: string;
  onConfirm: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const [asking, setAsking] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  // Si se abandona la pregunta, se cierra sola: no queda un control armado.
  function arm() {
    setAsking(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAsking(false), 4000);
  }

  if (!asking) {
    return <IconButton label={label} tone={tone} hoverTone={tone} disabled={disabled} onClick={arm}>
      {children}
    </IconButton>;
  }

  return <span role="group" aria-label={question} style={{
    display: 'inline-flex', alignItems: 'center', gap: 6, height: SIZE,
    padding: '0 6px 0 9px', borderRadius: 6,
    border: `1px solid ${tone}`, background: tint(tone, '14'),
  }}>
    <span style={{ fontSize: 11, color: tone, whiteSpace: 'nowrap' }}>{question}</span>
    <button type="button" aria-label={`Sí, ${label.toLowerCase()}`}
      onClick={() => { setAsking(false); onConfirm(); }}
      className="transition-[filter] hover:brightness-125"
      style={{ border: 0, background: tone, color: c.page, borderRadius: 4, fontSize: 10, fontWeight: 700, padding: '2px 7px', cursor: 'pointer' }}
    >Sí</button>
    <button type="button" aria-label="Cancelar" onClick={() => setAsking(false)}
      className="transition-colors hover:text-[#e2e8f0]"
      style={{ border: 0, background: 'transparent', color: c.textSoft, fontSize: 10, padding: '2px 3px', cursor: 'pointer' }}
    >No</button>
  </span>;
}
