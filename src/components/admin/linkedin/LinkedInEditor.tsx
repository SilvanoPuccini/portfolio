'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { s } from '@/components/admin/AdminShell';
import { ContentPanel } from '@/components/admin/ContentPanel';
import { PdfSlot } from '@/components/admin/PdfSlot';
import { CopyIconButton } from '@/components/admin/IconButton';
import { StatusBadge, STATUS_LABELS } from '@/components/admin/agenda/StatusBadge';
import { c, tint } from '@/components/admin/tokens';
import type { LinkedInPost } from '@/lib/linkedin-posts/types';
import type { PostPublicationStatus } from '@/lib/post-publications/types';

const card: React.CSSProperties = {
  background: c.surface, border: `1px solid ${c.border}`, borderRadius: 12, padding: 16,
};
const eyebrow: React.CSSProperties = {
  margin: '0 0 10px', fontFamily: 'monospace', fontSize: 10,
  letterSpacing: '0.18em', textTransform: 'uppercase', color: c.textDim,
};

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

  async function patch(updates: Record<string, unknown>): Promise<boolean> {
    setSaving(true); setError('');
    try {
      const response = await fetch(`/api/admin/linkedin-posts/${item.slug}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.error ?? 'No se pudo guardar');
      router.refresh();
      return true;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo guardar');
      return false;
    } finally { setSaving(false); }
  }

  // El texto que cuenta es el de la pantalla: el requisito se marca apenas se
  // guarda, sin esperar el refetch.
  const hasContent = body.trim().length > 0;
  const hasPdf = Boolean(item.pdf_storage_path || item.carousel_pdf_url);
  const blocked = !hasContent ? 'Falta cargar el texto' : !hasPdf ? 'Falta subir el PDF' : null;
  const next: PostPublicationStatus | null = item.status === 'planificado' ? 'preaprobado'
    : item.status === 'preaprobado' ? 'publicado' : null;
  // Volver atrás nunca se bloquea: retroceder no necesita material.
  const canAdvance = Boolean(next) && (item.status !== 'planificado' || !blocked);

  return <div style={{ display: 'grid', gap: 14 }}>
    <section style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <StatusBadge status={item.status} />
        <span style={{ fontSize: 11, fontFamily: 'monospace', color: c.textDim }}>
          {item.slot} · vinculado a {item.post_slug ?? 'sin post'}
        </span>
      </div>
      <div style={{ display: 'grid', gap: 11 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
          <label style={{ ...s.label, flex: 1 }}>Título
            <input style={s.input} value={title} onChange={(event) => setTitle(event.target.value)}
              onBlur={() => { if (title !== item.title && title.trim()) patch({ title }); }} />
          </label>
          <CopyIconButton text={title} label="Copiar título" />
        </div>
        <label style={s.label}>Fecha
          <input type="datetime-local" style={s.input} value={scheduledAt}
            onChange={(event) => setScheduledAt(event.target.value)}
            onBlur={() => { if (scheduledAt) patch({ scheduled_at: new Date(scheduledAt).toISOString() }); }} />
        </label>
        <label style={s.label}>URL publicada (opcional)
          <input type="url" style={s.input} value={publishedUrl} placeholder="https://www.linkedin.com/posts/..."
            onChange={(event) => setPublishedUrl(event.target.value)}
            onBlur={() => { if (publishedUrl !== (item.published_url ?? '')) patch({ published_url: publishedUrl }); }} />
        </label>
        <p style={{ margin: 0, fontSize: 11, color: c.textDim }}>Se guardan solos al salir del campo.</p>
      </div>
    </section>

    <ContentPanel title="Texto de LinkedIn" value={body}
      onSave={async (text) => {
        const ok = await patch({ body: text });
        if (ok) setBody(text);
        return ok;
      }}
      onAttachMarkdown={async (markdown, filename) => {
        const ok = await patch({ source_markdown: markdown, source_filename: filename });
        if (ok) {
          const response = await fetch(`/api/admin/linkedin-posts/${item.slug}`);
          const json = await response.json().catch(() => ({}));
          setBody(json.item?.body ?? '');
          if (json.item?.title) setTitle(json.item.title);
        }
        return ok;
      }} />

    <PdfSlot slug={item.slug} name={item.pdf_original_name} size={item.pdf_size_bytes}
      hasPdf={hasPdf} onChanged={() => router.refresh()} />

    <section style={card}>
      <p style={eyebrow}>Estado</p>
      <p style={{ margin: '0 0 12px', fontSize: 12, color: c.textDim }}>
        Para salir de planificado hacen falta las dos cosas. Se cargan por separado.
      </p>
      <div style={{ display: 'grid', gap: 7, marginBottom: 14 }}>
        <Requirement done={hasContent} label="Texto"
          detail={hasContent ? `${body.trim().length.toLocaleString('es-AR')} car.` : 'sin cargar'} />
        <Requirement done={hasPdf} label="PDF" detail={hasPdf ? (item.pdf_original_name ?? 'guardado') : 'sin subir'} />
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {next && <button
          className={canAdvance ? 'transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]' : ''}
          style={{ ...s.btn, ...(canAdvance ? {} : { opacity: .4, cursor: 'not-allowed' }) }}
          disabled={saving || !canAdvance} title={canAdvance ? undefined : blocked ?? undefined}
          onClick={() => patch({ status: next })}
        >Marcar {STATUS_LABELS[next].toLowerCase()} →</button>}
        {!canAdvance && blocked && <span style={{ fontSize: 11, color: c.incomplete, maxWidth: 220, lineHeight: 1.4 }}>{blocked}</span>}
        {item.status !== 'planificado' && <button
          className="transition-colors hover:border-[#00d4d4] hover:text-[#00d4d4]"
          style={s.btnGhost} disabled={saving}
          onClick={() => patch({ status: item.status === 'publicado' ? 'preaprobado' : 'planificado' })}
        >← Volver atrás</button>}
      </div>
      {error && <p role="alert" style={{ margin: '12px 0 0', padding: '9px 12px', borderRadius: 8, border: `1px solid ${c.late}`, background: tint(c.late, '0f'), color: c.late, fontSize: 12 }}>{error}</p>}
    </section>

    <details style={card}>
      <summary style={{ cursor: 'pointer', fontWeight: 600, color: c.text, fontSize: 13 }}>Fuente Markdown preservada</summary>
      <p style={{ margin: '10px 0', fontSize: 11, color: c.textDim }}>{item.source_filename ?? 'Sin archivo fuente'}</p>
      <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', color: c.textSoft, fontSize: 12, lineHeight: 1.6, margin: 0 }}>
        {item.source_markdown ?? 'Sin fuente importada.'}
      </pre>
      {item.source_markdown && <div style={{ marginTop: 10 }}>
        <CopyIconButton text={item.source_markdown} label="Copiar el Markdown original" />
      </div>}
    </details>
  </div>;
}
