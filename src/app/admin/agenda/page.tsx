'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { s } from '@/components/admin/AdminShell';
import { AgendaCalendar } from '@/components/admin/agenda/AgendaCalendar';
import { AgendaDetailPanel } from '@/components/admin/agenda/AgendaDetailPanel';
import { AgendaItemModal } from '@/components/admin/agenda/AgendaItemModal';
import { DeleteAgendaItemButton } from '@/components/admin/agenda/DeleteAgendaItemButton';
import { StatusBadge, STATUS_LABELS } from '@/components/admin/agenda/StatusBadge';
import { StatusActions } from '@/components/admin/agenda/StatusActions';
import { ContentBadge } from '@/components/admin/agenda/ContentBadge';
import { fmt } from '@/components/admin/agenda/format';
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
  const [newScheduledAt, setNewScheduledAt] = useState<string | null>(null);

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
      // El error va al banner de la página, no a un alert() del navegador:
      // el confirm nativo ya se reemplazó, y un alert acá dejaría la mitad
      // del circuito con el cartel gris del sistema operativo.
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? 'No se pudo cambiar el estado');
      return;
    }
    setError(null);
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
          onClick={() => setNewScheduledAt('')}
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
        <AgendaCalendar
          items={allItems}
          selectedSlug={selectedSlug}
          onSelect={setSelectedSlug}
          onCreate={setNewScheduledAt}
        />
        <AgendaDetailPanel
          items={allItems}
          selectedSlug={selectedSlug}
          onChangeStatus={changeStatus}
          onDeleted={async () => {
            setSelectedSlug(null);
            await loadAll();
          }}
        />
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
                      <DeleteAgendaItemButton
                        slug={item.post_slug}
                        title={item.raw_title}
                        onDeleted={async () => {
                          if (selectedSlug === item.post_slug) setSelectedSlug(null);
                          await loadAll();
                        }}
                      />
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

      {newScheduledAt !== null && (
        <AgendaItemModal
          initialScheduledAt={newScheduledAt}
          onClose={() => setNewScheduledAt(null)}
          onCreated={loadAll}
        />
      )}
    </div>
  );
}
