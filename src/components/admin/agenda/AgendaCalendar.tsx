'use client';

import { useMemo, useState } from 'react';
import { DaySheet } from './DaySheet';
import { STATUS_LABELS } from './StatusBadge';
import { c, dayKey, isoWeek, itemTone, tint, CHANNEL_LABEL, CHANNEL_SHAPE, CHANNEL_SHORT } from '@/components/admin/tokens';
import type { AgendaChannel, AgendaItem } from '@/lib/agenda/types';

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

/**
 * Domingo primero, y cada columna dice qué canal le toca.
 *
 * El ritmo editorial es: blog el domingo, LinkedIn el martes (D+2) y el viernes
 * (D+5). Rotularlo en la cabecera evita el error de cargar en el día equivocado,
 * y de paso explica el calendario a alguien que lo ve por primera vez.
 */
const WEEKDAYS: { label: string; channel?: AgendaChannel }[] = [
  { label: 'Domingo', channel: 'blog' },
  { label: 'Lunes', channel: 'x' },
  { label: 'Martes', channel: 'linkedin' },
  { label: 'Miércoles', channel: 'x' },
  { label: 'Jueves', channel: 'x' },
  { label: 'Viernes', channel: 'linkedin' },
  { label: 'Sábado', channel: 'x' },
];

const VISIBLE_PER_DAY = 2;

interface Cell { date: Date; inMonth: boolean }

/** Semanas completas: los días del mes vecino se atenúan, no se dejan en blanco. */
function monthWeeks(year: number, month: number): Cell[][] {
  const lead = new Date(year, month, 1).getDay();
  const total = Math.ceil((lead + new Date(year, month + 1, 0).getDate()) / 7) * 7;
  const cells = Array.from({ length: total }, (_, index) => {
    const date = new Date(year, month, index - lead + 1);
    return { date, inMonth: date.getMonth() === month };
  });
  return Array.from({ length: total / 7 }, (_, index) => cells.slice(index * 7, index * 7 + 7));
}

/** Chip de una pieza: el canal se lee con la palabra, no con una sigla. */
function PieceChip({ item, selected, onClick }: {
  item: AgendaItem;
  selected: boolean;
  onClick: () => void;
}) {
  const tone = itemTone(item);
  const shape = CHANNEL_SHAPE[item.channel];
  return <button type="button" onClick={onClick}
    aria-label={`${item.title}, ${CHANNEL_LABEL[item.channel]}, ${STATUS_LABELS[item.status]}${item.is_ready ? '' : ', incompleta'}`}
    className="transition-[filter] hover:brightness-125 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
    style={{
      position: 'relative', display: 'block', width: '100%', minWidth: 0,
      textAlign: 'left', padding: '4px 6px', cursor: 'pointer', fontFamily: 'inherit',
      // La forma dice el canal; el color queda libre para hablar del estado.
      borderRadius: shape.borderRadius,
      border: `1px solid ${selected ? tone : tint(tone, '4d')}`,
      borderLeft: `3px solid ${tone}`,
      background: tint(tone, '1f'),
    }}>
    <span style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 1 }}>
      <span aria-hidden style={{
        width: 5, height: 5, flexShrink: 0,
        borderRadius: shape.dot, background: tone,
      }} />
      <span style={{ fontFamily: 'monospace', fontSize: 8.5, fontWeight: 700, letterSpacing: '0.08em', color: tone }}>
        {item.channel === 'linkedin' ? 'LINKEDIN' : CHANNEL_SHORT[item.channel]}
      </span>
      {item.status === 'publicado' && <span aria-hidden style={{ marginLeft: 'auto', fontSize: 8, color: tone }}>✓</span>}
      {!item.is_ready && item.status !== 'publicado' && <span aria-hidden title="Le falta material" style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, color: c.incomplete }}>!</span>}
    </span>
    <span title={item.title} style={{
      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
      overflow: 'hidden', color: c.text, fontSize: 11, lineHeight: 1.28,
    }}>{item.title}</span>
  </button>;
}

export function AgendaCalendar({ items, selectedId, onSelect, onCreate }: {
  items: AgendaItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: (scheduledAt: string) => void;
}) {
  const [viewDate, setViewDate] = useState(() => new Date());
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [daySheet, setDaySheet] = useState<Date | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, AgendaItem[]>();
    for (const item of items) {
      const key = dayKey(new Date(item.scheduled_at));
      map.set(key, [...(map.get(key) ?? []), item]);
    }
    return map;
  }, [items]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const weeks = monthWeeks(year, month);
  const today = new Date();
  const todayKey = dayKey(today);
  const currentWeek = isoWeek(today);
  const monthCount = items.filter((item) => {
    const date = new Date(item.scheduled_at);
    return date.getFullYear() === year && date.getMonth() === month;
  }).length;

  const nav: React.CSSProperties = {
    minWidth: 32, height: 32, display: 'grid', placeItems: 'center',
    background: 'transparent', border: `1px solid ${c.border}`, borderRadius: 8,
    color: c.textSoft, cursor: 'pointer', padding: '0 10px', fontFamily: 'inherit', fontSize: 13,
  };

  return <section style={{
    background: c.surface, border: `1px solid ${c.border}`, borderRadius: 14,
    padding: 'clamp(12px, 1.6vw, 20px)', display: 'flex', flexDirection: 'column', gap: 12,
  }}>
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, minWidth: 0 }}>
        <h2 style={{ margin: 0, fontSize: 'clamp(18px, 2.1vw, 24px)', fontWeight: 700, color: c.text, letterSpacing: '-0.02em' }}>
          {MONTH_NAMES[month]} <span style={{ color: c.textSoft, fontWeight: 500 }}>{year}</span>
        </h2>
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: c.textDim, whiteSpace: 'nowrap' }}>
          {monthCount} {monthCount === 1 ? 'pieza' : 'piezas'}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 7, flexShrink: 0 }}>
        <button type="button" style={nav} aria-label="Mes anterior"
          className="transition-colors hover:border-[#00d4d4] hover:text-[#00d4d4]"
          onClick={() => setViewDate(new Date(year, month - 1, 1))}>←</button>
        <button type="button" style={nav}
          className="transition-colors hover:border-[#00d4d4] hover:text-[#00d4d4]"
          onClick={() => setViewDate(new Date())}>Hoy</button>
        <button type="button" style={nav} aria-label="Mes siguiente"
          className="transition-colors hover:border-[#00d4d4] hover:text-[#00d4d4]"
          onClick={() => setViewDate(new Date(year, month + 1, 1))}>→</button>
      </div>
    </header>

    {/* Cabecera con la convención: qué canal sale cada día. */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 'clamp(4px, .5vw, 8px)' }}>
      {WEEKDAYS.map((day, index) => <div key={index} style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
        padding: '5px 2px', borderRadius: 7, minWidth: 0,
        background: day.channel ? 'rgba(255,255,255,.03)' : 'transparent',
      }}>
        <span style={{ fontSize: 10, fontFamily: 'monospace', letterSpacing: '0.08em', textTransform: 'uppercase', color: c.textSoft }}>
          <span className="hidden sm:inline">{day.label}</span>
          <span className="sm:hidden">{day.label.slice(0, 3)}</span>
        </span>
        {day.channel && <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 3,
          fontFamily: 'monospace', fontSize: 8, fontWeight: 700, letterSpacing: '0.06em',
          color: c.textDim, whiteSpace: 'nowrap',
        }}>
          <span aria-hidden style={{
            width: 5, height: 5, flexShrink: 0, background: 'currentColor',
            borderRadius: CHANNEL_SHAPE[day.channel].dot,
          }} />
          {day.channel === 'linkedin' ? 'LINKEDIN' : CHANNEL_SHORT[day.channel]}
        </span>}
      </div>)}
    </div>

    {/*
      Alto repartido entre las semanas: las filas son 1fr, así que el mes entra
      completo sin scroll y las celdas crecen con el ancho disponible.
    */}
    <div style={{
      display: 'grid', gap: 'clamp(4px, .5vw, 8px)',
      gridTemplateRows: `repeat(${weeks.length}, minmax(0, 1fr))`,
      height: `clamp(${weeks.length * 96}px, ${weeks.length * 12.5}vh, ${weeks.length * 152}px)`,
    }}>
      {weeks.map((week) => {
        const weekNumber = isoWeek(week[1].date);
        const isCurrentWeek = weekNumber === currentWeek && week[1].date.getFullYear() === today.getFullYear();
        return <div key={week[0].date.toISOString()} style={{
          display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          gap: 'clamp(4px, .5vw, 8px)', minHeight: 0,
          background: isCurrentWeek ? c.surfaceWeek : 'transparent',
          borderRadius: 10,
        }}>
          {week.map(({ date, inMonth }) => {
            const key = dayKey(date);
            const all = grouped.get(key) ?? [];
            const isExpanded = expanded.has(key);
            const visible = isExpanded ? all : all.slice(0, VISIBLE_PER_DAY);
            const isToday = key === todayKey;
            return <div key={key} style={{
              position: 'relative', display: 'flex', flexDirection: 'column',
              minWidth: 0, minHeight: 0, padding: 6, borderRadius: 9,
              border: isToday ? `1.5px solid ${c.ready}` : `1px solid ${inMonth ? c.borderSoft : 'transparent'}`,
              background: isToday ? tint(c.ready, '12') : inMonth ? 'rgba(255,255,255,.012)' : 'transparent',
              opacity: inMonth ? 1 : 0.4,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4, flexShrink: 0 }}>
                <button type="button" onClick={() => setDaySheet(date)}
                  aria-label={`Ver el ${date.toLocaleDateString('es-AR')}`}
                  className="transition-colors hover:text-[#00d4d4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
                  style={{
                    minWidth: 20, padding: isToday ? '1px 6px' : '1px 2px', borderRadius: 5,
                    border: 0, cursor: 'pointer', fontFamily: 'monospace',
                    fontSize: 12, fontWeight: isToday ? 700 : 500,
                    background: isToday ? c.ready : 'transparent',
                    color: isToday ? c.page : c.textSoft,
                  }}>{date.getDate()}</button>
                {all.length > 0 && <span style={{ fontFamily: 'monospace', fontSize: 9, color: c.textDim }}>
                  {all.length}
                </span>}
                {inMonth && <button type="button"
                  aria-label={`Crear post el ${date.toLocaleDateString('es-AR')}`}
                  onClick={() => onCreate(`${key}T10:00`)}
                  className="transition-colors hover:text-[#00d4d4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
                  style={{
                    marginLeft: 'auto', width: 18, height: 18, display: 'grid', placeItems: 'center',
                    border: 0, background: 'transparent', color: c.border,
                    borderRadius: 4, cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0,
                  }}>+</button>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minHeight: 0, overflowY: isExpanded ? 'auto' : 'hidden' }}>
                {visible.map((item) => <PieceChip key={item.id} item={item}
                  selected={item.id === selectedId} onClick={() => onSelect(item.id)} />)}
                {all.length > visible.length && <button type="button"
                  onClick={() => setExpanded((value) => new Set(value).add(key))}
                  className="transition-colors hover:text-[#00d4d4]"
                  style={{ border: 0, background: 'transparent', color: c.textDim, fontSize: 10, fontFamily: 'monospace', textAlign: 'left', padding: '1px 4px', cursor: 'pointer' }}
                >+{all.length - visible.length} más</button>}
              </div>
            </div>;
          })}
        </div>;
      })}
    </div>

    <footer style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', fontSize: 10, fontFamily: 'monospace', color: c.textDim }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
        <span aria-hidden style={{ width: 8, height: 8, background: c.textSoft }} />blog
      </span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
        <span aria-hidden style={{ width: 8, height: 8, borderRadius: '50%', background: c.textSoft }} />linkedin
      </span>
      <span aria-hidden style={{ width: 1, height: 14, background: c.border }} />
      <Legend tone={c.planned} label="Planificado" />
      <Legend tone={c.ready} label="Listo" />
      <Legend tone={c.published} label="Publicado" />
      <Legend tone={c.incomplete} label="Falta material" />
      <Legend tone={c.late} label="Atrasado" />
    </footer>

    {daySheet && <DaySheet date={daySheet}
      items={grouped.get(dayKey(daySheet)) ?? []}
      onClose={() => setDaySheet(null)}
      onOpenPiece={(id) => { setDaySheet(null); onSelect(id); }}
      onCreate={(scheduledAt) => { setDaySheet(null); onCreate(scheduledAt); }} />}
  </section>;
}

function Legend({ tone, label }: { tone: string; label: string }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
    <span aria-hidden style={{ width: 7, height: 7, borderRadius: 2, background: tone, flexShrink: 0 }} />
    {label}
  </span>;
}
