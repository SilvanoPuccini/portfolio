import { ArrowUpRight, Check } from "lucide-react";

import { activePackages, type FixedPackage } from "@/content/packages";
import type { Locale } from "@/lib/i18n";

const copy = {
  es: {
    eyebrow: "Precio cerrado",
    days: (n: number) => `Entrega en ${n} días hábiles`,
    cta: "Contratar y firmar",
    note: "Firmás online y te llega el mail de pago. Sin llamada previa.",
  },
  en: {
    eyebrow: "Fixed price",
    days: (n: number) => `Delivered in ${n} business days`,
    cta: "Get it and sign",
    note: "Sign online and get the payment email. No call needed.",
  },
} as const;

/**
 * Fixed-price packages, bought through a Documenso direct link.
 * Renders nothing until a package is active and has a link (see content/packages.ts).
 */
export default function PackageBanner({
  locale,
  packages = activePackages(),
}: {
  locale: Locale;
  packages?: FixedPackage[];
}) {
  if (packages.length === 0) return null;
  const labels = copy[locale];

  return (
    <div className="mb-10 space-y-4">
      {packages.map((pkg) => (
        <article
          key={pkg.slug}
          className="surface-panel flex flex-col gap-6 border border-brand-primary/25 bg-brand-primary/5 px-5 py-6 sm:px-8 lg:flex-row lg:items-center lg:justify-between"
        >
          <div className="max-w-2xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-brand-primary">
              {labels.eyebrow}
            </p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">
              {pkg.name[locale]}
            </h3>
            <p className="mt-2 text-sm leading-6 text-text-secondary">{pkg.summary[locale]}</p>
            <ul className="mt-4 space-y-1.5">
              {pkg.includes[locale].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-text-secondary">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="shrink-0 lg:text-right">
            <p className="font-mono text-3xl font-semibold text-text-primary">{`USD ${pkg.priceUsd.toLocaleString(locale === "es" ? "es-AR" : "en-US")}`}</p>
            <p className="mt-1 text-sm text-text-tertiary">{labels.days(pkg.deliveryDays)}</p>
            <a
              href={pkg.directLink ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="button-primary mt-4 inline-flex items-center justify-center gap-2"
            >
              {labels.cta}
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <p className="mt-2 max-w-[16rem] text-xs leading-5 text-text-tertiary lg:ml-auto">{labels.note}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
