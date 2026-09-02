'use client';

import { useMemo, useState } from 'react';
import { s } from '@/components/admin/AdminShell';
import type { PostPublication, PostPublicationStatus } from '@/lib/post-publications/types';

const STATUS_DOT: Record<PostPublicationStatus, string> = {
  planificado: '#64748b',
  preaprobado: '#00d4d4',
  publicado: '#4ade80',
};

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const WEEKDAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MAX_VISIBLE_PER_DAY = 2;

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function buildMonthGrid(year: number, month: number): (Date | null)[][] {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay(); // 0 = domingo
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export function AgendaCalendar({
  items,
  selectedSlug,
  onSelect,
}: {
  items: PostPublication[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
}) {
  const [viewDate, setViewDate] = useState(() => new Date());

  const byDay = useMemo(() => {
    const map = new Map<string, PostPublication[]>();
    for (const item of items) {
      const key = dayKey(new Date(item.scheduled_at));
      map.set(key, [...(map.get(key) ?? []), item]);
    }
    return map;
  }, [items]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const weeks = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const todayKey = dayKey(new Date());

  return (
    <div style={s.card}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <button
          className="transition-colors hover:border-[#00d4d4] hover:text-[#00d4d4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
          style={s.btnGhost}
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          aria-label="Mes anterior"
        >
          ←
        </button>
        <h2 style={{ ...s.sectionTitle, margin: 0 }}>
          {MONTH_NAMES[month]} {year}
        </h2>
        <button
          className="transition-colors hover:border-[#00d4d4] hover:text-[#00d4d4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
          style={s.btnGhost}
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          aria-label="Mes siguiente"
        >
          →
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6 }}>
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} style={{ textAlign: 'center', fontSize: 11, fontFamily: 'monospace', opacity: 0.45, padding: '4px 0' }}>
            {label}
          </div>
        ))}
      </div>

      {weeks.map((week, wi) => (
        <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6 }}>
          {week.map((day, di) => {
            if (!day) return <div key={di} style={{ minHeight: 96 }} />;
            const key = dayKey(day);
            const dayItems = byDay.get(key) ?? [];
            const visibleItems = dayItems.slice(0, MAX_VISIBLE_PER_DAY);
            const overflow = dayItems.length - visibleItems.length;
            const isToday = key === todayKey;
            const isSunday = day.getDay() === 0;

            return (
              <div
                key={di}
                style={{
                  minHeight: 96,
                  borderRadius: 8,
                  padding: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  border: isToday ? '1px solid #00d4d4' : '1px solid rgba(255,255,255,0.06)',
                  background: isSunday ? 'rgba(0,212,212,0.04)' : 'transparent',
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontFamily: 'monospace',
                    opacity: isToday ? 1 : 0.45,
                    color: isToday ? '#00d4d4' : undefined,
                    fontWeight: isToday ? 700 : 400,
                  }}
                >
                  {day.getDate()}
                </span>

                {visibleItems.map((item) => {
                  const isSelected = item.post_slug === selectedSlug;
                  return (
                  <button
                    key={item.post_slug}
                    onClick={() => onSelect(item.post_slug)}
                    title={item.raw_title}
                    className="transition-[filter,transform] hover:brightness-125 focus-visible:outline focus-visible:outline-2"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      width: '100%',
                      textAlign: 'left',
                      padding: '3px 6px',
                      borderRadius: 5,
                      border: `1px solid ${isSelected ? STATUS_DOT[item.status] : 'transparent'}`,
                      outlineColor: STATUS_DOT[item.status],
                      cursor: 'pointer',
                      fontSize: 10.5,
                      lineHeight: 1.3,
                      background: isSelected ? `${STATUS_DOT[item.status]}33` : `${STATUS_DOT[item.status]}1a`,
                      color: STATUS_DOT[item.status],
                      fontWeight: isSelected ? 700 : 400,
                    }}
                  >
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        background: 'currentColor',
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.raw_title}
                    </span>
                  </button>
                  );
                })}

                {overflow > 0 && (
                  <span style={{ fontSize: 10, opacity: 0.5, paddingLeft: 6 }}>+{overflow} más</span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
