'use client';

import { useMemo, useState } from 'react';
import { s } from '@/components/admin/AdminShell';
import { STATUS_LABELS } from './StatusBadge';
import type { AgendaItem } from '@/lib/agenda/types';

const STATUS_DOT = { planificado: '#64748b', preaprobado: '#00d4d4', publicado: '#4ade80' } as const;
const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function monthGrid(year: number, month: number): (Date | null)[][] {
  const cells: (Date | null)[] = [
    ...Array(new Date(year, month, 1).getDay()).fill(null),
    ...Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, index) => new Date(year, month, index + 1)),
  ];
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, index) => cells.slice(index * 7, index * 7 + 7));
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

  return <div style={{ ...s.card, overflowX: 'auto' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
      <button style={s.btnGhost} onClick={() => setViewDate(new Date(year, month - 1, 1))} aria-label="Mes anterior">←</button>
      <h2 style={{ ...s.sectionTitle, margin: 0 }}>{MONTH_NAMES[month]} {year}</h2>
      <button style={s.btnGhost} onClick={() => setViewDate(new Date(year, month + 1, 1))} aria-label="Mes siguiente">→</button>
    </div>
    <div style={{ minWidth: 760 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6 }}>
        {WEEKDAYS.map((day) => <div key={day} style={{ textAlign: 'center', fontSize: 11, opacity: .5 }}>{day}</div>)}
      </div>
      {monthGrid(year, month).map((week, weekIndex) => <div key={weekIndex} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6, marginTop: 6 }}>
        {week.map((day, dayIndex) => {
          if (!day) return <div key={dayIndex} />;
          const key = dayKey(day);
          const all = grouped.get(key) ?? [];
          const visible = expanded.has(key) ? all : all.slice(0, 2);
          return <div key={key} style={{ minHeight: 112, minWidth: 0, border: '1px solid rgba(255,255,255,.07)', borderRadius: 8, padding: 6, position: 'relative' }}>
            <button type="button" aria-label={`Crear post el ${day.toLocaleDateString('es-AR')}`} onClick={() => onCreate(`${key}T10:00`)} style={{ position: 'absolute', inset: 0, border: 0, background: 'transparent' }} />
            <span style={{ position: 'relative', fontSize: 11, opacity: .55 }}>{day.getDate()}</span>
            {visible.map((item) => <button key={item.id} type="button" onClick={() => onSelect(item.id)}
              aria-label={`${item.title}, ${item.channel === 'blog' ? 'Blog' : 'LinkedIn'}, ${STATUS_LABELS[item.status]}`}
              style={{ position: 'relative', display: 'block', width: '100%', marginTop: 4, padding: '5px 6px', textAlign: 'left', borderRadius: 5, border: item.id === selectedId ? `1px solid ${STATUS_DOT[item.status]}` : '1px solid transparent', background: `${STATUS_DOT[item.status]}22`, color: STATUS_DOT[item.status], cursor: 'pointer' }}>
              <span style={{ display: 'block', fontSize: 10, fontWeight: 700 }}>{item.channel === 'blog' ? 'BLOG' : 'LINKEDIN'}</span>
              <span title={item.title} style={{ display: 'block', color: '#cbd5e1', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
            </button>)}
            {all.length > visible.length && <button type="button" onClick={() => setExpanded((value) => new Set(value).add(key))} style={{ ...s.btnGhost, position: 'relative', marginTop: 4, padding: 2, fontSize: 10 }}>+{all.length - visible.length} más</button>}
          </div>;
        })}
      </div>)}
    </div>
    <div style={{ display: 'flex', gap: 14, marginTop: 14, fontSize: 11, color: '#64748b' }}>
      <span>Blog + LinkedIn</span><span>• Planificado</span><span style={{ color: '#00d4d4' }}>• Preaprobado</span><span style={{ color: '#4ade80' }}>• Publicado</span>
    </div>
  </div>;
}
