'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { s } from '@/components/admin/AdminShell';
import { CopyButton } from '@/components/admin/CopyButton';
import { StatusBadge } from '@/components/admin/agenda/StatusBadge';
import { c, tint } from '@/components/admin/tokens';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import type { LinkedInPost } from '@/lib/linkedin-posts/types';
import type { PostPublicationStatus } from '@/lib/post-publications/types';

const MAX_PDF_BYTES = 25 * 1024 * 1024;

const card: React.CSSProperties = {
  background: c.surface, border: `1px solid ${c.border}`, borderRadius: 12, padding: 20,
};
const eyebrow: React.CSSProperties = {
  margin: '0 0 4px', fontFamily: 'monospace', fontSize: 10,
  letterSpacing: '0.18em', textTransform: 'uppercase', color: c.ready,
};

function formatSize(bytes: number | null) {
  if (!bytes) return '';
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

/** Un requisito con su tilde: se cargan por separado, se exigen juntos. */
function Requirement({ done, label, detail }: { done: boolean; label: string; detail: string }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
    <span aria-hidden style={{
      width: 16, height: 16, flexShrink: 0, borderRadius: 4, display: 'grid', placeItems: 'center',
      fontSize: 10, fontWeight: 700,
      background: done ? tint(c.published, '26') : tint(c.incomplete, '26'),
      color: done ? c.published : c.incomplete,
    }}>{done ? '✓' : '!'}</span>
    <span style={{ color: c.text, fontWeight: 600 }}>{label}</span>
    <span style={{ color: done ? c.textDim : c.incomplete }}>{detail}</span>
  </div>;
}

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
    const response = await fetch(`/api/admin/linkedin-posts/${item.slug}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) setError(json.error ?? 'No se pudo guardar'); else router.refresh();
    setSaving(false);
  }

  async function uploadPdf(file: File) {
    if (file.type !== 'application/pdf' || !file.name.toLowerCase().endsWith('.pdf') || file.size > MAX_PDF_BYTES) {
      setError('Elegí un PDF válido de hasta 25 MiB'); return;
    }
    setSaving(true); setError('');
    try {
      const metadata = { filename: file.name, size: file.size, content_type: file.type };
      const start = await fetch(`/api/admin/linkedin-posts/${item.slug}/pdf`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(metadata),
      });
      const signed = await start.json();
      if (!start.ok) throw new Error(signed.error ?? 'No se pudo iniciar la subida');
      const { error: uploadError } = await getSupabaseBrowser().storage
        .from('linkedin-originals')
        .uploadToSignedUrl(signed.path, signed.token, file, { contentType: 'application/pdf' });
      if (uploadError) throw uploadError;
      const complete = await fetch(`/api/admin/linkedin-posts/${item.slug}/pdf`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...metadata, path: signed.path }),
      });
      const completed = await complete.json();
      if (!complete.ok) throw new Error(completed.error ?? 'No se pudo verificar el PDF');
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo subir');
    } finally { setSaving(false); }
  }

  async function openPdf() {
    const response = await fetch(`/api/admin/linkedin-posts/${item.slug}/pdf`);
    const json = await response.json();
    if (!response.ok) return setError(json.error ?? 'No se pudo abrir');
    window.open(json.url, '_blank', 'noopener,noreferrer');
  }

  // El texto que cuenta es el que está en pantalla, no el que trajo el servidor:
  // así el requisito se marca apenas se guarda, sin esperar al refetch.
  const hasContent = body.trim().length > 0;
  const hasPdf = Boolean(item.pdf_storage_path || item.carousel_pdf_url);
  /**
   * El mismo motivo que devolvería el PATCH, pero antes de mandarlo. Sin esto
   * el botón estaba siempre habilitado y el error llegaba después del viaje.
   */
  const blocked = !hasContent ? 'Falta cargar el texto'
    : !hasPdf ? 'Falta subir el PDF'
    : null;
  const nextStatus: PostPublicationStatus | null = item.status === 'planificado' ? 'preaprobado'
    : item.status === 'preaprobado' ? 'publicado'
    : null;
  // Volver atrás nunca se bloquea: retroceder no necesita material.
  const canAdvance = Boolean(nextStatus) && (item.status !== 'planificado' || !blocked);

  return <div style={{ display: 'grid', gap: 16 }}>
    <section style={{ ...card, display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <StatusBadge status={item.status} />
        <span style={{ fontSize: 11, fontFamily: 'monospace', color: c.textDim }}>
          {item.slot} · vinculado a {item.post_slug ?? 'sin post'}
        </span>
      </div>

      <label style={s.label}>Título
        <input style={s.input} value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 5 }}>
          <span style={{ ...s.label, marginBottom: 0 }}>Texto listo para copiar</span>
          <span style={{ fontSize: 11, fontFamily: 'monospace', color: c.textDim }}>
            {body.trim().length.toLocaleString('es-AR')} car.
          </span>
        </div>
        <textarea aria-label="Texto de LinkedIn"
          style={{ ...s.input, minHeight: 340, lineHeight: 1.65, resize: 'vertical' }}
          value={body} onChange={(event) => setBody(event.target.value)}
          placeholder="Pegá acá el texto final. El PDF se sube aparte, más abajo." />
        <div style={{ marginTop: 8 }}>
          <CopyButton text={body} label="Copiar texto" ariaLabel="Copiar texto completo de LinkedIn"
            className="transition-colors hover:border-[#00d4d4] hover:text-[#00d4d4]" />
        </div>
      </div>

      <label style={s.label}>Fecha
        <input type="datetime-local" style={s.input} value={scheduledAt}
          onChange={(event) => setScheduledAt(event.target.value)} />
      </label>
      <label style={s.label}>URL publicada (opcional)
        <input type="url" style={s.input} value={publishedUrl}
          onChange={(event) => setPublishedUrl(event.target.value)}
          placeholder="https://www.linkedin.com/posts/..." />
      </label>

      {error && <p role="alert" style={{ margin: 0, fontSize: 13, color: c.late }}>{error}</p>}

      <button className="transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
        style={{ ...s.btn, justifySelf: 'flex-start', ...(saving ? { opacity: .6, cursor: 'wait' } : {}) }}
        disabled={saving}
        onClick={() => patch({ title, body, scheduled_at: new Date(scheduledAt).toISOString(), published_url: publishedUrl })}
      >{saving ? 'Guardando…' : 'Guardar cambios'}</button>
    </section>

    <section style={card}>
      <p style={eyebrow}>PDF original</p>
      <p style={{ ...s.hint, marginTop: 0, marginBottom: 12 }}>
        El PDF terminado, sin re-render ni miniatura. Máximo 25 MiB. Se sube aparte del texto.
      </p>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input type="file" accept="application/pdf,.pdf" disabled={saving}
          aria-label="Subir PDF del carrusel"
          onChange={(event) => { const selected = event.target.files?.[0]; if (selected) uploadPdf(selected); }} />
        {hasPdf && <button
          className="transition-colors hover:border-[#00d4d4] hover:text-[#00d4d4]"
          style={s.btnGhost} onClick={openPdf}>Abrir / descargar PDF</button>}
      </div>
      {hasPdf && item.pdf_original_name && <p style={{ ...s.hint, marginTop: 10 }}>
        {item.pdf_original_name} · {formatSize(item.pdf_size_bytes)}
      </p>}
    </section>

    <section style={card}>
      <p style={eyebrow}>Estado</p>
      <p style={{ ...s.hint, marginTop: 0, marginBottom: 12 }}>
        Para salir de planificado hacen falta las dos cosas. Se cargan por separado.
      </p>
      <div style={{ display: 'grid', gap: 7, marginBottom: 14 }}>
        <Requirement done={hasContent} label="Texto"
          detail={hasContent ? `${body.trim().length.toLocaleString('es-AR')} car.` : 'sin cargar'} />
        <Requirement done={hasPdf} label="PDF"
          detail={hasPdf ? (item.pdf_original_name ?? 'guardado') : 'sin subir'} />
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {nextStatus && <button
          className={canAdvance ? 'transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]' : ''}
          style={{ ...s.btn, ...(canAdvance ? {} : { opacity: .4, cursor: 'not-allowed' }) }}
          disabled={saving || !canAdvance}
          title={canAdvance ? undefined : blocked ?? undefined}
          onClick={() => patch({ status: nextStatus, published_url: publishedUrl })}
        >Marcar {nextStatus} →</button>}
        {!canAdvance && blocked && <span style={{ fontSize: 11, color: c.incomplete, maxWidth: 220, lineHeight: 1.4 }}>
          {blocked}
        </span>}
        {item.status !== 'planificado' && <button
          className="transition-colors hover:border-[#00d4d4] hover:text-[#00d4d4]"
          style={s.btnGhost} disabled={saving}
          onClick={() => patch({ status: item.status === 'publicado' ? 'preaprobado' : 'planificado' })}
        >← Volver atrás</button>}
      </div>
    </section>

    <details style={card}>
      <summary style={{ cursor: 'pointer', fontWeight: 700, color: c.text, fontSize: 13 }}>Fuente Markdown preservada</summary>
      <p style={s.hint}>{item.source_filename ?? 'Registro sin archivo fuente importado'}</p>
      <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', color: c.textSoft, fontSize: 12, lineHeight: 1.6 }}>
        {item.source_markdown ?? 'Sin fuente importada.'}
      </pre>
      {item.source_markdown && <CopyButton text={item.source_markdown} label="Copiar Markdown"
        ariaLabel="Copiar fuente Markdown original"
        className="transition-colors hover:border-[#00d4d4] hover:text-[#00d4d4]" />}
    </details>
  </div>;
}
