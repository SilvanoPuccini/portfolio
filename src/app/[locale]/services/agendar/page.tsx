import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import PageHero from "@/components/site/PageHero";
import { getSiteContent } from "@/content/site";
import { resolveLocale, type Locale } from "@/lib/i18n";
import { generatePageMetadata } from "@/lib/metadata";

type LocaleParams = Promise<{ locale: string }>;
// PR1-4: extend SearchParams with optional service param
type SearchParams = Promise<{ leadId?: string; name?: string; email?: string; service?: string }>;

const copy = {
  es: {
    metaTitle: "Agendar llamada",
    metaDescription:
      "Agenda una llamada de diagnostico gratuita para hablar sobre tu proyecto.",
    heroEyebrow: "Siguiente paso",
    heroTitle: "Agenda tu llamada de diagnostico gratuita",
    heroSubtitle:
      "Elegí un horario que te quede cómodo. La llamada dura 45 minutos y no tiene costo ni compromiso.",
    fallbackTitle: "Estamos configurando el calendario",
    fallbackMessage:
      "Mientras tanto, podés escribirnos directamente para coordinar una llamada.",
    fallbackCta: "Contactar por email",
    backToServices: "Volver a servicios",
    serviceConfirmation: {
      prefix: "Consultando sobre:",
    },
  },
  en: {
    metaTitle: "Schedule a call",
    metaDescription:
      "Schedule a free diagnostic call to discuss your project.",
    heroEyebrow: "Next step",
    heroTitle: "Schedule your free diagnostic call",
    heroSubtitle:
      "Pick a time that works for you. The call takes 45 minutes and has no cost or commitment.",
    fallbackTitle: "We are setting up the calendar",
    fallbackMessage:
      "In the meantime, you can reach out directly to coordinate a call.",
    fallbackCta: "Contact via email",
    backToServices: "Back to services",
    serviceConfirmation: {
      prefix: "Consulting about:",
    },
  },
} as const;

// PR1-4: service confirmation copy per slug
const serviceConfirmationCopy: Record<string, { es: string; en: string }> = {
  "full-stack-builds": {
    es: "Desarrollo web a medida",
    en: "Custom web development",
  },
  "automation-ai": {
    es: "Automatizacion con IA",
    en: "AI automation",
  },
  "product-ux-engineering": {
    es: "Auditoria tecnica y producto",
    en: "Technical audit & product",
  },
};

const VALID_SERVICE_SLUGS = ["full-stack-builds", "automation-ai", "product-ux-engineering"];

export async function generateMetadata({
  params,
}: {
  params: LocaleParams;
}): Promise<Metadata> {
  const { locale } = await params;
  const currentLocale: Locale = resolveLocale(locale);
  const content = getSiteContent(currentLocale);
  const labels = copy[currentLocale];

  return generatePageMetadata({
    locale: currentLocale,
    path: "services/agendar",
    title: `${content.metadata.siteName} | ${labels.metaTitle}`,
    description: labels.metaDescription,
  });
}

export default async function AgendarPage({
  params,
  searchParams,
}: {
  params: LocaleParams;
  searchParams: SearchParams;
}) {
  const { locale } = await params;
  const { name, email, service } = await searchParams;
  const currentLocale: Locale = resolveLocale(locale);
  const content = getSiteContent(currentLocale);
  const labels = copy[currentLocale];
  const calcomLink = process.env.NEXT_PUBLIC_CALCOM_LINK;

  // Validate the service slug so we never render arbitrary strings
  const activeService =
    service && VALID_SERVICE_SLUGS.includes(service) ? service : undefined;

  const calUrl = calcomLink
    ? `${calcomLink}?${new URLSearchParams({
        ...(name ? { name } : {}),
        ...(email ? { email } : {}),
      }).toString()}`
    : null;

  return (
    <>
      <PageHero
        eyebrow={labels.heroEyebrow}
        title={labels.heroTitle}
        subtitle={<p>{labels.heroSubtitle}</p>}
      />

      <section className="site-container pb-16 sm:pb-20">
        {/* PR1-4: service confirmation banner */}
        {activeService && serviceConfirmationCopy[activeService] ? (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-[var(--radius-soft)] border border-brand-primary/20 bg-brand-primary/5 px-5 py-4">
            <p className="text-sm text-text-secondary">
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-brand-primary">
                {labels.serviceConfirmation.prefix}
              </span>{" "}
              <span className="font-medium text-text-primary">
                {serviceConfirmationCopy[activeService][currentLocale]}
              </span>
            </p>
            <Link
              href={`/${currentLocale}/services`}
              className="inline-flex shrink-0 items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-text-secondary transition-colors hover:text-text-primary"
            >
              <ArrowLeft className="h-3 w-3" aria-hidden="true" />
              {labels.backToServices}
            </Link>
          </div>
        ) : null}

        {calUrl ? (
          <div className="surface-panel overflow-hidden border border-outline-ghost/10">
            <iframe
              src={calUrl}
              title={labels.metaTitle}
              className="h-[700px] w-full border-0"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="surface-panel border border-outline-ghost/10 bg-[linear-gradient(180deg,rgb(var(--surface-elevated)/0.9),rgb(var(--surface)/0.76))] px-8 py-14 text-center sm:px-16 sm:py-20">
            <h2 className="text-2xl font-semibold text-text-primary sm:text-3xl">
              {labels.fallbackTitle}
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-text-secondary">
              {labels.fallbackMessage}
            </p>
            <div className="mt-8">
              <a
                href={`mailto:${content.metadata.email}`}
                className="button-primary inline-flex items-center justify-center"
              >
                {labels.fallbackCta}
              </a>
            </div>
          </div>
        )}

        {/* PR1-4: "Back to services" link at the bottom — always shown */}
        <div className="mt-8 flex justify-center">
          <Link
            href={`/${currentLocale}/services`}
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-text-secondary transition-colors hover:text-text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            {labels.backToServices}
          </Link>
        </div>
      </section>
    </>
  );
}
