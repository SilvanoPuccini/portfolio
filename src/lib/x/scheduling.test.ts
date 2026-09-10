import { describe, expect, it } from 'vitest';
import { ANGLES_PER_WEEK, xDayLabel, xScheduleFor } from './scheduling';

/** Qué día de la semana cae, en la zona editorial. */
function weekdayIn(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { timeZone: 'America/Santiago', weekday: 'long' });
}

describe('xScheduleFor', () => {
  // Post del blog un domingo a las 13:00 UTC.
  const sunday = '2026-09-13T13:00:00.000Z';

  it('fills the four days the rest of the week leaves free', () => {
    const dates = xScheduleFor(sunday);
    expect(dates).toHaveLength(ANGLES_PER_WEEK);
    // Domingo blog, martes y viernes LinkedIn: X toma los otros cuatro.
    expect(dates.map(weekdayIn)).toEqual(['Monday', 'Wednesday', 'Thursday', 'Saturday']);
  });

  it('never lands on a day that already has LinkedIn or the blog', () => {
    const taken = new Set(['Sunday', 'Tuesday', 'Friday']);
    for (const date of xScheduleFor(sunday)) {
      expect(taken.has(weekdayIn(date))).toBe(false);
    }
  });

  it('carries the week over into the next month without breaking', () => {
    // Domingo 27 de septiembre: el sábado siguiente ya es octubre.
    const dates = xScheduleFor('2026-09-27T13:00:00.000Z');
    expect(dates.map(weekdayIn)).toEqual(['Monday', 'Wednesday', 'Thursday', 'Saturday']);
    expect(new Date(dates[3]).getUTCMonth()).toBe(9); // octubre
  });

  it('keeps the same local hour on both sides of a daylight saving change', () => {
    // Chile mueve la hora en septiembre; la hora local de publicación no.
    const before = xScheduleFor('2026-08-30T13:00:00.000Z');
    const after = xScheduleFor('2026-10-11T13:00:00.000Z');
    const localHour = (iso: string) =>
      new Date(iso).toLocaleTimeString('en-US', { timeZone: 'America/Santiago', hour: '2-digit', hourCycle: 'h23' });
    expect(localHour(before[0])).toBe(localHour(after[0]));
  });

  it('names each day so the admin can show it without recomputing', () => {
    expect(xDayLabel(0)).toBe('lunes');
    expect(xDayLabel(3)).toBe('sábado');
  });
});
