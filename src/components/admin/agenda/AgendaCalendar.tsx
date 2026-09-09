'use client';

import { useMemo, useState } from 'react';
import { STATUS_LABELS } from './StatusBadge';
import { c, dayKey, isoWeek, itemTone, tint, CHANNEL_LABEL, CHANNEL_SHORT } from '@/components/admin/tokens';
import type { AgendaItem } from '@/lib/agenda/types';

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
/**
 * Domingo primero a propósito: el ciclo editorial arranca con el post del blog
 * del domingo y sigue con LinkedIn el martes y el viernes. Con la semana
 * empezando el lunes, ese ciclo quedaba partido en dos filas.
 */
const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const VISIBLE_PER_DAY = 2;
const RAIL = 30;

interface Cell { date: Date; inMonth: boolean }

/** Semanas completas: los días del mes vecino se muestran atenuados, no en blanco. */
function monthWeeks(year: number, month: number): Cell[][] {
  const lead = new Date(year, month, 1).getDay();
  const total = Math.ceil((lead + new Date(year, month + 1, 0).getDate()) / 7) * 7;
  const cells = Array.from({ length: total }, (_, index) => {
    const date = new Date(year, month, index - lead + 1);
    return { date, inMonth: date.getMonth() === month };
  });
  return Array.from({ length: total / 7 }, (_, index) => cells.slice(index * 7, index * 7 + 7));
}

export function AgendaCalendar({ items, selectedId, onSelect, onCreate }: {
  items: AgendaItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: (scheduledAt: string) => void;
}) {
  const [viewDate, setViewDate] = useState(() => new Date());
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
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

  const navButton: React.CSSProperties = {
    background: 'transparent', color: c.textSoft, border: `1px solid ${c.border}`,
    borderRadius: 7, padding: '5px 11px', fontSize: 12, cursor: 'pointer', lineHeight: 1.4,
  };
  const gridColumns = `${RAIL}px repeat(7, minmax(0, 1fr))`;

  return <section style={{
    background: c.surface, border: `1px solid ${c.border}`, borderRadius: 12,
    padding: 16, display: 'flex', flexDirection: 'column', gap: 10,
  }}>
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, minWidth: 0 }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: c.text, letterSpacing: '-0.01em' }}>
          {MONTH_NAMES[month]} <span style={{ color: c.textSoft, fontWeight: 500 }}>{year}</span>
        </h2>
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: c.textDim, whiteSpace: 'nowrap' }}>
          {monthCount} {monthCount === 1 ? 'pieza' : 'piezas'}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button className="transition-colors hover:border-[#00d4d4] hover:text-[#00d4d4]" style={navButton}
          onClick={() => setViewDate(new Date(year, month - 1, 1))} aria-label="Mes anterior">←</button>
        <button className="transition-colors hover:border-[#00d4d4] hover:text-[#00d4d4]" style={navButton}
          onClick={() => setViewDate(new Date())}>Hoy</button>
        <button className="transition-colors hover:border-[#00d4d4] hover:text-[#00d4d4]" style={navButton}
          onClick={() => setViewDate(new Date(year, month + 1, 1))} aria-label="Mes siguiente">→</button>
      </div>
    </header>

    <div style={{ display: 'grid', gridTemplateColumns: gridColumns, gap: 5 }}>
      <span aria-hidden style={{ fontSize: 9, fontFamily: 'monospace', color: c.textDim, textAlign: 'center' }}>SEM</span>
      {WEEKDAYS.map((day) => <span key={day} style={{
        textAlign: 'center', fontSize: 10, fontFamily: 'monospace',
        letterSpacing: '0.1em', textTransform: 'uppercase', color: c.textDim,
      }}>{day}</span>)}
    </div>

    {/*
      Alto repartido entre las semanas del mes: las filas son 1fr, así que la
      grilla entra completa y no hay scroll ni horizontal ni vertical.
    */}
    <div style={{
      display: 'grid', gap: 5,
      gridTemplateRows: `repeat(${weeks.length}, minmax(0, 1fr))`,
      height: `clamp(${weeks.length * 66}px, ${weeks.length * 8.6}vh, ${weeks.length * 100}px)`,
    }}>
      {weeks.map((week) => {
        // La semana se numera por su lunes: el domingo abre la fila, pero la
        // semana ISO a la que pertenece el ciclo es la que empieza al día siguiente.
        const weekNumber = isoWeek(week[1].date);
        const isCurrentWeek = weekNumber === currentWeek && week[1].date.getFullYear() === today.getFullYear();
        return <div key={weekNumber + week[0].date.toISOString()} style={{
          display: 'grid', gridTemplateColumns: gridColumns, gap: 5, minHeight: 0,
          background: isCurrentWeek ? c.surfaceWeek : 'transparent',
          borderRadius: 8,
          boxShadow: isCurrentWeek ? `inset 3px 0 0 ${c.ready}` : 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>
            <span
              title={isCurrentWeek ? `Semana ${weekNumber} · en curso` : `Semana ${weekNumber}`}
              style={{
                fontFamily: 'monospace', fontSize: 10, fontWeight: isCurrentWeek ? 700 : 400,
                color: isCurrentWeek ? c.ready : c.textDim,
              }}
            >{weekNumber}</span>
          </div>
          {week.map(({ date, inMonth }) => {
            const key = dayKey(date);
            const all = grouped.get(key) ?? [];
            const isExpanded = expanded.has(key);
            const visible = isExpanded ? all : all.slice(0, VISIBLE_PER_DAY);
            const isToday = key === todayKey;
            return <div key={key} style={{
              position: 'relative', display: 'flex', flexDirection: 'column', gap: 3,
              minWidth: 0, minHeight: 0, padding: 4, borderRadius: 7,
              border: isToday ? `1px solid ${c.ready}` : `1px solid ${c.borderSoft}`,
              background: isToday ? tint(c.ready, '14') : inMonth ? 'transparent' : 'rgba(0,0,0,0.18)',
              opacity: inMonth ? 1 : 0.45,
            }}>
              {/* Los días del mes vecino se ven para no cortar la semana, pero no
                  se puede crear en ellos: el mes que se está mirando es este. */}
              {inMonth && <button type="button" aria-label={`Crear post el ${date.toLocaleDateString('es-AR')}`}
                onClick={() => onCreate(`${key}T10:00`)}
                style={{ position: 'absolute', inset: 0, border: 0, background: 'transparent', borderRadius: 7, cursor: 'pointer' }} />}
              <span style={{
                position: 'relative', pointerEvents: 'none', alignSelf: 'flex-start',
                minWidth: 16, textAlign: 'center', borderRadius: 4,
                fontSize: 10, fontFamily: 'monospace',
                fontWeight: isToday ? 700 : 400,
                padding: isToday ? '1px 4px' : '1px 0',
                background: isToday ? c.ready : 'transparent',
                color: isToday ? c.page : c.textDim,
              }}>{date.getDate()}</span>
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 2, minHeight: 0, overflowY: isExpanded ? 'auto' : 'hidden' }}>
                {visible.map((item) => {
                  const tone = itemTone(item);
                  return <button key={item.id} type="button" onClick={() => onSelect(item.id)}
                    aria-label={`${item.title}, ${CHANNEL_LABEL[item.channel]}, ${STATUS_LABELS[item.status]}${item.is_ready ? '' : ', incompleta'}`}
                    className="transition-[filter] hover:brightness-125 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4, width: '100%', minWidth: 0,
                      padding: '2px 4px', textAlign: 'left', borderRadius: 4, border: 0,
                      borderLeft: `2px solid ${tone}`,
                      outline: item.id === selectedId ? `1px solid ${tone}` : 'none',
                      background: tint(tone),
                      cursor: 'pointer',
                    }}>
                    <span style={{ flexShrink: 0, fontSize: 8, fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.06em', color: tone }}>
                      {CHANNEL_SHORT[item.channel]}
                    </span>
                    <span title={item.title} style={{ minWidth: 0, flex: 1, color: c.text, fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.title}
                    </span>
                    {item.status === 'publicado' && <span aria-hidden style={{ flexShrink: 0, fontSize: 8, color: tone }}>✓</span>}
                  </button>;
                })}
                {all.length > visible.length && <button type="button"
                  onClick={() => setExpanded((value) => new Set(value).add(key))}
                  className="transition-colors hover:text-[#00d4d4]"
                  style={{ border: 0, background: 'transparent', color: c.textDim, fontSize: 9, fontFamily: 'monospace', textAlign: 'left', padding: '1px 4px', cursor: 'pointer' }}
                >+{all.length - visible.length} más</button>}
              </div>
            </div>;
          })}
        </div>;
      })}
    </div>

    <footer style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', fontSize: 10, fontFamily: 'monospace', color: c.textDim, paddingTop: 2 }}>
      <span>BL blog · IN linkedin</span>
      <Legend tone={c.planned} label="Planificado" />
      <Legend tone={c.ready} label="Listo" />
      <Legend tone={c.published} label="Publicado" />
      <Legend tone={c.incomplete} label="Falta material" />
      <Legend tone={c.late} label="Atrasado" />
    </footer>
  </section>;
}

function Legend({ tone, label }: { tone: string; label: string }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
    <span aria-hidden style={{ width: 7, height: 7, borderRadius: 2, background: tone, flexShrink: 0 }} />
    {label}
  </span>;
}
