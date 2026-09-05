"use client";

import Link from "next/link";
import Reveal, { STAGGER } from "@/components/site/Reveal";
import { ArrowRight } from "lucide-react";

/**
 * Franja de evidencia.
 *
 * Reemplaza al bloque anterior de seis tarjetas de texto: aquellas enunciaban
 * atributos ("stack enfocado en producto") en vez de mostrar hechos, ocupaban
 * cerca de 700 px y nadie las leía. Un número verificable pesa más que una
 * declaración, y se escanea en un segundo.
 */

const copy = {
  es: {
    eyebrow: "Evidencia",
    title: "Números, no promesas.",
    intro:
      "Todo lo que sigue se puede verificar entrando a los proyectos o pidiendo el presupuesto.",
    stats: [
      { value: "6", label: "aplicaciones desplegadas y online" },
      { value: "10+", label: "años en gestión comercial" },
      { value: "4", label: "servicios con precio cerrado" },
      { value: "24 h", label: "para responder tu consulta" },
    ],
    cta: "Ver servicios y precios",
    href: "/es/services#precios",
  },
  en: {
    eyebrow: "Evidence",
    title: "Numbers, not promises.",
    intro: "Everything below can be verified by opening the projects or asking for a quote.",
    stats: [
      { value: "6", label: "applications deployed and online" },
      { value: "10+", label: "years in commercial management" },
      { value: "4", label: "services with fixed pricing" },
      { value: "24 h", label: "to answer your enquiry" },
    ],
    cta: "See services and pricing",
    href: "/en/services#precios",
  },
} as const;

export default function TrustStrip({ locale }: { locale: string }) {
  const t = locale === "en" ? copy.en : copy.es;

  return (
    <section className="relative overflow-hidden border-y border-outline-ghost/10 bg-[linear-gradient(180deg,rgb(var(--surface-dim)/0.22),rgb(var(--surface)/0.10))]">
      <div className="mx-auto max-w-[80rem] section-rhythm px-6 sm:px-8">
        <div className="lg:flex lg:items-end lg:justify-between lg:gap-12">
          <div className="max-w-xl">
            <p className="section-eyebrow">
              {t.eyebrow}
            </p>
            <h2 className="mt-4 section-title">
              {t.title}
            </h2>
            <p className="mt-5 section-lede">{t.intro}</p>
          </div>

          <div className="mt-7 lg:mt-0 lg:shrink-0">
            <Link href={t.href} className="button-primary inline-flex items-center gap-2.5">
              <span>{t.cta}</span>
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <dl className="mt-11 grid gap-x-8 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
          {t.stats.map((stat, i) => (
            <Reveal
              key={stat.label}
              delay={i * STAGGER}
              className="border-t border-outline-ghost/15 pt-5"
            >
              <dt className="sr-only">{stat.label}</dt>
              <dd>
                <span className="block text-4xl font-semibold tracking-[-0.03em] text-text-primary sm:text-5xl">
                  {stat.value}
                </span>
                <span className="mt-2 block text-sm leading-6 text-text-secondary">
                  {stat.label}
                </span>
              </dd>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}
