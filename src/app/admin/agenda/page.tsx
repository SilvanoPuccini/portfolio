'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { s } from '@/components/admin/AdminShell';
import { AgendaCalendar } from '@/components/admin/agenda/AgendaCalendar';
import { AgendaDetailPanel } from '@/components/admin/agenda/AgendaDetailPanel';
import { StatusBadge, STATUS_LABELS } from '@/components/admin/agenda/StatusBadge';
import { StatusActions } from '@/components/admin/agenda/StatusActions';
import { ContentBadge } from '@/components/admin/agenda/ContentBadge';
import { fmt } from '@/components/admin/agenda/format';
import { slugifyTitle } from '@/lib/post-publications/types';
import type { PostPublicationListItem, PostPublicationStatus } from '@/lib/post-publications/types';

type StatusFilter = 'all' | PostPublicationStatus;
type MonthFilter = 'all' | string; // 'YYYY-MM'

/**
 * La agenda entera son ~50 filas al año: se traen todas de una sola vez y el
 * filtrado y la paginación se resuelven en memoria. Antes había un segundo
 * fetch por página que podía mostrar una tabla desfasada del calendario.
 */
const PER_PAGE = 4;
const ALL_ITEMS_PAGE_SIZE = 200;

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function monthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key: string): string {
  const [year, month] = key.split('-');
  return `${MONTH_NAMES[Number(month) - 1]} ${year}`;
}

/**
 * Qué mes se está mirando, no qué número de página: "3 / 5" no dice nada,
 * "Septiembre 2026" sí. Una página puede quedar a caballo entre dos meses,
 * y entonces se nombran los dos.
 */
function rangeLabel(items: PostPublicationListItem[]): string {
  if (items.length === 0) return '';
  const first = monthKey(items[0].scheduled_at);
  const last = monthKey(items[items.length - 1].scheduled_at);
  return first === last ? monthLabel(first) : `${monthLabel(first)} – ${monthLabel(last)}`;
}

export default function AgendaPage() {
  const [allItems, setAllItems] = useState<PostPublicationListItem[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [monthFilter, setMonthFilter] = useState<MonthFilter>('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/posts-agenda?page=1&per_page=${ALL_ITEMS_PAGE_SIZE}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Error al cargar la agenda');
      setAllItems(json.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la agenda');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Meses que realmente tienen posts: no tiene sentido ofrecer un mes vacío.
  const months = useMemo(() => {
    const set = new Set(allItems.map((item) => monthKey(item.scheduled_at)));
    return [...set].sort();
  }, [allItems]);

  const filtered = useMemo(
    () =>
      allItems
        .filter((item) => statusFilter === 'all' || item.status === statusFilter)
        .filter((item) => monthFilter === 'all' || monthKey(item.scheduled_at) === monthFilter)
        .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()),
    [allItems, statusFilter, monthFilter],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  // Clamp: si el filtro achica el resultado, la página 3 dejaría la tabla vacía.
  const currentPage = Math.min(page, totalPages);
  const rangeStart = (currentPage - 1) * PER_PAGE + 1;
  const visible = filtered.slice(rangeStart - 1, currentPage * PER_PAGE);
  const rangeEnd = rangeStart + visible.length - 1;

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
    loadAll();
  }

  const statuses: StatusFilter[] = ['all', 'planificado', 'preaprobado', 'publicado'];

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

      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {statuses.map((st) => (
            <button
              key={st}
              className="transition-colors hover:border-[#00d4d4] hover:text-[#00d4d4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              style={{
                ...s.btnGhost,
                ...(statusFilter === st
                  ? { borderColor: '#00d4d4', color: '#00d4d4', background: 'rgba(0,212,212,0.06)' }
                  : {}),
              }}
            >
              {st === 'all' ? 'Todos' : STATUS_LABELS[st]}
            </button>
          ))}
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748b' }}>
          Mes
          <select
            value={monthFilter}
            onChange={(e) => {
              setMonthFilter(e.target.value);
              setPage(1);
            }}
            style={{ ...s.btnGhost, cursor: 'pointer' }}
          >
            <option value="all">Todos los meses</option>
            {months.map((key) => (
              <option key={key} value={key}>
                {monthLabel(key)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <div style={s.errorText}>{error}</div>}

      <div style={s.card}>
        {loading ? (
          <div style={s.hint}>Cargando…</div>
        ) : visible.length === 0 ? (
          <div style={s.hint}>No hay posts con estos filtros.</div>
        ) : (
          // tableLayout fixed + anchos: sin esto un título largo redistribuye
          // todas las columnas y la tabla "baila" al cambiar de filtro.
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr
                style={{
                  textAlign: 'left',
                  fontFamily: 'monospace',
                  fontSize: 11,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#64748b',
                }}
              >
                <th style={{ padding: '10px 14px', fontWeight: 500 }}>Título</th>
                <th style={{ padding: '10px 14px', fontWeight: 500, width: 150 }}>Programado</th>
                <th style={{ padding: '10px 14px', fontWeight: 500, width: 120 }}>Estado</th>
                <th style={{ padding: '10px 14px', fontWeight: 500, width: 300 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => (
                <tr
                  key={item.post_slug}
                  className="transition-colors hover:bg-white/[0.02]"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <td style={{ padding: '14px', minWidth: 0 }}>
                    <a
                      href={`/admin/agenda/${item.post_slug}`}
                      className="transition-colors hover:text-[#00d4d4]"
                      style={{
                        display: 'block',
                        fontWeight: 600,
                        marginBottom: 4,
                        color: '#e2e8f0',
                        textDecoration: 'none',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={item.raw_title}
                    >
                      {item.raw_title}
                    </a>
                    <div
                      style={{
                        fontSize: 12,
                        opacity: 0.5,
                        fontFamily: 'monospace',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.post_slug}
                    </div>
                  </td>
                  <td style={{ padding: '14px', fontSize: 13, whiteSpace: 'nowrap' }}>{fmt(item.scheduled_at)}</td>
                  <td style={{ padding: '14px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
                      <StatusBadge status={item.status} />
                      <ContentBadge hasContent={item.has_content} chars={item.content_chars} />
                    </div>
                  </td>
                  <td style={{ padding: '14px' }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <a
                        href={`/admin/agenda/${item.post_slug}`}
                        className="transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
                        style={{
                          background: 'rgba(0,212,212,0.12)',
                          color: '#00d4d4',
                          border: '1px solid rgba(0,212,212,0.45)',
                          borderRadius: 8,
                          padding: '8px 16px',
                          fontWeight: 600,
                          fontSize: 12,
                          textDecoration: 'none',
                          whiteSpace: 'nowrap',
                        }}
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
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginTop: 16,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <button
            className="transition-colors hover:border-[#00d4d4] hover:text-[#00d4d4] disabled:opacity-35"
            style={s.btnGhost}
            disabled={currentPage <= 1}
            onClick={() => setPage(currentPage - 1)}
          >
            ← Ant.
          </button>
          <div style={{ textAlign: 'center', minWidth: 160 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{rangeLabel(visible)}</div>
            <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#64748b', marginTop: 2 }}>
              {rangeStart}–{rangeEnd} de {filtered.length}
            </div>
          </div>
          <button
            className="transition-colors hover:border-[#00d4d4] hover:text-[#00d4d4] disabled:opacity-35"
            style={s.btnGhost}
            disabled={currentPage >= totalPages}
            onClick={() => setPage(currentPage + 1)}
          >
            Sig. →
          </button>
        </div>
      )}

      {showNew && <NewAgendaItemModal onClose={() => setShowNew(false)} onCreated={loadAll} />}
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
