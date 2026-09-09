'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AgendaCalendar } from '@/components/admin/agenda/AgendaCalendar';
import { AgendaDetailPanel } from '@/components/admin/agenda/AgendaDetailPanel';
import { AgendaItemModal } from '@/components/admin/agenda/AgendaItemModal';
import { WeekPulse } from '@/components/admin/agenda/WeekPulse';
import { StatusBadge, STATUS_LABELS } from '@/components/admin/agenda/StatusBadge';
import { ContentBadge } from '@/components/admin/agenda/ContentBadge';
import { fmt } from '@/components/admin/agenda/format';
import { c, itemTone, tint, CHANNEL_LABEL } from '@/components/admin/tokens';
import type { AgendaItem, AgendaChannel } from '@/lib/agenda/types';
import type { PostPublicationStatus } from '@/lib/post-publications/types';

type Filter<T extends string> = 'all' | T;
/** Vista por completitud: cruza los estados sin reemplazarlos. */
type ReadyFilter = 'all' | 'incomplete';

/**
 * La agenda entera son unas pocas decenas de filas al año: se traen todas de
 * una vez y el filtrado y la paginación se resuelven en memoria, para que la
 * tabla nunca quede desfasada del calendario.
 */
const PER_PAGE = 8;

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const STATUSES = ['all', 'planificado', 'preaprobado', 'publicado'] as const;
const CHANNELS = ['all', 'blog', 'linkedin'] as const;

function monthKey(iso: string) {
  const date = new Date(iso);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key: string) {
  const [year, month] = key.split('-');
  return `${MONTH_NAMES[Number(month) - 1]} ${year}`;
}

/**
 * Qué mes se está mirando, no qué número de página: "3 / 5" no dice nada,
 * "Septiembre 2026" sí. Una página puede quedar a caballo de dos meses, y
 * entonces se nombran los dos.
 */
function rangeLabel(items: AgendaItem[]) {
  if (items.length === 0) return '';
  const first = monthKey(items[0].scheduled_at);
  const last = monthKey(items[items.length - 1].scheduled_at);
  return first === last ? monthLabel(first) : `${monthLabel(first)} – ${monthLabel(last)}`;
}

const chip = (active: boolean): React.CSSProperties => ({
  background: active ? tint(c.ready, '12') : 'transparent',
  color: active ? c.ready : c.textSoft,
  border: `1px solid ${active ? c.ready : c.border}`,
  borderRadius: 7, padding: '6px 13px', fontSize: 12, fontWeight: 500, cursor: 'pointer',
});

/** Contador que además filtra: el número y la acción son la misma cosa. */
function StatTile({ tone, value, label, active, onClick }: {
  tone: string; value: number; label: string; active: boolean; onClick: () => void;
}) {
  return <button type="button" onClick={onClick} aria-pressed={active}
    className="transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
    style={{
      flex: '1 1 130px', minWidth: 0, textAlign: 'left', cursor: 'pointer',
      background: active ? tint(tone, '1a') : c.surface,
      border: `1px solid ${active ? tone : c.border}`,
      borderLeft: `3px solid ${tone}`,
      borderRadius: 10, padding: '11px 14px',
    }}>
    <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1, color: tone, letterSpacing: '-0.02em' }}>{value}</div>
    <div style={{ marginTop: 5, fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: active ? c.text : c.textDim }}>
      {label}
    </div>
  </button>;
}

export default function AgendaPage() {
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<Filter<PostPublicationStatus>>('all');
  const [channel, setChannel] = useState<Filter<AgendaChannel>>('all');
  const [ready, setReady] = useState<ReadyFilter>('all');
  const [month, setMonth] = useState<'all' | string>('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [newScheduledAt, setNewScheduledAt] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch('/api/admin/agenda');
    const json = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) return setError(json.error ?? 'No se pudo cargar la agenda');
    setItems(json.items ?? []);
    setError('');
  }, []);
  useEffect(() => { load(); }, [load]);

  // Solo los meses que tienen piezas: no tiene sentido ofrecer un mes vacío.
  const months = useMemo(() => [...new Set(items.map((item) => monthKey(item.scheduled_at)))].sort(), [items]);

  const counts = useMemo(() => ({
    planificado: items.filter((item) => item.status === 'planificado').length,
    preaprobado: items.filter((item) => item.status === 'preaprobado').length,
    publicado: items.filter((item) => item.status === 'publicado').length,
    incompletas: items.filter((item) => item.status !== 'publicado' && !item.is_ready).length,
  }), [items]);

  const filtered = useMemo(() => items.filter((item) =>
    (status === 'all' || item.status === status)
    && (channel === 'all' || item.channel === channel)
    && (month === 'all' || monthKey(item.scheduled_at) === month)
    && (ready === 'all' || (item.status !== 'publicado' && !item.is_ready)),
  ), [items, status, channel, month, ready]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  // Clamp: si un filtro achica el resultado, la página 3 dejaría la tabla vacía.
  const currentPage = Math.min(page, totalPages);
  const rangeStart = (currentPage - 1) * PER_PAGE + 1;
  const visible = filtered.slice(rangeStart - 1, currentPage * PER_PAGE);
  const rangeEnd = rangeStart + visible.length - 1;

  /** Un tile enciende su vista y apaga las otras; volver a tocarlo la limpia. */
  function pickStatus(next: PostPublicationStatus) {
    setReady('all');
    setStatus((current) => (current === next ? 'all' : next));
    setPage(1);
  }

  async function changeStatus(item: AgendaItem, next: PostPublicationStatus) {
    const base = item.channel === 'blog' ? '/api/admin/posts-agenda' : '/api/admin/linkedin-posts';
    const response = await fetch(`${base}/${encodeURIComponent(item.source_id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    if (!response.ok) {
      const json = await response.json().catch(() => ({}));
      return setError(json.error ?? 'No se pudo cambiar el estado');
    }
    setError('');
    await load();
  }

  return <div>
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
      <div>
        <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: c.ready }}>El Radar</p>
        <h1 style={{ margin: '5px 0 0', fontSize: 23, fontWeight: 700, color: c.text, letterSpacing: '-0.02em' }}>Agenda editorial</h1>
      </div>
      <button
        className="transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
        style={{ background: c.ready, color: c.page, border: 0, borderRadius: 8, padding: '10px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
        onClick={() => setNewScheduledAt('')}
      >+ Nuevo post de blog</button>
    </header>

    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
      <StatTile tone={c.planned} value={counts.planificado} label="Planificado"
        active={status === 'planificado' && ready === 'all'} onClick={() => pickStatus('planificado')} />
      <StatTile tone={c.ready} value={counts.preaprobado} label="Preaprobado"
        active={status === 'preaprobado' && ready === 'all'} onClick={() => pickStatus('preaprobado')} />
      <StatTile tone={c.published} value={counts.publicado} label="Publicado"
        active={status === 'publicado' && ready === 'all'} onClick={() => pickStatus('publicado')} />
      <StatTile tone={c.incomplete} value={counts.incompletas} label="Falta material"
        active={ready === 'incomplete'}
        onClick={() => { setStatus('all'); setReady((current) => (current === 'incomplete' ? 'all' : 'incomplete')); setPage(1); }} />
    </div>

    {error && <div role="alert" style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 8, border: `1px solid ${c.late}`, background: tint(c.late, '0f'), color: c.late, fontSize: 13 }}>{error}</div>}

    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_310px]" style={{ alignItems: 'start', marginBottom: 30 }}>
      <AgendaCalendar items={items} selectedId={selectedId} onSelect={setSelectedId} onCreate={setNewScheduledAt} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <WeekPulse items={items} selectedId={selectedId} onSelect={setSelectedId} />
        <AgendaDetailPanel
          items={items}
          selectedId={selectedId}
          onChangeStatus={changeStatus}
          onDeleted={async () => { setSelectedId(null); await load(); }}
        />
      </div>
    </div>

    <h2 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: c.text }}>Todas las piezas</h2>

    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {CHANNELS.map((value) => <button key={value}
          className="transition-colors hover:border-[#00d4d4] hover:text-[#00d4d4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
          style={chip(channel === value)}
          onClick={() => { setChannel(value); setPage(1); }}
        >{value === 'all' ? 'Todos los canales' : CHANNEL_LABEL[value]}</button>)}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {STATUSES.map((value) => <button key={value}
          className="transition-colors hover:border-[#00d4d4] hover:text-[#00d4d4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
          style={chip(status === value && ready === 'all')}
          onClick={() => { setStatus(value); setReady('all'); setPage(1); }}
        >{value === 'all' ? 'Todos los estados' : STATUS_LABELS[value]}</button>)}
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: c.textDim }}>
        Mes
        <select value={month} onChange={(event) => { setMonth(event.target.value); setPage(1); }}
          style={{ ...chip(month !== 'all'), fontFamily: 'inherit' }}>
          <option value="all">Todos los meses</option>
          {months.map((key) => <option key={key} value={key}>{monthLabel(key)}</option>)}
        </select>
      </label>
    </div>

    <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 12, overflowX: 'auto' }}>
      {loading ? <p style={{ margin: 0, padding: 20, fontSize: 12, color: c.textDim }}>Cargando…</p>
        : visible.length === 0 ? <p style={{ margin: 0, padding: 20, fontSize: 12, color: c.textDim }}>No hay piezas con estos filtros.</p>
        : <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: 640 }}>
          <thead>
            <tr style={{ textAlign: 'left', fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: c.textDim }}>
              <th style={{ padding: '11px 16px', fontWeight: 500 }}>Título</th>
              <th style={{ padding: '11px 16px', fontWeight: 500, width: 100 }}>Canal</th>
              <th style={{ padding: '11px 16px', fontWeight: 500, width: 150 }}>Programado</th>
              <th style={{ padding: '11px 16px', fontWeight: 500, width: 150 }}>Estado</th>
              <th style={{ padding: '11px 16px', fontWeight: 500, width: 86 }} />
            </tr>
          </thead>
          <tbody>
            {visible.map((item) => <tr key={item.id}
              className="transition-colors hover:bg-white/[0.02]"
              style={{ borderTop: `1px solid ${c.border}` }}>
              {/* Barra de color al inicio de la fila: el mismo tono que en el
                  calendario, para que la tabla y la grilla se lean igual. */}
              <td style={{ padding: '13px 16px', minWidth: 0, boxShadow: `inset 3px 0 0 ${itemTone(item)}` }}>
                <a href={item.detail_path} title={item.title}
                  className="transition-colors hover:text-[#00d4d4]"
                  style={{ display: 'block', fontWeight: 600, fontSize: 13, color: c.text, textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >{item.title}</a>
                <div style={{ fontSize: 10, fontFamily: 'monospace', color: c.textDim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.source_id}</div>
              </td>
              <td style={{ padding: '13px 16px', fontSize: 12, color: c.textSoft }}>{CHANNEL_LABEL[item.channel]}</td>
              <td style={{ padding: '13px 16px', fontSize: 12, color: c.textSoft, whiteSpace: 'nowrap' }}>{fmt(item.scheduled_at)}</td>
              <td style={{ padding: '13px 16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-start' }}>
                  <StatusBadge status={item.status} />
                  <ContentBadge hasContent={item.has_content} chars={item.content_chars} />
                </div>
              </td>
              <td style={{ padding: '13px 16px' }}>
                <button type="button" onClick={() => setSelectedId(item.id)}
                  className="transition-colors hover:border-[#00d4d4] hover:text-[#00d4d4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
                  style={{ ...chip(false), padding: '6px 12px', whiteSpace: 'nowrap' }}
                >Ver →</button>
              </td>
            </tr>)}
          </tbody>
        </table>}
    </div>

    {totalPages > 1 && <div style={{ display: 'flex', gap: 12, marginTop: 14, justifyContent: 'center', alignItems: 'center' }}>
      <button className="transition-colors hover:border-[#00d4d4] hover:text-[#00d4d4] disabled:opacity-35"
        style={chip(false)} disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>← Ant.</button>
      <div style={{ textAlign: 'center', minWidth: 170 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{rangeLabel(visible)}</div>
        <div style={{ marginTop: 2, fontSize: 11, fontFamily: 'monospace', color: c.textDim }}>{rangeStart}–{rangeEnd} de {filtered.length}</div>
      </div>
      <button className="transition-colors hover:border-[#00d4d4] hover:text-[#00d4d4] disabled:opacity-35"
        style={chip(false)} disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>Sig. →</button>
    </div>}

    {newScheduledAt !== null && <AgendaItemModal initialScheduledAt={newScheduledAt} onClose={() => setNewScheduledAt(null)} onCreated={load} />}
  </div>;
}
