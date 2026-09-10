'use client';

import { c, dayKey, isoWeek, itemTone, tint, CHANNEL_LABEL, CHANNEL_SHAPE, CHANNEL_SHORT } from '@/components/admin/tokens';
import type { AgendaItem } from '@/lib/agenda/types';

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/** Domingo de la semana en curso: el ciclo editorial arranca el domingo. */
function weekStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
}

function shortDate(date: Date) {
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

function missing(item: AgendaItem) {
  if (!item.has_content) return 'le falta el texto';
  if (!item.has_pdf) return 'le falta el PDF';
  return null;
}

/**
 * La banda de la semana: el pantallazo de "¿esto llega?" antes de mirar el mes.
 *
 * Va a lo ancho y arriba del calendario a propósito. Antes estaba en una
 * columna al costado, que le comía espacio al calendario y dejaba el dato más
 * urgente en el lugar más chico de la pantalla.
 */
export function WeekPulse({ items, selectedId, onSelect }: {
  items: AgendaItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const today = new Date();
  const start = weekStart(today);
  const days = Array.from({ length: 7 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
  const keys = new Set(days.map(dayKey));
  const week = items
    .filter((item) => keys.has(dayKey(new Date(item.scheduled_at))))
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));

  const published = week.filter((item) => item.status === 'publicado').length;
  const pending = week.filter((item) => item.status !== 'publicado');
  const incomplete = pending.filter((item) => !item.is_ready).length;
  const todayKey = dayKey(today);
  const byDay = new Map<string, AgendaItem[]>();
  for (const item of week) {
    const key = dayKey(new Date(item.scheduled_at));
    byDay.set(key, [...(byDay.get(key) ?? []), item]);
  }

  const next = items
    .filter((item) => item.status !== 'publicado' && new Date(item.scheduled_at).getTime() >= today.getTime())
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))[0] ?? null;
  const nextDays = next ? Math.ceil((new Date(next.scheduled_at).getTime() - today.getTime()) / 86_400_000) : 0;
  const nextGap = next ? missing(next) : null;
  const nextAtRisk = Boolean(nextGap) && nextDays <= 3;

  return <section style={{
    background: c.surface, border: `1px solid ${c.border}`, borderRadius: 14,
    padding: 'clamp(12px, 1.4vw, 18px)',
    display: 'grid', gap: 14,
    gridTemplateColumns: 'minmax(0, 1fr)',
  }}>
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div style={{ minWidth: 0, flexShrink: 0 }}>
        <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: c.ready }}>
          Esta semana
        </p>
        <p style={{ margin: '4px 0 0', fontSize: 16, fontWeight: 700, color: c.text }}>
          {shortDate(start)} – {shortDate(days[6])}
          <span style={{ marginLeft: 8, fontFamily: 'monospace', fontSize: 11, fontWeight: 500, color: c.textDim }}>
            sem {isoWeek(days[1])}
          </span>
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }} className="lg:ml-auto">
        {week.length === 0
          ? <span style={{ fontSize: 12, color: c.textDim }}>Sin piezas programadas.</span>
          : <>
            <Tally tone={c.published} value={published} label="publicadas" />
            <Tally tone={c.ready} value={pending.length - incomplete} label="listas" />
            <Tally tone={c.incomplete} value={incomplete} label="sin material" />
          </>}
      </div>
    </div>

    {/* Los siete días con sus piezas: hoy marcado, cada pieza clickeable. */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 'clamp(4px, .5vw, 8px)' }}>
      {days.map((day, index) => {
        const key = dayKey(day);
        const dayItems = byDay.get(key) ?? [];
        const isToday = key === todayKey;
        return <div key={key} style={{
          minWidth: 0, padding: 7, borderRadius: 9,
          border: isToday ? `1.5px solid ${c.ready}` : `1px solid ${c.borderSoft}`,
          background: isToday ? tint(c.ready, '12') : 'transparent',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
            <span style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '.06em', textTransform: 'uppercase', color: isToday ? c.ready : c.textDim }}>
              {WEEKDAYS[index]}
            </span>
            <span style={{ fontSize: 12, fontWeight: isToday ? 700 : 500, fontFamily: 'monospace', color: isToday ? c.text : c.textSoft }}>
              {day.getDate()}
            </span>
          </div>
          <div style={{ display: 'grid', gap: 3 }}>
            {dayItems.length === 0
              ? <span aria-hidden style={{ display: 'block', height: 3, borderRadius: 2, background: c.border }} />
              : dayItems.map((item) => {
                const tone = itemTone(item);
                const shape = CHANNEL_SHAPE[item.channel];
                return <button key={item.id} type="button" onClick={() => onSelect(item.id)}
                  aria-label={`${item.title}, ${CHANNEL_LABEL[item.channel]}`} title={item.title}
                  className="transition-[filter] hover:brightness-125 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#00d4d4]"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4, width: '100%', minWidth: 0,
                    padding: '3px 5px', cursor: 'pointer', fontFamily: 'inherit',
                    transform: shape.skew,
                    borderRadius: shape.borderRadius,
                    border: item.id === selectedId ? `1px solid ${tone}` : `1px solid ${tint(tone, '3d')}`,
                    background: tint(tone, '1f'),
                  }}>
                  <span aria-hidden style={{ width: 5, height: 5, flexShrink: 0, borderRadius: shape.dot, background: tone }} />
                  <span style={{ fontFamily: 'monospace', fontSize: 8, fontWeight: 700, color: tone, whiteSpace: 'nowrap' }}>
                    {CHANNEL_SHORT[item.channel]}
                  </span>
                </button>;
              })}
          </div>
        </div>;
      })}
    </div>

    {next && <button type="button" onClick={() => onSelect(next.id)}
      className="transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
      style={{
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
        padding: '10px 12px', borderRadius: 9,
        border: `1px solid ${nextAtRisk ? c.late : c.borderSoft}`,
        background: nextAtRisk ? tint(c.late, '0f') : 'transparent',
      }}>
      <span style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: c.textDim, flexShrink: 0 }}>
        Próximo
      </span>
      <span style={{ minWidth: 0, flex: 1, fontSize: 13, fontWeight: 600, color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {next.title}
      </span>
      <span style={{ fontSize: 11, color: c.textSoft, flexShrink: 0 }}>{CHANNEL_LABEL[next.channel]}</span>
      <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: itemTone(next), flexShrink: 0 }}>
        {nextDays <= 0 ? 'HOY' : `en ${nextDays}d`}
      </span>
      {nextAtRisk && <span style={{ fontSize: 11, color: c.late, flexShrink: 0 }}>{nextGap}</span>}
    </button>}
  </section>;
}

function Tally({ tone, value, label }: { tone: string; value: number; label: string }) {
  const off = value === 0;
  return <span style={{
    display: 'inline-flex', alignItems: 'baseline', gap: 6,
    padding: '5px 12px', borderRadius: 20,
    background: off ? 'transparent' : tint(tone, '1a'),
    border: `1px solid ${off ? c.border : tint(tone, '4d')}`,
  }}>
    <strong style={{ fontSize: 17, lineHeight: 1, color: off ? c.textDim : tone }}>{value}</strong>
    <span style={{ fontSize: 11, color: off ? c.textDim : c.textSoft }}>{label}</span>
  </span>;
}
