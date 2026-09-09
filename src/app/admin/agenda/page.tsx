'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AgendaCalendar } from '@/components/admin/agenda/AgendaCalendar';
import { AgendaItemModal } from '@/components/admin/agenda/AgendaItemModal';
import { WeekPulse } from '@/components/admin/agenda/WeekPulse';
import { STATUS_LABELS } from '@/components/admin/agenda/StatusBadge';
import { PieceRow, type Piece } from '@/components/admin/PieceRow';
import { PeriodPicker, inPeriod, periodLabel, type Period } from '@/components/admin/PeriodPicker';
import {
  attachPieceMarkdown, changePieceStatus, deletePiece, fetchPieceText, savePieceText,
} from '@/components/admin/pieceApi';
import { c, tint, CHANNEL_LABEL } from '@/components/admin/tokens';
import type { AgendaItem, AgendaChannel } from '@/lib/agenda/types';
import type { PostPublicationStatus } from '@/lib/post-publications/types';

type Filter<T extends string> = 'all' | T;
const STATUSES = ['all', 'planificado', 'preaprobado', 'publicado'] as const;
const CHANNELS = ['all', 'blog', 'linkedin'] as const;

const chip = (active: boolean): React.CSSProperties => ({
  background: active ? tint(c.ready, '12') : 'transparent',
  color: active ? c.ready : c.textSoft,
  border: `1px solid ${active ? c.ready : c.border}`,
  borderRadius: 7, padding: '6px 13px', fontSize: 12, fontWeight: 500, cursor: 'pointer',
  fontFamily: 'inherit',
});

function toPiece(item: AgendaItem): Piece {
  return {
    id: item.id, channel: item.channel, sourceId: item.source_id, title: item.title,
    scheduledAt: item.scheduled_at, status: item.status,
    hasContent: item.has_content, contentChars: item.content_chars,
    hasPdf: item.has_pdf, isReady: item.is_ready, detailPath: item.detail_path,
  };
}

function StatTile({ tone, value, label, active, onClick }: {
  tone: string; value: number; label: string; active: boolean; onClick: () => void;
}) {
  return <button type="button" onClick={onClick} aria-pressed={active}
    className="transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
    style={{
      flex: '1 1 130px', minWidth: 0, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
      background: active ? tint(tone, '1a') : c.surface,
      border: `1px solid ${active ? tone : c.border}`,
      borderLeft: `3px solid ${tone}`, borderRadius: 10, padding: '11px 14px',
    }}>
    <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1, color: tone, letterSpacing: '-0.02em' }}>{value}</div>
    <div style={{ marginTop: 5, fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: active ? c.text : c.textDim }}>
      {label}
    </div>
  </button>;
}

export default function AgendaPage() {
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [openId, setOpenId] = useState<string | null>(null);
  const [status, setStatus] = useState<Filter<PostPublicationStatus>>('all');
  const [channel, setChannel] = useState<Filter<AgendaChannel>>('all');
  const [onlyIncomplete, setOnlyIncomplete] = useState(false);
  const [period, setPeriod] = useState<Period>({ mode: 'mes', anchor: new Date().toISOString() });
  const [loading, setLoading] = useState(true);
  const [newScheduledAt, setNewScheduledAt] = useState<string | null>(null);
  const [error, setError] = useState('');
  const rows = useRef<HTMLDivElement>(null);

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

  const counts = useMemo(() => ({
    planificado: items.filter((item) => item.status === 'planificado').length,
    preaprobado: items.filter((item) => item.status === 'preaprobado').length,
    publicado: items.filter((item) => item.status === 'publicado').length,
    incompletas: items.filter((item) => item.status !== 'publicado' && !item.is_ready).length,
  }), [items]);

  const filtered = useMemo(() => items.filter((item) =>
    (status === 'all' || item.status === status)
    && (channel === 'all' || item.channel === channel)
    && (!onlyIncomplete || (item.status !== 'publicado' && !item.is_ready))
    && inPeriod(item.scheduled_at, period),
  ), [items, status, channel, onlyIncomplete, period]);

  /** Abrir una fila trae su texto una sola vez y lo deja en caché. */
  const open = useCallback(async (id: string) => {
    setOpenId((current) => (current === id ? null : id));
    const item = items.find((entry) => entry.id === id);
    if (!item || texts[id] !== undefined) return;
    try {
      const text = await fetchPieceText(item.channel, item.source_id);
      setTexts((current) => ({ ...current, [id]: text }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo traer el texto');
    }
  }, [items, texts]);

  /**
   * Desde el calendario o desde "próximo": la pieza se abre en su fila y la
   * vista salta ahí, en vez de seleccionarla en un panel que está en otro lado.
   */
  const reveal = useCallback(async (id: string) => {
    const item = items.find((entry) => entry.id === id);
    if (item) {
      setStatus('all');
      setChannel('all');
      setOnlyIncomplete(false);
      setPeriod({ mode: 'mes', anchor: item.scheduled_at });
    }
    setOpenId(null);
    await open(id);
    requestAnimationFrame(() => rows.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }, [items, open]);

  return <div>
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
      <div>
        <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: c.ready }}>El Radar</p>
        <h1 style={{ margin: '5px 0 0', fontSize: 23, fontWeight: 700, color: c.text, letterSpacing: '-0.02em' }}>Agenda editorial</h1>
      </div>
      <button onClick={() => setNewScheduledAt('')}
        className="transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
        style={{ background: c.ready, color: c.page, border: 0, borderRadius: 8, padding: '10px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
      >+ Nuevo post de blog</button>
    </header>

    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
      <StatTile tone={c.planned} value={counts.planificado} label="Planificado"
        active={status === 'planificado' && !onlyIncomplete}
        onClick={() => { setOnlyIncomplete(false); setStatus((v) => (v === 'planificado' ? 'all' : 'planificado')); }} />
      <StatTile tone={c.ready} value={counts.preaprobado} label="Preaprobado"
        active={status === 'preaprobado' && !onlyIncomplete}
        onClick={() => { setOnlyIncomplete(false); setStatus((v) => (v === 'preaprobado' ? 'all' : 'preaprobado')); }} />
      <StatTile tone={c.published} value={counts.publicado} label="Publicado"
        active={status === 'publicado' && !onlyIncomplete}
        onClick={() => { setOnlyIncomplete(false); setStatus((v) => (v === 'publicado' ? 'all' : 'publicado')); }} />
      <StatTile tone={c.incomplete} value={counts.incompletas} label="Falta material"
        active={onlyIncomplete}
        onClick={() => { setStatus('all'); setOnlyIncomplete((v) => !v); }} />
    </div>

    {error && <div role="alert" style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 8, border: `1px solid ${c.late}`, background: tint(c.late, '0f'), color: c.late, fontSize: 13 }}>{error}</div>}

    {/*
      La semana arriba y el calendario a todo el ancho debajo. El calendario es
      la pieza principal de esta página: encajonado en una columna al lado de un
      panel no se podían leer los títulos de las piezas.
    */}
    <div style={{ display: 'grid', gap: 14, marginBottom: 28 }}>
      <WeekPulse items={items} selectedId={openId} onSelect={reveal} />
      <AgendaCalendar items={items} selectedId={openId} onSelect={reveal} onCreate={setNewScheduledAt} />
    </div>

    <div ref={rows} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 14, flexWrap: 'wrap', marginBottom: 12, scrollMarginTop: 70 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: c.text }}>Piezas de {periodLabel(period)}</h2>
        <p style={{ margin: '3px 0 0', fontSize: 11, color: c.textDim }}>
          {filtered.length} {filtered.length === 1 ? 'pieza' : 'piezas'} · abrí una para ver o cargar su texto
        </p>
      </div>
      <PeriodPicker value={period} onChange={setPeriod} />
    </div>

    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
      {CHANNELS.map((value) => <button key={value} style={chip(channel === value)}
        className="transition-colors hover:border-[#00d4d4] hover:text-[#00d4d4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
        onClick={() => setChannel(value)}
      >{value === 'all' ? 'Todo' : CHANNEL_LABEL[value]}</button>)}
      <span aria-hidden style={{ width: 1, height: 20, background: c.border, margin: '0 4px' }} />
      {STATUSES.map((value) => <button key={value} style={chip(status === value && !onlyIncomplete)}
        className="transition-colors hover:border-[#00d4d4] hover:text-[#00d4d4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
        onClick={() => { setStatus(value); setOnlyIncomplete(false); }}
      >{value === 'all' ? 'Todos los estados' : STATUS_LABELS[value]}</button>)}
    </div>

    <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 12, overflow: 'hidden' }}>
      {loading ? <p style={{ margin: 0, padding: 20, fontSize: 12, color: c.textDim }}>Cargando…</p>
        : filtered.length === 0 ? <p style={{ margin: 0, padding: 20, fontSize: 12, color: c.textDim }}>
          No hay piezas en {periodLabel(period)} con estos filtros.
        </p>
        : filtered.map((item) => <PieceRow key={item.id}
          piece={toPiece(item)}
          text={openId === item.id ? texts[item.id] : undefined}
          expanded={openId === item.id}
          onToggle={() => open(item.id)}
          onChangeStatus={async (next) => {
            const result = await changePieceStatus(item.channel, item.source_id, next);
            if (!result.ok) return setError(result.error);
            setError('');
            await load();
          }}
          onSaveText={async (text) => {
            const result = await savePieceText(item.channel, item.source_id, text);
            if (!result.ok) { setError(result.error); return false; }
            setError('');
            setTexts((current) => ({ ...current, [item.id]: text }));
            await load();
            return true;
          }}
          onAttachMarkdown={async (markdown, filename) => {
            const result = await attachPieceMarkdown(item.channel, item.source_id, markdown, filename);
            if (!result.ok) { setError(result.error); return false; }
            setError('');
            const text = await fetchPieceText(item.channel, item.source_id).catch(() => '');
            setTexts((current) => ({ ...current, [item.id]: text }));
            await load();
            return true;
          }}
          onDelete={item.channel === 'blog' ? async () => {
            const result = await deletePiece(item.source_id);
            if (!result.ok) return setError(result.error);
            setOpenId(null);
            await load();
          } : undefined}
        />)}
    </div>

    {newScheduledAt !== null && <AgendaItemModal initialScheduledAt={newScheduledAt} onClose={() => setNewScheduledAt(null)} onCreated={load} />}
  </div>;
}
