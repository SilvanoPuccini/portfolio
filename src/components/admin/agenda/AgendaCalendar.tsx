'use client';

import { useEffect, useMemo, useState } from 'react';
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

export function AgendaCalendar({ refreshKey }: { refreshKey: number }) {
  const [items, setItems] = useState<PostPublication[]>([]);
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selected, setSelected] = useState<PostPublication | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/posts-agenda?page=1')
      .then((r) => r.json())
      .then((json: { items?: PostPublication[] }) => {
        if (!cancelled) setItems(json.items ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

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
    <div style={{ ...s.card, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button
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
          style={s.btnGhost}
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          aria-label="Mes siguiente"
        >
          →
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            style={{
              textAlign: 'center',
              fontSize: 11,
              fontFamily: 'monospace',
              opacity: 0.5,
              padding: '4px 0',
            }}
          >
            {label}
          </div>
        ))}
      </div>

      {weeks.map((week, wi) => (
        <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
          {week.map((day, di) => {
            if (!day) return <div key={di} style={{ minHeight: 64 }} />;
            const key = dayKey(day);
            const dayItems = byDay.get(key) ?? [];
            const isToday = key === todayKey;
            const isSunday = day.getDay() === 0;

            return (
              <div
                key={di}
                style={{
                  minHeight: 64,
                  borderRadius: 6,
                  padding: 6,
                  border: isToday ? '1px solid #00d4d4' : '1px solid rgba(255,255,255,0.06)',
                  background: isSunday ? 'rgba(0,212,212,0.03)' : 'transparent',
                }}
              >
                <div style={{ fontSize: 11, fontFamily: 'monospace', opacity: isToday ? 1 : 0.5, color: isToday ? '#00d4d4' : undefined }}>
                  {day.getDate()}
                </div>
                {dayItems.map((item) => (
                  <button
                    key={item.post_slug}
                    onClick={() => setSelected(item)}
                    title={item.raw_title}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      marginTop: 4,
                      padding: '2px 6px',
                      borderRadius: 4,
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 10,
                      lineHeight: 1.4,
                      background: `${STATUS_DOT[item.status]}1a`,
                      color: STATUS_DOT[item.status],
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.raw_title}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      ))}

      {selected && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ fontWeight: 600 }}>{selected.raw_title}</div>
            <div style={{ fontSize: 12, opacity: 0.6, fontFamily: 'monospace' }}>{selected.post_slug}</div>
          </div>
          <a href={`/admin/agenda/${selected.post_slug}`} style={s.btnGhost}>
            Ver post →
          </a>
        </div>
      )}
    </div>
  );
}
