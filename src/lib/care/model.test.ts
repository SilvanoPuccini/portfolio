import { expect, it } from 'vitest';
import { addCalendarMonths, buildCareOffer, clientCommandSchema, adminCommandSchema } from './model';
it('anchors month-end periods without drifting after February', () => {
  expect(addCalendarMonths('2028-01-31', 1)).toBe('2028-02-29');
  expect(addCalendarMonths('2028-01-31', 2)).toBe('2028-03-31');
  expect(addCalendarMonths('2027-11-30', 3)).toBe('2028-02-29');
});
it('freezes quarter cadence, quota and bilingual policy with exact activation date', () => {
  const offer = buildCareOffer('landing', '2026-10-31', '2026-09-30');
  expect(offer).toMatchObject({ amountUsd: 40, intervalMonths: 3, requests: 1, minutes: 30, startsOn: '2026-10-31' });
  expect(offer.terms.es.join(' ')).toContain('aceptación expresa');
  expect(() => buildCareOffer('landing', '2026-10-01', '2026-09-30')).toThrow();
});
it('requires explicit custom written scope and blocks care-only fake onboarding', () => {
  expect(() => buildCareOffer('cuidado-basico', '2026-10-31', '2026-09-30')).toThrow();
  expect(() => buildCareOffer('sistema', '2026-10-31', '2026-09-30')).toThrow();
  expect(buildCareOffer('sistema', '2026-10-31', '2026-09-30', { amountUsd: 300, scope: 'Agreed support for the existing customer system.' }).amountUsd).toBe(300);
});
it('rejects customer payment confirmation, invalid dates and client supplied pricing', () => {
  expect(clientCommandSchema.safeParse({ action: 'pay', periodId: 'x' }).success).toBe(false);
  expect(clientCommandSchema.safeParse({ action: 'accept', revision: 'a'.repeat(64), amountUsd: 1 }).success).toBe(false);
  expect(adminCommandSchema.safeParse({ action: 'offer', deliveredOn: '2026-02-30', startsOn: '2026-04-01' }).success).toBe(false);
});
