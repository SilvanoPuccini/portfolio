'use client';

import { useCallback, useEffect, useState } from 'react';
import { s } from '@/components/admin/AdminShell';
import { AgendaCalendar } from '@/components/admin/agenda/AgendaCalendar';
import { slugifyTitle } from '@/lib/post-publications/types';
import type {
  PostPublication,
  PostPublicationStatus,
} from '@/lib/post-publications/types';

type StatusFilter = 'all' | PostPublicationStatus;

const STATUS_LABELS: Record<PostPublicationStatus, string> = {
  planificado: 'Planificado',
  preaprobado: 'Preaprobado',
  publicado: 'Publicado',
};

const STATUS_COLORS: Record<PostPublicationStatus, { bg: string; color: string }> = {
  planificado: { bg: 'rgba(100,116,139,0.12)', color: '#64748b' },
  preaprobado: { bg: 'rgba(0,212,212,0.1)', color: '#00d4d4' },
  publicado: { bg: 'rgba(74,222,128,0.1)', color: '#4ade80' },
};

function StatusBadge({ status }: { status: PostPublicationStatus }) {
  const { bg, color } = STATUS_COLORS[status];
  return (
    <span
      style={{
        fontSize: 11,
        padding: '3px 10px',
        borderRadius: 20,
        fontFamily: 'monospace',
        background: bg,
        color,
      }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const PER_PAGE = 20;

function AgendaSummary({ refreshKey }: { refreshKey: number }) {
  const [next, setNext] = useState<PostPublication | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/posts-agenda?page=1')
      .then((r) => r.json())
      .then((json: { items?: PostPublication[] }) => {
        if (cancelled) return;
        const now = Date.now();
        const upcoming = (json.items ?? []).find(
          (item) => new Date(item.scheduled_at).getTime() >= now && item.status !== 'publicado',
        );
        setNext(upcoming ?? null);
      })
      .catch(() => !cancelled && setNext(null));
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (next === undefined) return null;
  if (next === null) {
    return (
      <div style={{ ...s.card, marginBottom: 16 }}>
        <p style={s.hint}>No hay ningún post con fecha programada a futuro en la agenda.</p>
      </div>
    );
  }

  const scheduledAt = new Date(next.scheduled_at);
  const daysLeft = Math.ceil((scheduledAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const atRisk = next.status === 'planificado' && daysLeft <= 3;

  return (
    <div
      style={{
        ...s.card,
        marginBottom: 16,
        borderColor: atRisk ? '#f87171' : undefined,
        background: atRisk ? 'rgba(248,113,113,0.06)' : undefined,
      }}
    >
      <p style={s.eyebrow}>Próximo en la agenda</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 600, fontSize: 15 }}>{next.raw_title}</span>
        <StatusBadge status={next.status} />
        <span style={{ fontSize: 13, opacity: 0.7 }}>{fmt(next.scheduled_at)}</span>
        <span style={{ fontSize: 13, opacity: 0.7 }}>
          {daysLeft <= 0 ? 'hoy' : `en ${daysLeft} día${daysLeft === 1 ? '' : 's'}`}
        </span>
      </div>
      {atRisk && (
        <p style={{ ...s.errorText, marginTop: 10, marginBottom: 0 }}>
          Faltan {daysLeft} día{daysLeft === 1 ? '' : 's'} y todavía está en planificado — sin
          hardcodear ni revisar. No va a llegar a tiempo si no se avanza.
        </p>
      )}
    </div>
  );
}

export default function AgendaPage() {
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [items, setItems] = useState<PostPublication[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [summaryKey, setSummaryKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (filter !== 'all') params.set('status', filter);
      const res = await fetch(`/api/admin/posts-agenda?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Error al cargar la agenda');
      setItems(json.items ?? []);
      setTotal(json.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la agenda');
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(slug: string, status: PostPublicationStatus) {
    const res = await fetch(`/api/admin/posts-agenda/${slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      alert(json.error ?? 'No se pudo cambiar el estado');
      return;
    }
    load();
    setSummaryKey((k) => k + 1);
  }

  const statuses: StatusFilter[] = ['all', 'planificado', 'preaprobado', 'publicado'];
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div style={s.center}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={s.eyebrow}>El Radar</div>
          <h1 style={s.heading}>Agenda editorial</h1>
        </div>
        <button style={s.btn} onClick={() => setShowNew(true)}>
          + Nuevo post
        </button>
      </div>

      <AgendaSummary refreshKey={summaryKey} />

      <AgendaCalendar refreshKey={summaryKey} />

      <h2 style={{ ...s.sectionTitle, marginBottom: 12 }}>Todos los posts</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {statuses.map((st) => (
          <button
            key={st}
            onClick={() => {
              setFilter(st);
              setPage(1);
            }}
            style={{
              ...s.btnGhost,
              ...(filter === st
                ? { borderColor: '#00d4d4', color: '#00d4d4' }
                : {}),
            }}
          >
            {st === 'all' ? 'Todos' : STATUS_LABELS[st]}
          </button>
        ))}
      </div>

      {error && <div style={s.errorText}>{error}</div>}

      <div style={s.card}>
        {loading ? (
          <div style={s.hint}>Cargando…</div>
        ) : items.length === 0 ? (
          <div style={s.hint}>No hay posts en este estado todavía.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', fontSize: 12, opacity: 0.6 }}>
                <th style={{ padding: '8px 12px' }}>Título</th>
                <th style={{ padding: '8px 12px' }}>Programado</th>
                <th style={{ padding: '8px 12px' }}>Estado</th>
                <th style={{ padding: '8px 12px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.post_slug} style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: 600 }}>{item.raw_title}</div>
                    <div style={{ fontSize: 12, opacity: 0.5, fontFamily: 'monospace' }}>
                      {item.post_slug}
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 13 }}>{fmt(item.scheduled_at)}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <StatusBadge status={item.status} />
                  </td>
                  <td style={{ padding: '10px 12px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <a href={`/admin/agenda/${item.post_slug}`} style={s.btnGhost}>
                      Ver →
                    </a>
                    {item.status === 'planificado' && (
                      <button
                        style={s.btnGhost}
                        onClick={() => changeStatus(item.post_slug, 'preaprobado')}
                      >
                        Marcar preaprobado
                      </button>
                    )}
                    {item.status === 'preaprobado' && (
                      <button
                        style={s.btnGhost}
                        onClick={() => {
                          if (confirm(`¿Publicar "${item.raw_title}" ahora? Se hace visible y se manda el mail.`)) {
                            changeStatus(item.post_slug, 'publicado');
                          }
                        }}
                      >
                        Publicar ahora
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'center' }}>
          <button style={s.btnGhost} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            ← Ant.
          </button>
          <span style={s.hint}>
            {page} / {totalPages}
          </span>
          <button style={s.btnGhost} disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Sig. →
          </button>
        </div>
      )}

      {showNew && (
        <NewAgendaItemModal
          onClose={() => setShowNew(false)}
          onCreated={() => {
            load();
            setSummaryKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}

function NewAgendaItemModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [content, setContent] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [notify, setNotify] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugifyTitle(value));
  }

  async function handleSubmit() {
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
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'No se pudo crear');
      onCreated();
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
      }}
      onClick={onClose}
    >
      <div style={{ ...s.card, width: 560, maxWidth: '90vw' }} onClick={(e) => e.stopPropagation()}>
        <h2 style={s.sectionTitle}>Nuevo post en agenda</h2>
        <div style={s.form}>
          <label style={s.label}>
            Título
            <input
              style={s.input}
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Mi stack no es una lista de tecnologías..."
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
            />
          </label>
          <label style={{ ...s.label, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
            Mandar newsletter automático al publicar
          </label>

          {error && <div style={s.errorText}>{error}</div>}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <button style={s.btnGhost} onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button style={s.btn} onClick={handleSubmit} disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar en agenda'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
