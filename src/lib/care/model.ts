import { z } from 'zod';
import { policyForPackage, policyParagraphs } from '@/content/service-policy';

export const CARE_TERMS_VERSION = 'managed-care-2026-09-v1';
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}, 'Invalid calendar date');
const text = z.string().trim().min(8).max(2000);
export const clientCommandSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('accept'), revision: z.string().regex(/^[a-f0-9]{64}$/) }).strict(),
  z.object({ action: z.literal('cancel') }).strict(),
  z.object({ action: z.literal('transfer'), note: text }).strict(),
  z.object({ action: z.literal('source'), note: text }).strict(),
  z.object({ action: z.literal('request'), kind: z.enum(['small', 'defect']), description: text }).strict(),
]);
export const adminCommandSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('offer'), deliveredOn: date, startsOn: date, inspectionNote: text,
    quote: z.object({ amountUsd: z.number().int().min(250).max(100000), scope: text }).strict().optional() }).strict(),
  z.object({ action: z.literal('activate') }).strict(),
  z.object({ action: z.literal('renew') }).strict(),
  z.object({ action: z.literal('pay'), periodId: z.string().uuid(), reference: z.string().trim().min(4).max(160), amountUsd: z.number().positive().max(100000), paidOn: date }).strict(),
  z.object({ action: z.literal('resolve'), requestId: z.string().uuid(), resolution: z.enum(['included', 'warranty', 'quote_required', 'completed']), minutes: z.number().int().min(0).max(180), note: text }).strict(),
  z.object({ action: z.literal('close'), note: text }).strict(),
  z.object({ action: z.literal('source_done'), note: text }).strict(),
]);
export const commandEnvelopeSchema = z.object({ requestId: z.string().uuid(), expectedVersion: z.number().int().min(0), command: z.unknown() }).strict();
export type ClientCommand = z.infer<typeof clientCommandSchema>;
export type AdminCommand = z.infer<typeof adminCommandSchema>;

/** Always calculate from the original anchor, not a previously clamped date. */
export function addCalendarMonths(anchor: string, months: number): string {
  date.parse(anchor);
  const [year, month, day] = anchor.split('-').map(Number);
  const last = new Date(Date.UTC(year, month - 1 + months + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month - 1 + months, Math.min(day, last))).toISOString().slice(0, 10);
}
export function buildCareOffer(packageSlug: string, startsOn: string, deliveredOn: string,
  quote?: { amountUsd: number; scope: string }) {
  date.parse(startsOn); date.parse(deliveredOn);
  const plan = policyForPackage(packageSlug);
  if (!plan || packageSlug.startsWith('cuidado-')) throw new Error('Existing supported project required');
  if (new Date(startsOn).valueOf() < new Date(deliveredOn).valueOf() + 30 * 86400000) throw new Error('Thirty-day warranty must finish first');
  if (plan.quoted && !quote) throw new Error('Written custom quote required');
  if (!plan.quoted && quote) throw new Error('Standard plans cannot be repriced');
  if (quote && (quote.amountUsd < 250 || !Number.isInteger(quote.amountUsd) || quote.scope.trim().length < 8)) throw new Error('Invalid quote');
  const agreed = { ...plan, amountUsd: quote?.amountUsd ?? plan.amountUsd, quoted: false };
  const renewal = {
    es: 'Tras la aceptación, el servicio se renueva por períodos calendario iguales al plan, con pago manual anticipado al inicio de cada período. Puede solicitar la baja antes del siguiente período; no se generan períodos posteriores a la baja. La falta de pago no autoriza el apagado ni la eliminación del sitio. Los trabajos que superen el cupo requieren una cotización separada aceptada; no se cobran automáticamente.',
    en: 'After acceptance, service renews for the same calendar period with manual payment due at each period start. Cancellation before the next period stops subsequent periods. Unpaid balances do not authorize shutdown or deletion. Work beyond the allowance requires a separately accepted quote and is never charged automatically.',
  };
  return { version: CARE_TERMS_VERSION, packageSlug, ...agreed, startsOn, deliveredOn,
    inspectionNote: '',
    scope: quote?.scope ?? 'Managed hosting, monitoring and bounded small-change/incident review.',
    terms: { es: [...policyParagraphs(agreed, 'es'), renewal.es], en: [...policyParagraphs(agreed, 'en'), renewal.en] } };
}
export type CareOffer = ReturnType<typeof buildCareOffer> & { revision: string };
export interface CareSubscription {
  order_id: string; version: number; generation: number; status: 'offered' | 'accepted' | 'active' | 'cancel_pending' | 'transfer_requested' | 'closed';
  offer: CareOffer; accepted_at: string | null; activated_at: string | null;
  cancel_on: string | null; exit_note: string | null; source_requested_at: string | null; source_note: string | null; source_completed_at: string | null;
}
export interface CarePeriod { id: string; generation: number; ordinal: number; starts_on: string; ends_on: string; amount_usd: number; paid_at: string | null; payment_reference: string | null }
export interface CareRequest { id: string; generation: number; period_id: string | null; kind: string; description: string; status: string; minutes: number; note: string | null }
export interface CareAgreementHistory { generation: number; archived_at: string; subscription: CareSubscription }
export interface CareView { paymentInstructions?: string | null; subscription: CareSubscription | null; agreements: CareAgreementHistory[]; periods: CarePeriod[]; requests: CareRequest[] }
export function periodPaymentStatus(period: CarePeriod, today: string): 'paid' | 'upcoming' | 'due' | 'overdue' {
  return period.paid_at ? 'paid' : today < period.starts_on ? 'upcoming' : today === period.starts_on ? 'due' : 'overdue';
}
