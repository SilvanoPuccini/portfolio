'use client';

import { useRef, useState } from 'react';
import { c, tint } from './tokens';

const MAX_MD_BYTES = 250_000;

function MarkdownIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M8 17v-5l2 2 2-2v5" />
  </svg>;
}

/**
 * Adjuntar un .md. Reemplaza al input de archivo nativo, que en oscuro se ve
 * como un botón gris del sistema y no se puede estilar. Acepta arrastrar el
 * archivo encima, que es como llega desde la carpeta de descargas.
 */
export function MarkdownDrop({ onFile, busy, compact = false, label = 'Adjuntar .md' }: {
  onFile: (markdown: string, filename: string) => void | Promise<void>;
  busy?: boolean;
  compact?: boolean;
  label?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [error, setError] = useState('');

  async function take(file: File | null | undefined) {
    setError('');
    if (!file) return;
    if (!/\.(md|markdown|txt)$/i.test(file.name)) {
      setError('Tiene que ser un archivo .md');
      return;
    }
    if (file.size > MAX_MD_BYTES) {
      setError('El archivo pasa los 250 KB');
      return;
    }
    await onFile(await file.text(), file.name.replace(/\.(markdown|txt)$/i, '.md'));
    if (input.current) input.current.value = '';
  }

  const active = over && !busy;
  return <div>
    <button type="button" disabled={busy}
      onClick={() => input.current?.click()}
      onDragOver={(event) => { event.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => { event.preventDefault(); setOver(false); take(event.dataTransfer.files?.[0]); }}
      className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        width: compact ? 'auto' : '100%',
        padding: compact ? '7px 13px' : '16px 18px',
        borderRadius: 8,
        border: `1px dashed ${active ? c.ready : c.border}`,
        background: active ? tint(c.ready, '14') : 'transparent',
        color: active ? c.ready : c.textSoft,
        fontSize: 12, fontWeight: 500, fontFamily: 'inherit',
        cursor: busy ? 'wait' : 'pointer',
        transition: 'color .12s, border-color .12s, background .12s',
      }}>
      <MarkdownIcon />
      {busy ? 'Cargando…' : active ? 'Soltá el archivo' : label}
    </button>
    <input ref={input} type="file" accept=".md,.markdown,text/markdown,text/plain"
      aria-label={label} style={{ display: 'none' }}
      onChange={(event) => take(event.target.files?.[0])} />
    {error && <p role="alert" style={{ margin: '6px 0 0', fontSize: 11, color: c.late }}>{error}</p>}
  </div>;
}
