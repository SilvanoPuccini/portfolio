'use client';

import { useCallback, useEffect, useState } from 'react';
import { s } from '@/components/admin/AdminShell';
import { AgendaCalendar } from '@/components/admin/agenda/AgendaCalendar';
import { AgendaDetailPanel } from '@/components/admin/agenda/AgendaDetailPanel';
import { StatusBadge, STATUS_LABELS } from '@/components/admin/agenda/StatusBadge';
import { StatusActions } from '@/components/admin/agenda/StatusActions';
import { fmt } from '@/components/admin/agenda/format';
import { slugifyTitle } from '@/lib/post-publications/types';
import type { PostPublication, PostPublicationStatus } from '@/lib/post-publications/types';

type StatusFilter = 'all' | PostPublicationStatus;

const PER_PAGE = 20;
const ALL_ITEMS_PAGE_SIZE = 200;

export default function AgendaPage() {
  // Todos los items (sin filtro/paginar) — alimenta calendario y panel lateral.
  const [allItems, setAllItems] = useState<PostPublication[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  // Vista de tabla, con su propio filtro y paginación.
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [tableItems, setTableItems] = useState<PostPublication[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const loadAll = useCallback(async () => {
    const res = await fetch(`/api/admin/posts-agenda?page=1&per_page=${ALL_ITEMS_PAGE_SIZE}`);
    const json = await res.json();
    if (res.ok) setAllItems(json.items ?? []);
  }, []);

  const loadTable = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (filter !== 'all') params.set('status', filter);
      const res = await fetch(`/api/admin/posts-agenda?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Error al cargar la agenda');
      setTableItems(json.items ?? []);
      setTotal(json.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la agenda');
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    loadTable();
  }, [loadTable]);

  function refreshAll() {
    loadAll();
    loadTable();
  }

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
    refreshAll();
  }

  const statuses: StatusFilter[] = ['all', 'planificado', 'preaprobado', 'publicado'];
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={s.eyebrow}>El Radar</div>
          <h1 style={s.heading}>Agenda editorial</h1>
        </div>
        <button
          className="transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
          style={s.btn}
          onClick={() => setShowNew(true)}
        >
          + Nuevo post
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 280px',
          gap: 20,
          marginBottom: 40,
          alignItems: 'start',
        }}
      >
        <AgendaCalendar items={allItems} selectedSlug={selectedSlug} onSelect={setSelectedSlug} />
        <AgendaDetailPanel items={allItems} selectedSlug={selectedSlug} onChangeStatus={changeStatus} />
      </div>

      <h2 style={{ ...s.sectionTitle, marginBottom: 16 }}>Todos los posts</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {statuses.map((st) => (
          <button
            key={st}
            className="transition-colors hover:border-[#00d4d4] hover:text-[#00d4d4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
            onClick={() => {
              setFilter(st);
              setPage(1);
            }}
            style={{
              ...s.btnGhost,
              ...(filter === st ? { borderColor: '#00d4d4', color: '#00d4d4', background: 'rgba(0,212,212,0.06)' } : {}),
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
        ) : tableItems.length === 0 ? (
          <div style={s.hint}>No hay posts en este estado todavía.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', fontSize: 12, opacity: 0.6 }}>
                <th style={{ padding: '10px 14px' }}>Título</th>
                <th style={{ padding: '10px 14px' }}>Programado</th>
                <th style={{ padding: '10px 14px' }}>Estado</th>
                <th style={{ padding: '10px 14px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tableItems.map((item) => (
                <tr
                  key={item.post_slug}
                  className="transition-colors hover:bg-white/[0.02]"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <td style={{ padding: '14px' }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{item.raw_title}</div>
                    <div style={{ fontSize: 12, opacity: 0.5, fontFamily: 'monospace' }}>{item.post_slug}</div>
                  </td>
                  <td style={{ padding: '14px', fontSize: 13, whiteSpace: 'nowrap' }}>{fmt(item.scheduled_at)}</td>
                  <td style={{ padding: '14px' }}>
                    <StatusBadge status={item.status} />
                  </td>
                  <td style={{ padding: '14px' }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <a
                        href={`/admin/agenda/${item.post_slug}`}
                        className="transition-colors hover:border-[#00d4d4] hover:text-[#00d4d4]"
                        style={s.btnGhost}
                      >
                        Ver →
                      </a>
                      <StatusActions item={item} onChange={changeStatus} />
                    </div>
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

      {showNew && <NewAgendaItemModal onClose={() => setShowNew(false)} onCreated={refreshAll} />}
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
