'use client';

import { useRef, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { IconButton } from './IconButton';
import { c, tint } from './tokens';

const MAX_PDF_BYTES = 25 * 1024 * 1024;

function PdfIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M9 15h1.5a1.5 1.5 0 0 0 0-3H9v6" />
    <path d="M14 18v-6h1a2 2 0 0 1 0 6z" />
  </svg>;
}

function formatSize(bytes: number | null) {
  if (!bytes) return '';
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

/**
 * El PDF del carrusel: se sube y se abre sin salir de donde estás.
 *
 * La subida va por URL firmada en tres pasos y el servidor verifica la firma
 * %PDF- del archivo que llegó, así que el archivo no pasa por la app.
 */
export function PdfSlot({ slug, name, size, hasPdf, onChanged }: {
  slug: string;
  name: string | null;
  size: number | null;
  hasPdf: boolean;
  onChanged: () => void | Promise<void>;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [error, setError] = useState('');

  async function upload(file: File | null | undefined) {
    setError('');
    if (!file) return;
    if (file.type !== 'application/pdf' || !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Tiene que ser un PDF'); return;
    }
    if (file.size > MAX_PDF_BYTES) { setError('El PDF pasa los 25 MB'); return; }

    setBusy(true);
    try {
      const metadata = { filename: file.name, size: file.size, content_type: file.type };
      const start = await fetch(`/api/admin/linkedin-posts/${slug}/pdf`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(metadata),
      });
      const signed = await start.json();
      if (!start.ok) throw new Error(signed.error ?? 'No se pudo iniciar la subida');
      const { error: uploadError } = await getSupabaseBrowser().storage
        .from('linkedin-originals')
        .uploadToSignedUrl(signed.path, signed.token, file, { contentType: 'application/pdf' });
      if (uploadError) throw uploadError;
      const complete = await fetch(`/api/admin/linkedin-posts/${slug}/pdf`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...metadata, path: signed.path }),
      });
      const completed = await complete.json();
      if (!complete.ok) throw new Error(completed.error ?? 'No se pudo verificar el PDF');
      if (input.current) input.current.value = '';
      await onChanged();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo subir');
    } finally { setBusy(false); }
  }

  async function open() {
    const response = await fetch(`/api/admin/linkedin-posts/${slug}/pdf`);
    const json = await response.json();
    if (!response.ok) return setError(json.error ?? 'No se pudo abrir');
    window.open(json.url, '_blank', 'noopener,noreferrer');
  }

  const active = over && !busy;
  return <section style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 12, padding: 16 }}>
    <header style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
      <span style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: c.textDim }}>PDF</span>
      <span style={{ fontFamily: 'monospace', fontSize: 10, color: hasPdf ? c.published : c.incomplete }}>
        {busy ? 'subiendo…' : hasPdf ? `✓ ${name ?? 'guardado'} ${formatSize(size)}` : 'sin subir'}
      </span>
      {hasPdf && <span style={{ marginLeft: 'auto' }}>
        <IconButton label="Abrir el PDF" onClick={open}>↗</IconButton>
      </span>}
    </header>

    <button type="button" disabled={busy}
      onClick={() => input.current?.click()}
      onDragOver={(event) => { event.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => { event.preventDefault(); setOver(false); upload(event.dataTransfer.files?.[0]); }}
      className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        width: '100%', padding: '14px 18px', borderRadius: 8,
        border: `1px dashed ${active ? c.ready : c.border}`,
        background: active ? tint(c.ready, '14') : 'transparent',
        color: active ? c.ready : c.textSoft,
        fontSize: 12, fontWeight: 500, fontFamily: 'inherit',
        cursor: busy ? 'wait' : 'pointer', transition: 'color .12s, border-color .12s, background .12s',
      }}>
      <PdfIcon />
      {busy ? 'Subiendo…' : active ? 'Soltá el PDF' : hasPdf ? 'Reemplazar el PDF' : 'Arrastrá el PDF o hacé clic'}
    </button>
    <input ref={input} type="file" accept="application/pdf,.pdf" aria-label="Subir el PDF del carrusel"
      style={{ display: 'none' }} onChange={(event) => upload(event.target.files?.[0])} />
    {error && <p role="alert" style={{ margin: '7px 0 0', fontSize: 11, color: c.late }}>{error}</p>}
  </section>;
}
