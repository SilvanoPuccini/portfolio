'use client';

import { useMemo, useState } from 'react';
import { s } from '@/components/admin/AdminShell';
import { STATUS_LABELS } from './StatusBadge';
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

/**
 * El domingo se lleva casi el triple de ancho que el resto.
 *
 * La agenda publica solo los domingos: repartir las siete columnas en partes
 * iguales dejaba seis columnas vacías y un domingo tan angosto que el título
 * no entraba, así que el día quedaba marcado pero sin decir qué post era.
 */
const SUNDAY_FIRST_COLUMNS = '2.8fr repeat(6, minmax(0, 1fr))';

/** Hora de publicación, para leerla dentro de la celda del domingo. */
function hourLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

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

      <div style={{ display: 'grid', gridTemplateColumns: SUNDAY_FIRST_COLUMNS, gap: 6, marginBottom: 6 }}>
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} style={{ textAlign: 'center', fontSize: 11, fontFamily: 'monospace', opacity: 0.45, padding: '4px 0' }}>
            {label}
          </div>
        ))}
      </div>

      {weeks.map((week, wi) => (
        <div key={wi} style={{ display: 'grid', gridTemplateColumns: SUNDAY_FIRST_COLUMNS, gap: 6, marginBottom: 6 }}>
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
                  // El domingo necesita más alto: es el único que muestra
                  // título y hora adentro de la celda.
                  minHeight: isSunday ? 104 : 96,
                  // minWidth 0: sin esto un chip con título largo no puede
                  // encoger y estira la columna, deformando todo el mes.
                  minWidth: 0,
                  overflow: 'hidden',
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
                  const color = STATUS_DOT[item.status];

                  // El domingo tiene ancho de sobra: se muestra el título y la
                  // hora. Los demás días son columnas angostas donde un título
                  // truncado queda en "Mi …" y no informa nada, así que ahí
                  // solo va la barra de color y el título queda en el tooltip.
                  return (
                    <button
                      key={item.post_slug}
                      onClick={() => onSelect(item.post_slug)}
                      title={`${item.raw_title} · ${STATUS_LABELS[item.status]}`}
                      aria-label={`${item.raw_title}, ${STATUS_LABELS[item.status]}`}
                      className="transition-[filter] hover:brightness-150 focus-visible:outline focus-visible:outline-2"
                      style={{
                        display: 'flex',
                        flexDirection: isSunday ? 'column' : 'row',
                        alignItems: isSunday ? 'stretch' : 'center',
                        justifyContent: 'center',
                        gap: isSunday ? 3 : 5,
                        width: '100%',
                        minWidth: 0,
                        textAlign: 'left',
                        padding: isSunday ? '6px 8px' : isSelected ? '5px 4px' : '4px',
                        borderRadius: 5,
                        border: `1px solid ${isSelected ? color : 'transparent'}`,
                        outlineColor: color,
                        cursor: 'pointer',
                        background: isSelected ? `${color}38` : `${color}1f`,
                        color,
                      }}
                    >
                      {isSunday ? (
                        <>
                          <span
                            style={{
                              fontSize: 11,
                              lineHeight: 1.35,
                              fontWeight: isSelected ? 700 : 600,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {item.raw_title}
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              fontFamily: 'monospace',
                              opacity: 0.75,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 5,
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
                            {hourLabel(item.scheduled_at)} · {STATUS_LABELS[item.status]}
                          </span>
                        </>
                      ) : (
                        <>
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: 'currentColor',
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{ height: 3, flex: 1, borderRadius: 2, background: 'currentColor', opacity: 0.55 }}
                          />
                        </>
                      )}
                    </button>
                  );
                })}

                {overflow > 0 && (
                  <span style={{ fontSize: 10, opacity: 0.5, textAlign: isSunday ? 'left' : 'center' }}>
                    +{overflow} más
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ))}

      <div
        style={{
          display: 'flex',
          gap: 16,
          marginTop: 14,
          paddingTop: 14,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          flexWrap: 'wrap',
        }}
      >
        {(Object.keys(STATUS_DOT) as PostPublicationStatus[]).map((status) => (
          <span
            key={status}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b' }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: STATUS_DOT[status],
                flexShrink: 0,
              }}
            />
            {STATUS_LABELS[status]}
          </span>
        ))}
      </div>
    </div>
  );
}
