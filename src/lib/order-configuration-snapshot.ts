import { z } from 'zod';
import { policyForPackage, policyParagraphs, SERVICE_POLICY_VERSION } from '@/content/service-policy';
import { SERVICE_CATALOG_VERSION, servicioPorSlug } from '@/content/servicios';
import type { CurrentOrderResult } from './order-config';

const configurationSnapshotSchema = z.object({
  schemaVersion: z.literal(1),
  catalogVersion: z.string().min(1),
  policyVersion: z.string().min(1),
  createdAt: z.string().datetime(),
  locale: z.enum(['es', 'en']),
  package: z.object({
    id: z.string().min(1), label: z.string().min(1), description: z.string(),
    oneTimeUsd: z.number().nonnegative(), recurringUsd: z.number().nonnegative(),
    included: z.array(z.string()), excluded: z.array(z.string()),
    deliveryDays: z.number().nonnegative(),
  }).strict(),
  extras: z.array(z.object({
    id: z.string().min(1), label: z.string().min(1), description: z.string(),
    amountUsd: z.number().nonnegative(), cadence: z.enum(['once', 'month']),
  }).strict()),
  answers: z.array(z.object({
    id: z.string().min(1), question: z.string().min(1), value: z.string().min(1),
    selectedOption: z.string().min(1), qualifies: z.boolean(),
  }).strict()),
  charges: z.object({ oneTimeUsd: z.number().nonnegative(), recurringUsd: z.number().nonnegative() }).strict(),
  responsibilities: z.array(z.string()),
}).strict();

export type ConfigurationSnapshot = z.infer<typeof configurationSnapshotSchema>;

/** Parse a stored point-in-time projection without resolving against the live catalog. */
export function parseConfigurationSnapshot(value: unknown): ConfigurationSnapshot | null {
  const parsed = configurationSnapshotSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/** Freeze the buyer-visible configuration after the server has validated it. */
export function buildConfigurationSnapshot(
  resolved: Extract<CurrentOrderResult, { ok: true }>,
  locale: 'es' | 'en',
  now: Date = new Date(),
): ConfigurationSnapshot {
  const { paquete, extras } = resolved;
  const packageAmountUsd = paquete.precioUsd;
  const oneTimeUsd = resolved.resumen.totalUsd;
  const recurringUsd = resolved.resumen.recurrenteUsd;
  if (packageAmountUsd === null || !Number.isFinite(packageAmountUsd) || packageAmountUsd < 0
    || oneTimeUsd === null || !Number.isFinite(oneTimeUsd) || oneTimeUsd < 0
    || !Number.isFinite(recurringUsd) || recurringUsd < 0) {
    throw new Error('Validated order has no finite, non-negative frozen charge amounts.');
  }
  const serviceExtras = servicioPorSlug(paquete.servicio)?.extras ?? [];
  const care = policyForPackage(paquete.slug);

  return {
    schemaVersion: 1,
    catalogVersion: SERVICE_CATALOG_VERSION,
    policyVersion: SERVICE_POLICY_VERSION,
    createdAt: now.toISOString(),
    locale,
    package: {
      id: paquete.slug,
      label: paquete.nombre[locale],
      description: paquete.resumen[locale],
      oneTimeUsd: paquete.recurrente ? 0 : packageAmountUsd,
      recurringUsd: paquete.recurrente ? packageAmountUsd : 0,
      included: [...paquete.incluye[locale]],
      excluded: [...paquete.noIncluye[locale]],
      deliveryDays: paquete.plazoDias,
    },
    extras: extras.flatMap((id) => {
      const extra = serviceExtras.find((item) => item.id === id);
      return extra ? [{
        id: extra.id,
        label: extra.label[locale],
        description: extra.detalle[locale],
        amountUsd: extra.precioUsd,
        cadence: extra.recurrente === 'mes' ? 'month' as const : 'once' as const,
      }] : [];
    }),
    answers: paquete.calificacion.flatMap((question) => {
      const value = resolved.calificacion[question.id];
      if (!value) return [];
      const option = question.opciones.find((item) => item.valor === value);
      return option ? [{
        id: question.id,
        question: question.texto[locale],
        value,
        selectedOption: option.label[locale],
        qualifies: option.califica,
      }] : [];
    }),
    charges: {
      oneTimeUsd,
      recurringUsd,
    },
    responsibilities: care ? policyParagraphs(care, locale) : [],
  };
}
