'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { s } from '@/components/admin/AdminShell';
import { CopyButton } from '@/components/admin/CopyButton';
import { StatusBadge } from '@/components/admin/agenda/StatusBadge';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import type { LinkedInPost } from '@/lib/linkedin-posts/types';
import type { PostPublicationStatus } from '@/lib/post-publications/types';

export function LinkedInEditor({ item }: { item: LinkedInPost }) {
  const router = useRouter();
  const [title, setTitle] = useState(item.title);
  const [body, setBody] = useState(item.body ?? '');
  const [scheduledAt, setScheduledAt] = useState(() => {
    const date = new Date(item.scheduled_at);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  });
  const [publishedUrl, setPublishedUrl] = useState(item.published_url ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function patch(updates: Record<string, unknown>) {
    setSaving(true); setError('');
    const response = await fetch(`/api/admin/linkedin-posts/${item.slug}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) setError(json.error ?? 'No se pudo guardar'); else router.refresh();
    setSaving(false);
  }

  async function uploadPdf(file: File) {
    if (file.type !== 'application/pdf' || !file.name.toLowerCase().endsWith('.pdf') || file.size > 25 * 1024 * 1024) {
      setError('Elegí un PDF válido de hasta 25 MiB'); return;
    }
    setSaving(true); setError('');
    try {
      const metadata = { filename: file.name, size: file.size, content_type: file.type };
      const start = await fetch(`/api/admin/linkedin-posts/${item.slug}/pdf`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(metadata) });
      const signed = await start.json();
      if (!start.ok) throw new Error(signed.error ?? 'No se pudo iniciar la subida');
      const { error: uploadError } = await getSupabaseBrowser().storage.from('linkedin-originals').uploadToSignedUrl(signed.path, signed.token, file, { contentType: 'application/pdf' });
      if (uploadError) throw uploadError;
      const complete = await fetch(`/api/admin/linkedin-posts/${item.slug}/pdf`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...metadata, path: signed.path }) });
      const completed = await complete.json();
      if (!complete.ok) throw new Error(completed.error ?? 'No se pudo verificar el PDF');
      router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo subir'); }
    finally { setSaving(false); }
  }

  async function openPdf() {
    const response = await fetch(`/api/admin/linkedin-posts/${item.slug}/pdf`);
    const json = await response.json();
    if (!response.ok) return setError(json.error ?? 'No se pudo abrir');
    window.open(json.url, '_blank', 'noopener,noreferrer');
  }

  const nextStatus: PostPublicationStatus | null = item.status === 'planificado' ? 'preaprobado' : item.status === 'preaprobado' ? 'publicado' : null;
  return <div style={{ display: 'grid', gap: 18 }}>
    <div style={{ ...s.card, display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><StatusBadge status={item.status} /><span style={s.hint}>{item.slot} · vinculado a {item.post_slug}</span></div>
      <label style={s.label}>Título<input style={s.input} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
      <label style={s.label}>Texto listo para copiar<textarea style={{ ...s.input, minHeight: 380, lineHeight: 1.65 }} value={body} onChange={(event) => setBody(event.target.value)} /></label>
      <CopyButton text={body} ariaLabel="Copiar texto completo de LinkedIn" />
      <label style={s.label}>Fecha<input type="datetime-local" style={s.input} value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} /></label>
      <label style={s.label}>URL publicada (opcional)<input type="url" style={s.input} value={publishedUrl} onChange={(event) => setPublishedUrl(event.target.value)} placeholder="https://www.linkedin.com/posts/..." /></label>
      {error && <div role="alert" style={s.errorText}>{error}</div>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><button style={s.btn} disabled={saving} onClick={() => patch({ title, body, scheduled_at: new Date(scheduledAt).toISOString(), published_url: publishedUrl })}>Guardar cambios</button>{nextStatus && <button style={s.btnGhost} disabled={saving} onClick={() => patch({ status: nextStatus, published_url: publishedUrl })}>Marcar {nextStatus}</button>}{item.status !== 'planificado' && <button style={s.btnGhost} disabled={saving} onClick={() => patch({ status: item.status === 'publicado' ? 'preaprobado' : 'planificado' })}>Volver atrás</button>}</div>
    </div>
    <div style={s.card}><h2 style={s.sectionTitle}>PDF original</h2><p style={s.hint}>PDF terminado, sin re-render ni miniatura. Máximo 25 MiB.</p><input type="file" accept="application/pdf,.pdf" disabled={saving} onChange={(event) => { const selected = event.target.files?.[0]; if (selected) uploadPdf(selected); }} />{(item.pdf_storage_path || item.carousel_pdf_url) && <button style={{ ...s.btnGhost, marginLeft: 10 }} onClick={openPdf}>Abrir / descargar PDF</button>}</div>
    <details style={s.card}><summary style={{ cursor: 'pointer', fontWeight: 700 }}>Fuente Markdown preservada</summary><p style={s.hint}>{item.source_filename ?? 'Registro histórico sin archivo fuente'}</p><pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', color: '#94a3b8', fontSize: 12 }}>{item.source_markdown ?? 'Sin fuente importada.'}</pre>{item.source_markdown && <CopyButton text={item.source_markdown} ariaLabel="Copiar fuente Markdown original" />}</details>
  </div>;
}
