'use client';

import { c, tint, isoWeek } from './tokens';

const MONTH_NAMES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/**
 * Semana o mes, con un ancla que se mueve de a uno.
 *
 * El orden importa: la semana es el pantallazo de "¿esto llega?" y el mes es la
 * planificación. Empezar mostrando todo junto obliga a buscar dónde estás
 * parado antes de poder decidir nada.
 */
export interface Period {
  mode: 'semana' | 'mes';
  /** Cualquier fecha dentro del período; ISO para que sea serializable. */
  anchor: string;
}

/** Domingo de la semana del ancla: el ciclo editorial arranca el domingo. */
function weekStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
}

export function periodRange(period: Period): [Date, Date] {
  const anchor = new Date(period.anchor);
  if (period.mode === 'semana') {
    const start = weekStart(anchor);
    return [start, new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7)];
  }
  return [
    new Date(anchor.getFullYear(), anchor.getMonth(), 1),
    new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1),
  ];
}

export function inPeriod(iso: string, period: Period) {
  const [start, end] = periodRange(period);
  const time = new Date(iso).getTime();
  return time >= start.getTime() && time < end.getTime();
}

export function periodLabel(period: Period) {
  const [start, end] = periodRange(period);
  if (period.mode === 'mes') return `${MONTH_NAMES[start.getMonth()]} ${start.getFullYear()}`;
  const last = new Date(end.getTime() - 86_400_000);
  const from = `${start.getDate()} ${MONTH_NAMES[start.getMonth()].slice(0, 3)}`;
  const to = `${last.getDate()} ${MONTH_NAMES[last.getMonth()].slice(0, 3)}`;
  return `semana ${isoWeek(new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1))} · ${from}–${to}`;
}

function shift(period: Period, direction: 1 | -1): Period {
  const anchor = new Date(period.anchor);
  const next = period.mode === 'semana'
    ? new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + direction * 7)
    : new Date(anchor.getFullYear(), anchor.getMonth() + direction, 1);
  return { ...period, anchor: next.toISOString() };
}

function isNow(period: Period) {
  return inPeriod(new Date().toISOString(), period);
}

const nav: React.CSSProperties = {
  width: 28, height: 28, display: 'grid', placeItems: 'center',
  background: 'transparent', border: `1px solid ${c.border}`, borderRadius: 6,
  color: c.textSoft, cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: 12,
};

export function PeriodPicker({ value, onChange }: { value: Period; onChange: (period: Period) => void }) {
  const current = isNow(value);
  return <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
    <div role="group" aria-label="Ver por" style={{ display: 'flex', border: `1px solid ${c.border}`, borderRadius: 7, overflow: 'hidden' }}>
      {(['semana', 'mes'] as const).map((mode) => <button key={mode} type="button"
        aria-pressed={value.mode === mode}
        onClick={() => onChange({ mode, anchor: value.anchor })}
        className="transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
        style={{
          padding: '6px 14px', border: 0, cursor: 'pointer', fontFamily: 'inherit',
          fontSize: 12, fontWeight: value.mode === mode ? 700 : 500,
          background: value.mode === mode ? tint(c.ready, '1a') : 'transparent',
          color: value.mode === mode ? c.ready : c.textSoft,
        }}>{mode}</button>)}
    </div>

    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <button type="button" style={nav} aria-label={`${value.mode} anterior`}
        className="transition-colors hover:border-[#00d4d4] hover:text-[#00d4d4]"
        onClick={() => onChange(shift(value, -1))}>←</button>
      <span style={{
        minWidth: 168, textAlign: 'center', fontSize: 12, fontWeight: 600,
        color: current ? c.ready : c.text,
      }}>{periodLabel(value)}</span>
      <button type="button" style={nav} aria-label={`${value.mode} siguiente`}
        className="transition-colors hover:border-[#00d4d4] hover:text-[#00d4d4]"
        onClick={() => onChange(shift(value, 1))}>→</button>
    </div>

    {!current && <button type="button"
      onClick={() => onChange({ ...value, anchor: new Date().toISOString() })}
      className="transition-colors hover:border-[#00d4d4] hover:text-[#00d4d4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
      style={{ ...nav, width: 'auto', padding: '0 11px' }}>hoy</button>}
  </div>;
}
