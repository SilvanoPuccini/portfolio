import { describe, expect, it } from 'vitest';
import { defaultLinkedInSchedule } from './scheduling';

describe('defaultLinkedInSchedule', () => {
  it('schedules Tuesday and Friday at 10:00 Chile from the linked Sunday', () => {
    expect(defaultLinkedInSchedule('2026-09-13T13:00:00.000Z', 'martes')).toBe('2026-09-15T13:00:00.000Z');
    expect(defaultLinkedInSchedule('2026-09-13T13:00:00.000Z', 'viernes')).toBe('2026-09-18T13:00:00.000Z');
  });

  it('uses the Chile timezone offset in winter', () => {
    expect(defaultLinkedInSchedule('2026-07-05T14:00:00.000Z', 'martes')).toBe('2026-07-07T14:00:00.000Z');
  });
});
