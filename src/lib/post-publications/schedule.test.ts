import { describe, expect, it } from 'vitest';
import { isDue, PUBLISH_WINDOW_MINUTES } from './schedule';

/** Domingo 2026-09-06, 10:00 en Argentina. */
const SUNDAY_10AM_ART = '2026-09-06T10:00:00-03:00';
/** La corrida del cron de ese día: 13:00 UTC. */
const CRON_RUN = new Date('2026-09-06T13:00:00.000Z');

const minutesFrom = (base: Date, minutes: number) =>
  new Date(base.getTime() + minutes * 60_000);

describe('isDue — el post del domingo sale en la corrida del domingo', () => {
  it('sale si el cron corre exactamente a la hora programada', () => {
    expect(isDue(SUNDAY_10AM_ART, CRON_RUN)).toBe(true);
  });

  it('sale igual si el cron se dispara unos segundos ANTES', () => {
    // Este es el caso que antes lo mandaba al lunes: sin margen, un cron que
    // arranca una fracción de segundo temprano no encontraba nada que publicar.
    expect(isDue(SUNDAY_10AM_ART, minutesFrom(CRON_RUN, -0.05))).toBe(true);
  });

  it('sale si el cron se atrasa', () => {
    expect(isDue(SUNDAY_10AM_ART, minutesFrom(CRON_RUN, 40))).toBe(true);
  });

  it('tolera hasta el margen completo de adelanto', () => {
    expect(isDue(SUNDAY_10AM_ART, minutesFrom(CRON_RUN, -PUBLISH_WINDOW_MINUTES))).toBe(true);
  });

  it('NO sale en la corrida del día anterior', () => {
    const saturday = minutesFrom(CRON_RUN, -24 * 60);
    expect(isDue(SUNDAY_10AM_ART, saturday)).toBe(false);
  });

  it('NO se adelanta más allá del margen', () => {
    expect(isDue(SUNDAY_10AM_ART, minutesFrom(CRON_RUN, -PUBLISH_WINDOW_MINUTES - 1))).toBe(false);
  });
});
