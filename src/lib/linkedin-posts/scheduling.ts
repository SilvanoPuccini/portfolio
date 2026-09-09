import type { LinkedInSlot } from './types';

export const EDITORIAL_TIME_ZONE = 'America/Santiago';

function zonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

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

export function defaultLinkedInSchedule(blogScheduledAt: string, slot: LinkedInSlot): string {
  const blogLocal = zonedParts(new Date(blogScheduledAt), EDITORIAL_TIME_ZONE);
  const localDate = new Date(Date.UTC(
    Number(blogLocal.year), Number(blogLocal.month) - 1, Number(blogLocal.day) + (slot === 'martes' ? 2 : 5),
  ));
  return localTimeToUtc(
    localDate.getUTCFullYear(), localDate.getUTCMonth() + 1, localDate.getUTCDate(), 10,
  ).toISOString();
}
