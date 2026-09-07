'use client';

import { useState } from 'react';
import { s } from '@/components/admin/AdminShell';
import { slugifyTitle } from '@/lib/post-publications/types';

export function AgendaItemModal({
  initialScheduledAt = '',
  onClose,
  onCreated,
}: {
  initialScheduledAt?: string;
  onClose: () => void;
  onCreated: () => void | Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [content, setContent] = useState('');
  const [scheduledAt, setScheduledAt] = useState(initialScheduledAt);
  const [notify, setNotify] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugifyTitle(value));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title || !slug || !scheduledAt) {
      setError('Título, slug y fecha programada son obligatorios');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/posts-agenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_slug: slug,
          raw_title: title,
          raw_content: content || undefined,
          scheduled_at: new Date(scheduledAt).toISOString(),
          notify_subscribers: notify,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? 'No se pudo crear');
      await onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: 20,
      }}
      onClick={() => {
        if (!saving) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-agenda-item-title"
    >
      <div style={{ ...s.card, width: 560, maxWidth: '100%' }} onClick={(e) => e.stopPropagation()}>
        <h2 id="new-agenda-item-title" style={s.sectionTitle}>Nuevo post en agenda</h2>
        <form style={s.form} onSubmit={handleSubmit}>
          <label style={s.label}>
            Título
            <input
              autoFocus
              style={s.input}
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Mi stack no es una lista de tecnologías..."
              required
            />
          </label>
          <label style={s.label}>
            Slug
            <input
              style={s.input}
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              required
            />
          </label>
          <label style={s.label}>
            Texto en bruto (opcional, se puede completar después)
            <textarea
              style={{ ...s.input, minHeight: 140, fontFamily: 'inherit' }}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </label>
          <label style={s.label}>
            Programado para
            <input
              type="datetime-local"
              style={s.input}
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
            />
          </label>
          <label style={{ ...s.label, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
            Mandar newsletter automático al publicar
          </label>

          {error && <div role="alert" style={s.errorText}>{error}</div>}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" style={s.btnGhost} onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" style={s.btn} disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar en agenda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
