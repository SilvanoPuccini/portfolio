/** Commercial defaults, not subscription billing or a legal approval. */
export const SERVICE_POLICY_VERSION = '2026-09-26';

export interface CarePlan {
  readonly amountUsd: number;
  readonly intervalMonths: 1 | 3;
  readonly requests: number;
  readonly minutes: number;
  readonly quoted?: boolean;
}

export const CARE_PLANS = {
  landing: { amountUsd: 40, intervalMonths: 3, requests: 1, minutes: 30 },
  catalog: { amountUsd: 60, intervalMonths: 1, requests: 1, minutes: 60 },
  complete: { amountUsd: 90, intervalMonths: 1, requests: 2, minutes: 90 },
  commerce: { amountUsd: 150, intervalMonths: 1, requests: 3, minutes: 150 },
  custom: { amountUsd: 250, intervalMonths: 1, requests: 1, minutes: 180, quoted: true },
} as const satisfies Record<string, CarePlan>;

export function policyForPackage(slug: string): CarePlan | undefined {
  const plans: Record<string, CarePlan> = {
    landing: CARE_PLANS.landing, 'cuidado-basico': CARE_PLANS.landing,
    'web-cinco-secciones': CARE_PLANS.catalog, 'web-con-blog': CARE_PLANS.complete,
    'catalogo-whatsapp': CARE_PLANS.catalog, 'catalogo-cobro': CARE_PLANS.catalog,
    'cuidado-completo': CARE_PLANS.complete, 'cuidado-comercio': CARE_PLANS.commerce,
    sistema: CARE_PLANS.custom,
    'una-automatizacion': CARE_PLANS.catalog, 'tres-automatizaciones': CARE_PLANS.catalog,
  };
  return plans[slug];
}

export function carePrice(plan: CarePlan, locale: 'es' | 'en'): string {
  const from = plan.quoted ? (locale === 'es' ? 'Desde ' : 'From ') : '';
  return `${from}USD ${plan.amountUsd} ${locale === 'es'
    ? (plan.intervalMonths === 3 ? 'cada 3 meses' : 'por mes')
    : (plan.intervalMonths === 3 ? 'every 3 months' : 'per month')}`;
}

export function policyParagraphs(plan: CarePlan, locale: 'es' | 'en'): string[] {
  if (locale === 'en') return [
    `Managed hosting and bounded care: ${carePrice(plan, locale)}; up to ${plan.requests} small request(s), ${plan.minutes} minutes total per period, not carried forward. ${plan.quoted ? 'Scope and final price require a written quote.' : ''}`.trim(),
    'The provider pays the agreed Vercel/Supabase hosting infrastructure from the care fee. Capacity limits and any exceptional usage require a prior written quote; no unlimited usage or support, redesigns or new features are included.',
    'The customer owns, pays and renews the annual domain and pays all AI/API usage and other third-party licenses or payment-processing fees separately.',
    'Defect warranty and initial hosting are free for 30 days from delivery. Warranty defect fixes do not consume the care allowance. Afterward, continued provider hosting requires explicit acceptance of a paid plan and an agreed start date, or a planned transfer. No automatic billing, annual debt, deletion or site shutdown is authorized by this policy.',
    'After the agreed development payment, the customer owns the project-specific deliverables and may request a source copy. The provider may retain an operational copy; requesting a copy does not cancel hosting. Hosting and care end by an agreed transfer, with dates, data export and any migration assistance quoted in writing.',
  ];
  return [
    `Hosting administrado y cuidado acotado: ${carePrice(plan, locale)}; hasta ${plan.requests} solicitud(es) pequeña(s), ${plan.minutes} minutos en total por período, no acumulables. ${plan.quoted ? 'Alcance y precio final sujetos a cotización escrita.' : ''}`.trim(),
    'El Proveedor paga la infraestructura acordada de Vercel/Supabase con el abono de cuidado. Los límites de capacidad y cualquier consumo excepcional requieren cotización escrita previa; no incluye consumo ni soporte ilimitados, rediseños o nuevas funcionalidades.',
    'El Cliente es titular del dominio y paga su compra y renovación anual; también paga por separado todo consumo de IA/API, licencias de terceros y comisiones de medios de pago.',
    'La garantía por defectos y el hosting inicial son gratuitos durante 30 días desde la entrega. Las correcciones cubiertas por la garantía no consumen el cupo de cuidado. Luego, continuar alojado con el Proveedor requiere aceptación expresa de un plan pago y fecha de inicio acordada, o una transferencia planificada. Esta política no autoriza cobros automáticos, deuda anual, eliminación ni apagado del sitio.',
    'Tras el pago acordado del desarrollo, el Cliente es titular de los entregables específicos y puede solicitar una copia del código fuente. El Proveedor puede conservar una copia operativa; solicitar la copia no cancela el hosting. El hosting y cuidado finalizan mediante una transferencia acordada, con fechas, exportación de datos y eventual asistencia de migración cotizada por escrito.',
  ];
}

export const RETIRED_PACKAGES: ReadonlySet<string> = new Set(['tienda-a-medida']);
export const RETIRED_EXTRAS: ReadonlySet<string> = new Set(['stock']);
