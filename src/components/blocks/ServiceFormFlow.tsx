"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Code2, Cpu, ShieldCheck } from "lucide-react";
import IntakeForm, { type ServiceSlug } from "@/components/blocks/IntakeForm";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

type ServiceDetail = { label: string; value: string };

export type ServiceCardData = {
  number: string;
  subtitle: string;
  title: string;
  description: string;
  details: ServiceDetail[];
  references: string[];
  cta: string;
  slug: ServiceSlug;
};

const ICONS = [Code2, Cpu, ShieldCheck];

const VALID_SLUGS: ServiceSlug[] = ["full-stack-builds", "automation-ai", "product-ux-engineering"];

const backLabels = {
  es: "Volver a servicios",
  en: "Back to services",
} as const;

const serviceIdentity: Record<ServiceSlug, { number: string; es: string; en: string }> = {
  "full-stack-builds": {
    number: "01",
    es: "Desarrollo web a medida",
    en: "Custom web development",
  },
  "automation-ai": {
    number: "02",
    es: "Automatización con IA",
    en: "AI automation",
  },
  "product-ux-engineering": {
    number: "03",
    es: "Auditoría técnica",
    en: "Technical audit",
  },
};

const formSubtitles: Record<string, string> = {
  es: "Completá estos datos y te contactamos para una llamada de diagnóstico gratuita.",
  en: "Fill in these details and we'll reach out for a free diagnostic call.",
};

function parseServiceFromHash(hash: string): ServiceSlug | null {
  const match = hash.match(/^#service-(.+)$/);
  if (!match) return null;
  const slug = match[1] as ServiceSlug;
  return VALID_SLUGS.includes(slug) ? slug : null;
}

/* -------------------------------------------------------------------------- */
/*  Service card (vertical, full-width)                                        */
/* -------------------------------------------------------------------------- */

function FullWidthServiceCard({
  card,
  index,
  onSelect,
}: {
  card: ServiceCardData;
  index: number;
  onSelect: () => void;
}) {
  const Icon = ICONS[index] ?? Code2;

  return (
    <article
      id={`service-${index + 1}`}
      className="surface-panel no-line-stack overflow-hidden border border-outline-ghost/10 bg-[linear-gradient(180deg,rgb(var(--surface-elevated)/0.9),rgb(var(--surface)/0.78))]"
    >
      <div className="px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        {/* Header: Number + Icon */}
        <div className="flex items-center justify-between border-b border-outline-ghost/10 pb-5">
          <span
            className="font-display text-[3.5rem] leading-none tracking-[-0.04em] text-brand-primary/25 sm:text-[4.5rem]"
            aria-hidden="true"
          >
            {card.number}
          </span>
          <Icon className="h-6 w-6 text-brand-primary/40" aria-hidden="true" />
        </div>

        {/* Content */}
        <div className="mt-7 lg:grid lg:grid-cols-[1fr_minmax(20rem,0.45fr)] lg:gap-12">
          {/* Left: text */}
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-brand-primary">
              {card.subtitle}
            </p>
            <h3 className="mt-2 text-3xl font-semibold text-text-primary sm:text-4xl">
              {card.title}
            </h3>
            <p className="mt-4 max-w-3xl text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">
              {card.description}
            </p>

            {/* References as chips */}
            <div className="mt-6 flex flex-wrap gap-2">
              {card.references.map((ref) => (
                <span
                  key={ref}
                  className="rounded-pill border border-outline-ghost/12 bg-surface-dim/75 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-text-secondary"
                >
                  {ref}
                </span>
              ))}
            </div>
          </div>

          {/* Right: details + CTA */}
          <div className="mt-8 lg:mt-0">
            <div className="grid gap-3">
              {card.details.map((detail) => (
                <div
                  key={detail.label}
                  className="rounded-[var(--radius-soft)] border border-outline-ghost/10 bg-[rgb(var(--background)/0.1)] px-5 py-4"
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-tertiary">
                    {detail.label}
                  </p>
                  <p
                    className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.04em]"
                    style={{ color: "rgb(var(--brand-primary))" }}
                  >
                    {detail.value}
                  </p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-6">
              <button
                type="button"
                onClick={onSelect}
                className="button-primary inline-flex w-full items-center justify-center gap-2.5 sm:w-auto sm:min-w-[14rem]"
              >
                <span>{card.cta}</span>
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main component: manages service selection → form transition                */
/* -------------------------------------------------------------------------- */

export default function ServiceFormFlow({
  locale,
  cards,
}: {
  locale: string;
  cards: ServiceCardData[];
}) {
  const [activeService, setActiveService] = useState<ServiceSlug | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const resolvedLocale = locale === "es" || locale === "en" ? locale : "en";

  const handleSelect = useCallback((slug: ServiceSlug) => {
    setIsTransitioning(true);
    // Brief fade-out before swapping content
    setTimeout(() => {
      setActiveService(slug);
      setIsTransitioning(false);
    }, 200);
  }, []);

  const handleBack = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveService(null);
      setIsTransitioning(false);
    }, 200);
  }, []);

  // Handle hash-based service activation (from external links like #service-full-stack-builds)
  useEffect(() => {
    const activateFromHash = () => {
      const slug = parseServiceFromHash(window.location.hash);
      if (slug) {
        handleSelect(slug);
        // Clean up the hash so it doesn't re-trigger
        history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    };

    // Check on mount
    activateFromHash();

    // Listen for hash changes
    window.addEventListener("hashchange", activateFromHash);
    return () => window.removeEventListener("hashchange", activateFromHash);
  }, [handleSelect]);

  // Scroll to form container after transition
  useEffect(() => {
    if (!isTransitioning && containerRef.current) {
      containerRef.current.scrollIntoView?.({ behavior: "smooth", block: "start" });
    }
  }, [activeService, isTransitioning]);

  return (
    <div
      ref={containerRef}
      className="scroll-mt-24"
      style={{
        opacity: isTransitioning ? 0 : 1,
        transform: isTransitioning ? "translateY(12px)" : "translateY(0)",
        transition: "opacity 200ms ease-out, transform 200ms ease-out",
      }}
    >
      {activeService ? (
        <div className="space-y-8">
          {/* Back button */}
          <button
            type="button"
            onClick={handleBack}
            className="button-secondary inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{backLabels[resolvedLocale]}</span>
          </button>

          {/* Form panel */}
          <div className="surface-panel overflow-hidden border border-outline-ghost/10 bg-[linear-gradient(180deg,rgb(var(--surface-elevated)/0.9),rgb(var(--surface)/0.78))]">
            <div className="px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
              <div className="flex items-center gap-4 border-b border-outline-ghost/10 pb-5">
                <span
                  className="font-display text-[3rem] leading-none tracking-[-0.04em] text-brand-primary/25"
                  aria-hidden="true"
                >
                  {serviceIdentity[activeService].number}
                </span>
                <h3 className="text-2xl font-semibold text-text-primary sm:text-3xl">
                  {serviceIdentity[activeService][resolvedLocale]}
                </h3>
              </div>
              <p className="mt-5 text-base leading-7 text-text-secondary">
                {formSubtitles[resolvedLocale]}
              </p>

              <div className="mt-8">
                <IntakeForm locale={resolvedLocale} service={activeService} />
              </div>
            </div>
          </div>

          {/* Service switcher — jump to another service */}
          <div className="border-t border-outline-ghost/10 pt-8">
            <p className="mb-4 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">
              {resolvedLocale === "es" ? "O consultá por otro servicio" : "Or check out another service"}
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              {cards
                .filter((c) => c.slug !== activeService)
                .map((card) => (
                  <button
                    key={card.slug}
                    type="button"
                    onClick={() => handleSelect(card.slug)}
                    className="button-secondary inline-flex w-full items-center justify-center gap-2 sm:w-auto"
                  >
                    <span>{card.cta}</span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  </button>
                ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 lg:space-y-8">
          {cards.map((card, index) => (
            <FullWidthServiceCard
              key={card.slug}
              card={card}
              index={index}
              onSelect={() => handleSelect(card.slug)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
