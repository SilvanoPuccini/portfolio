'use client';

import { c, dayKey, isoWeek, itemTone, tint, CHANNEL_SHORT } from '@/components/admin/tokens';
import type { AgendaItem } from '@/lib/agenda/types';

const WEEKDAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

/** Domingo de la semana que contiene a la fecha dada. */
function weekStart(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
  return start;
}

function shortDate(date: Date) {
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

/**
 * El estado de la semana en curso, para responder de un vistazo qué se
 * publicó, qué está listo y qué falta antes de que la fecha pase.
 */
export function WeekPulse({ items, selectedId, onSelect }: {
  items: AgendaItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const today = new Date();
  const start = weekStart(today);
  const days = Array.from({ length: 7 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
  const end = days[6];
  const keys = new Set(days.map(dayKey));
  const week = items
    .filter((item) => keys.has(dayKey(new Date(item.scheduled_at))))
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));

  const published = week.filter((item) => item.status === 'publicado').length;
  const pending = week.filter((item) => item.status !== 'publicado');
  const incomplete = pending.filter((item) => !item.is_ready).length;
  const readyToGo = pending.length - incomplete;
  const todayKey = dayKey(today);
  const byDay = new Map<string, AgendaItem[]>();
  for (const item of week) {
    const key = dayKey(new Date(item.scheduled_at));
    byDay.set(key, [...(byDay.get(key) ?? []), item]);
  }

  return <section style={{
    background: c.surface, border: `1px solid ${c.border}`, borderRadius: 12,
    padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
    boxShadow: `inset 3px 0 0 ${c.ready}`,
  }}>
    <div>
      <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: c.ready }}>
        Semana {isoWeek(days[1])} · en curso
      </p>
      <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 700, color: c.text }}>
        {shortDate(start)} – {shortDate(end)}
      </p>
    </div>

    {/* Franja de la semana: cada día con sus piezas, hoy marcado. */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 4 }}>
      {days.map((day, index) => {
        const key = dayKey(day);
        const dayItems = byDay.get(key) ?? [];
        const isToday = key === todayKey;
        return <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 0 }}>
          <span style={{
            fontFamily: 'monospace', fontSize: 9, minWidth: 15, textAlign: 'center', borderRadius: 3,
            fontWeight: isToday ? 700 : 400,
            background: isToday ? c.ready : 'transparent',
            color: isToday ? c.page : c.textDim,
          }}>{WEEKDAYS[index]}</span>
          <span style={{ fontSize: 10, fontFamily: 'monospace', color: isToday ? c.text : c.textDim }}>{day.getDate()}</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', alignItems: 'center' }}>
            {dayItems.length === 0
              ? <span aria-hidden style={{ width: 4, height: 4, borderRadius: '50%', background: c.border }} />
              : dayItems.map((item) => {
                const tone = itemTone(item);
                return <button key={item.id} type="button" onClick={() => onSelect(item.id)}
                  aria-label={`${item.title}, ${day.toLocaleDateString('es-AR', { weekday: 'long' })}`}
                  title={item.title}
                  className="transition-[filter] hover:brightness-125 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#00d4d4]"
                  style={{
                    width: '100%', padding: '2px 0', borderRadius: 3, cursor: 'pointer',
                    border: item.id === selectedId ? `1px solid ${tone}` : '1px solid transparent',
                    background: tint(tone, '2e'),
                    color: tone, fontFamily: 'monospace', fontSize: 8, fontWeight: 700, lineHeight: 1.3,
                  }}>{CHANNEL_SHORT[item.channel]}</button>;
              })}
          </div>
        </div>;
      })}
    </div>

    {/* El veredicto en una línea: lo primero que se lee al entrar. */}
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderTop: `1px solid ${c.border}`, paddingTop: 10 }}>
      {week.length === 0
        ? <span style={{ fontSize: 12, color: c.textDim }}>Sin piezas programadas esta semana.</span>
        : <>
          <Tally tone={c.published} value={published} label="publicadas" />
          <Tally tone={c.ready} value={readyToGo} label={readyToGo === 1 ? 'lista' : 'listas'} />
          <Tally tone={c.incomplete} value={incomplete} label="sin material" />
        </>}
    </div>
  </section>;
}

function Tally({ tone, value, label }: { tone: string; value: number; label: string }) {
  const off = value === 0;
  return <span style={{
    display: 'inline-flex', alignItems: 'baseline', gap: 5,
    padding: '3px 9px', borderRadius: 20,
    background: off ? 'transparent' : tint(tone, '1a'),
    border: `1px solid ${off ? c.border : tint(tone, '4d')}`,
  }}>
    <strong style={{ fontSize: 14, lineHeight: 1, color: off ? c.textDim : tone }}>{value}</strong>
    <span style={{ fontSize: 11, color: off ? c.textDim : c.textSoft }}>{label}</span>
  </span>;
}
