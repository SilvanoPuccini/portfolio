/**
 * Cuándo sale cada hilo.
 *
 * La semana editorial ya tiene ocupados el domingo (blog) y el martes y
 * viernes (LinkedIn). X toma los cuatro días libres, así queda cubierta sin
 * pisar nada: domingo blog, lunes X, martes LinkedIn, miércoles X, jueves X,
 * viernes LinkedIn, sábado X.
 */

export const EDITORIAL_TIME_ZONE = 'America/Santiago';

/** Días de X, como offset en días desde el domingo del post. */
const X_DAYS = [
  { angleIndex: 0, offset: 1, label: 'lunes' },
  { angleIndex: 1, offset: 3, label: 'miércoles' },
  { angleIndex: 2, offset: 4, label: 'jueves' },
  { angleIndex: 3, offset: 6, label: 'sábado' },
] as const;

export const ANGLES_PER_WEEK = X_DAYS.length;

/** Hora local de publicación. El cron de Vercel garantiza la hora, no el minuto. */
const PUBLISH_HOUR = 13;

function zonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

/** Convierte una hora local de la zona editorial al instante UTC que le toca. */
function localTimeToUtc(year: number, month: number, day: number, hour: number): Date {
  let candidate = Date.UTC(year, month - 1, day, hour);
  for (let i = 0; i < 2; i++) {
    const actual = zonedParts(new Date(candidate), EDITORIAL_TIME_ZONE);
    const represented = Date.UTC(
      Number(actual.year), Number(actual.month) - 1, Number(actual.day),
      Number(actual.hour), Number(actual.minute), Number(actual.second),
    );
    candidate += Date.UTC(year, month - 1, day, hour) - represented;
  }
  return new Date(candidate);
}

/**
 * Las cuatro fechas de X que le corresponden a un post del blog.
 * El índice del arreglo es el índice del ángulo en el guion.
 */
export function xScheduleFor(blogScheduledAt: string): string[] {
  const local = zonedParts(new Date(blogScheduledAt), EDITORIAL_TIME_ZONE);
  const year = Number(local.year);
  const month = Number(local.month);
  const day = Number(local.day);

  return X_DAYS.map(({ offset }) => {
    // El Date de UTC hace de calendario: normaliza el cambio de mes solo.
    const target = new Date(Date.UTC(year, month - 1, day + offset));
    return localTimeToUtc(
      target.getUTCFullYear(), target.getUTCMonth() + 1, target.getUTCDate(), PUBLISH_HOUR,
    ).toISOString();
  });
}

export function xDayLabel(angleIndex: number): string {
  return X_DAYS[angleIndex]?.label ?? 'sin día';
}
