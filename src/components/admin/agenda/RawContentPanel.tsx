'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { s } from '@/components/admin/AdminShell';
import { ContentPanel } from '@/components/admin/ContentPanel';
import { CopyIconButton, ConfirmIconButton, CrossIcon } from '@/components/admin/IconButton';
import { c, tint } from '@/components/admin/tokens';
import { StatusActions } from './StatusActions';
import type { PostPublication, PostPublicationStatus } from '@/lib/post-publications/types';

const card: React.CSSProperties = {
  background: c.surface, border: `1px solid ${c.border}`, borderRadius: 12, padding: 16,
};
const eyebrow: React.CSSProperties = {
  margin: '0 0 10px', fontFamily: 'monospace', fontSize: 10,
  letterSpacing: '0.18em', textTransform: 'uppercase', color: c.textDim,
};

/**
 * Detalle de un post del blog: datos, texto y estado.
 *
 * El texto se edita donde se lee y se guarda al salir del campo; el .md se
 * arrastra sobre el mismo bloque. Los botones de estado están acá abajo a
 * propósito, porque preaprobar depende de que haya texto.
 */
export function RawContentPanel({ item }: { item: PostPublication }) {
  const router = useRouter();
  const [content, setContent] = useState(item.raw_content ?? '');
  const [title, setTitle] = useState(item.raw_title);
  const [scheduledAt, setScheduledAt] = useState(() => {
    const date = new Date(item.scheduled_at);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function patch(body: Record<string, unknown>): Promise<boolean> {
    setSaving(true); setError('');
    try {
      const response = await fetch(`/api/admin/posts-agenda/${item.post_slug}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
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

  async function remove() {
    const response = await fetch(`/api/admin/posts-agenda/${encodeURIComponent(item.post_slug)}`, { method: 'DELETE' });
    if (!response.ok) {
      const json = await response.json().catch(() => ({}));
      return setError(json.error ?? 'No se pudo eliminar');
    }
    router.push('/admin/agenda');
    router.refresh();
  }

  return <div style={{ display: 'grid', gap: 14, marginTop: 18 }}>
    <section style={card}>
      <p style={eyebrow}>Datos del post</p>
      <div style={{ display: 'grid', gap: 11 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
          <label style={{ ...s.label, flex: 1 }}>Título
            <input style={s.input} value={title} onChange={(event) => setTitle(event.target.value)}
              onBlur={() => { if (title !== item.raw_title && title.trim()) patch({ raw_title: title }); }} />
          </label>
          <CopyIconButton text={title} label="Copiar título" />
        </div>
        <label style={s.label}>Programado para
          <input type="datetime-local" style={s.input} value={scheduledAt}
            onChange={(event) => setScheduledAt(event.target.value)}
            onBlur={() => { if (scheduledAt) patch({ scheduled_at: new Date(scheduledAt).toISOString() }); }} />
        </label>
        <p style={{ margin: 0, fontSize: 11, color: c.textDim }}>Se guardan solos al salir del campo.</p>
      </div>
    </section>

    <ContentPanel title="Texto en bruto" value={content}
      onSave={async (text) => {
        const ok = await patch({ raw_content: text });
        if (ok) setContent(text);
        return ok;
      }}
      onAttachMarkdown={async (markdown) => {
        const ok = await patch({ source_markdown: markdown });
        if (ok) {
          const response = await fetch(`/api/admin/posts-agenda/${item.post_slug}`);
          const json = await response.json().catch(() => ({}));
          setContent(json.item?.raw_content ?? '');
        }
        return ok;
      }} />

    <section style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <p style={{ ...eyebrow, margin: 0 }}>Estado</p>
        <span style={{ marginLeft: 'auto' }}>
          <ConfirmIconButton label="Eliminar de la agenda" question="¿Eliminar el post?" onConfirm={remove}>
            <CrossIcon />
          </ConfirmIconButton>
        </span>
      </div>
      <StatusActions
        item={{ title, status: item.status, has_content: content.trim().length > 0 }}
        onChange={(status: PostPublicationStatus) => patch({ status })}
      />
      {saving && <p style={{ margin: '10px 0 0', fontSize: 11, color: c.textDim }}>Guardando…</p>}
      {error && <p role="alert" style={{ margin: '10px 0 0', padding: '9px 12px', borderRadius: 8, border: `1px solid ${c.late}`, background: tint(c.late, '0f'), color: c.late, fontSize: 12 }}>{error}</p>}
    </section>
  </div>;
}
