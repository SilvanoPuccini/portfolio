import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import SectionShell from "@/components/site/SectionShell";
import { getSiteContent } from "@/content/site";
import { resolveLocale, type Locale } from "@/lib/i18n";

type LocaleParams = Promise<{ locale: string }>;

const copy = {
  es: {
    metaDescription:
      "Servicios de desarrollo web, automatización con IA y auditoría técnica. Full stack + criterio comercial para que no tengas que elegir entre velocidad y calidad.",
    hero: {
      eyebrow: "Servicios",
      title: "Convertí tu idea en un producto que funciona en producción.",
      subtitle:
        "Full stack + automatización + criterio comercial — para que no tengas que elegir entre velocidad y calidad.",
      primaryCta: "Agendá una llamada",
      secondaryCta: "Ver servicios",
    },
    metrics: [
      { value: "10+", label: "años en negocio" },
      { value: "65", label: "tests automatizados" },
      { value: "3", label: "proyectos en producción" },
      { value: "30 días", label: "de soporte incluido" },
    ],
    services: {
      eyebrow: "Cobertura real",
      title: "Tres servicios. Cada uno con proyectos que lo respaldan.",
      cards: [
        {
          number: "01",
          title: "Desarrollo web a medida",
          description:
            "Construcción end-to-end: frontend, backend, datos, autenticación y deploy. Proyectos que funcionan en producción desde el día uno.",
          details: [
            { label: "Frontend", value: "Next.js / React / TypeScript" },
            { label: "Backend", value: "Node.js / Django / Python / APIs" },
            { label: "Data", value: "PostgreSQL / Supabase / flujos" },
          ],
          references: ["FerrelonStock", "Aktivar", "PayTrack"],
          cta: "Consultar presupuesto",
        },
        {
          number: "02",
          title: "Automatización con IA",
          description:
            "Flujos que reemplazan trabajo manual repetitivo. Clasificación, extracción, validación y pipelines auditables — con humano en el loop cuando importa.",
          details: [
            { label: "Procesos", value: "Clasificación / extracción / validación" },
            { label: "Tooling", value: "Pipelines / agentes / dashboards" },
            { label: "Objetivo", value: "Velocidad con trazabilidad" },
          ],
          references: ["FacturIA 2.0", "PayTrack", "MCP / agentes IA"],
          cta: "Consultar factibilidad",
        },
        {
          number: "03",
          title: "Auditoría técnica",
          description:
            "Revisión de arquitectura, performance y deuda técnica. Salís con un diagnóstico claro y un roadmap ejecutable — no con una lista de problemas sin solución.",
          details: [
            { label: "Arquitectura", value: "Stack / escalabilidad / deuda" },
            { label: "Producto", value: "UX / narrativa / prioridades" },
            { label: "Salida", value: "Diagnóstico + roadmap" },
          ],
          references: ["Roadmaps técnicos", "Auditoría 360", "Negocio + ejecución"],
          cta: "Solicitar auditoría",
        },
      ],
    },
    approach: {
      eyebrow: "Proceso",
      title: "Orientado a claridad, viabilidad técnica y resultado.",
      description:
        "La metodología nace de dos capas: experiencia comercial para entender contexto, y práctica de desarrollo para construir soluciones estables.",
      steps: [
        {
          label: "01",
          title: "Entender el problema",
          detail:
            "Escucho, pregunto y analizo. 10 años en gestión comercial me enseñaron que el primer paso es entender el negocio, no el código.",
        },
        {
          label: "02",
          title: "Diseñar la solución",
          detail:
            "Arquitectura, estructura de datos, wireframes. Planifico antes de escribir una línea para evitar rehacer después.",
        },
        {
          label: "03",
          title: "Desarrollar con calidad",
          detail:
            "Código limpio, testing automatizado, documentación. No se entrega sin testear. 65 tests en FerrelonStock no fueron casualidad.",
        },
        {
          label: "04",
          title: "Entregar y acompañar",
          detail:
            "Deploy en producción, capacitación de uso, 30 días de soporte. El proyecto no termina cuando el código está listo.",
        },
      ],
    },
    cta: {
      title: "Tu próximo proyecto empieza con una conversación de 30 minutos.",
      subtitle:
        "Sin compromiso. Analizamos qué necesitás y si tiene sentido trabajar juntos.",
      primaryCta: "AGENDÁ LA LLAMADA",
      secondaryCta: "silvano@silvano.dev",
    },
  },
  en: {
    metaDescription:
      "Web development, AI automation, and technical audit services. Full stack + commercial judgment so you don't have to choose between speed and quality.",
    hero: {
      eyebrow: "Services",
      title: "Turn your idea into a product that works in production.",
      subtitle:
        "Full stack + automation + commercial judgment — so you don't have to choose between speed and quality.",
      primaryCta: "Schedule a call",
      secondaryCta: "See services",
    },
    metrics: [
      { value: "10+", label: "years in business" },
      { value: "65", label: "automated tests" },
      { value: "3", label: "projects in production" },
      { value: "30 days", label: "of support included" },
    ],
    services: {
      eyebrow: "Real coverage",
      title: "Three services. Each backed by real projects.",
      cards: [
        {
          number: "01",
          title: "Custom web development",
          description:
            "End-to-end build: frontend, backend, data, auth and deploy. Projects that work in production from day one.",
          details: [
            { label: "Frontend", value: "Next.js / React / TypeScript" },
            { label: "Backend", value: "Node.js / Django / Python / APIs" },
            { label: "Data", value: "PostgreSQL / Supabase / pipelines" },
          ],
          references: ["FerrelonStock", "Aktivar", "PayTrack"],
          cta: "Request a quote",
        },
        {
          number: "02",
          title: "AI automation",
          description:
            "Flows that replace repetitive manual work. Classification, extraction, validation and auditable pipelines — with a human in the loop when it matters.",
          details: [
            { label: "Processes", value: "Classification / extraction / validation" },
            { label: "Tooling", value: "Pipelines / agents / dashboards" },
            { label: "Goal", value: "Speed with traceability" },
          ],
          references: ["FacturIA 2.0", "PayTrack", "MCP / AI agents"],
          cta: "Check feasibility",
        },
        {
          number: "03",
          title: "Technical audit",
          description:
            "Architecture, performance and tech debt review. You leave with a clear diagnosis and an executable roadmap — not just a list of problems.",
          details: [
            { label: "Architecture", value: "Stack / scalability / debt" },
            { label: "Product", value: "UX / narrative / priorities" },
            { label: "Output", value: "Diagnosis + roadmap" },
          ],
          references: ["Technical roadmaps", "360 audit", "Business + execution"],
          cta: "Request an audit",
        },
      ],
    },
    approach: {
      eyebrow: "Process",
      title: "Built for clarity, technical viability, and outcome.",
      description:
        "The method comes from two layers: commercial experience to understand context, and development practice to build stable solutions.",
      steps: [
        {
          label: "01",
          title: "Understand the problem",
          detail:
            "I listen, ask, and analyze. Ten years in commercial management taught me that the first step is understanding the business, not the code.",
        },
        {
          label: "02",
          title: "Design the solution",
          detail:
            "Architecture, data structure, and wireframes. I plan before writing a single line to avoid rework later.",
        },
        {
          label: "03",
          title: "Develop with quality",
          detail:
            "Clean code, automated testing, and documentation. Nothing ships untested. The 65 tests in FerrelonStock were not accidental.",
        },
        {
          label: "04",
          title: "Deliver and support",
          detail:
            "Production deploy, usage training, and 30 days of support. The project does not end when the code is ready.",
        },
      ],
    },
    cta: {
      title: "Your next project starts with a 30-minute conversation.",
      subtitle:
        "No commitment. We analyze what you need and whether it makes sense to work together.",
      primaryCta: "SCHEDULE A CALL",
      secondaryCta: "silvano@silvano.dev",
    },
  },
} as const;

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M19.11 4.89A9.88 9.88 0 0 0 12.06 2C6.57 2 2.1 6.47 2.1 11.96c0 1.76.46 3.47 1.33 4.98L2 22l5.22-1.37a9.9 9.9 0 0 0 4.74 1.21h.01c5.49 0 9.96-4.47 9.96-9.96a9.9 9.9 0 0 0-2.82-6.99ZM12 20.16h-.01a8.21 8.21 0 0 1-4.19-1.15l-.3-.18-3.1.81.83-3.02-.2-.31a8.25 8.25 0 0 1 12.81-10.2A8.16 8.16 0 0 1 20.26 12c0 4.55-3.71 8.16-8.26 8.16Zm4.53-6.15c-.25-.13-1.47-.72-1.7-.8-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.14.17-.28.19-.53.06-.25-.13-1.05-.39-2-.25-.74-.66-1.24-1.47-1.39-1.72-.15-.25-.02-.38.11-.51.11-.11.25-.28.37-.42.12-.14.16-.24.24-.41.08-.16.04-.31-.02-.44-.06-.13-.56-1.35-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.16 0-.43.06-.66.31-.23.25-.86.84-.86 2.05 0 1.2.88 2.36 1 2.52.12.16 1.69 2.58 4.1 3.62.57.25 1.02.4 1.37.51.58.18 1.1.16 1.52.1.46-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.3Z" />
    </svg>
  );
}

export async function generateMetadata({
  params,
}: {
  params: LocaleParams;
}): Promise<Metadata> {
  const { locale } = await params;
  const currentLocale: Locale = resolveLocale(locale);
  const content = getSiteContent(currentLocale);
  const labels = copy[currentLocale];

  return {
    title: `${content.metadata.siteName} | ${content.navigation.find((item) => item.key === "services")?.label ?? "Services"}`,
    description: labels.metaDescription,
  };
}

export default async function ServicesPage({
  params,
}: {
  params: LocaleParams;
}) {
  const { locale } = await params;
  const currentLocale: Locale = resolveLocale(locale);
  const content = getSiteContent(currentLocale);
  const labels = copy[currentLocale];
  const phoneHref = `https://wa.me/${content.metadata.phone.replace(/\D/g, "")}`;

  return (
    <>
      {/* ── HERO — orientado al resultado del cliente ── */}
      <section className="site-container py-16 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-4xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-primary">
            {labels.hero.eyebrow}
          </p>
          <h1 className="mt-5 text-5xl font-semibold leading-[1.07] tracking-tight text-text-primary sm:text-6xl lg:text-7xl">
            {labels.hero.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-text-secondary sm:text-xl sm:leading-9">
            {labels.hero.subtitle}
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <a
              href={phoneHref}
              target="_blank"
              rel="noreferrer"
              className="button-primary inline-flex w-full items-center justify-center gap-2.5 sm:w-auto sm:min-w-[14rem]"
            >
              <WhatsAppIcon className="h-[1.1rem] w-[1.1rem] shrink-0" />
              <span>{labels.hero.primaryCta}</span>
              <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" />
            </a>
            <a
              href="#servicios"
              className="button-secondary inline-flex w-full items-center justify-center sm:w-auto sm:min-w-[14rem]"
            >
              {labels.hero.secondaryCta}
            </a>
          </div>
        </div>
      </section>

      {/* ── MÉTRICAS ── */}
      <div className="border-y border-outline-ghost/10 bg-[linear-gradient(180deg,rgb(var(--surface)/0.5),rgb(var(--surface-dim)/0.7))]">
        <div className="site-container py-8 sm:py-10">
          <div className="grid grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-4">
            {labels.metrics.map((metric, i) => (
              <div key={i} className="flex flex-col items-start">
                <span
                  className="text-3xl font-semibold leading-none sm:text-4xl"
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    color: "rgb(var(--brand-primary))",
                  }}
                >
                  {metric.value}
                </span>
                <span className="mt-2 font-mono text-[11px] uppercase tracking-[0.16em] text-text-tertiary">
                  {metric.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SERVICIOS ── */}
      <div id="servicios" />
      <SectionShell
        eyebrow={labels.services.eyebrow}
        title={labels.services.title}
        sectionClassName="bg-[linear-gradient(180deg,rgb(var(--surface)/0.16),rgb(var(--surface-dim)/0.26))]"
        containerClassName="py-10 sm:py-12 lg:py-16"
        surface="plain"
      >
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {labels.services.cards.map((service, index) => (
            <article
              key={service.number}
              className={`surface-panel no-line-stack flex h-full flex-col overflow-hidden border border-outline-ghost/10 px-5 py-6 sm:px-6 sm:py-7 ${
                index === 1
                  ? "bg-[linear-gradient(180deg,rgb(var(--surface-elevated)/0.9),rgb(var(--surface)/0.78))]"
                  : "bg-[linear-gradient(180deg,rgb(var(--surface)/0.72),rgb(var(--surface-dim)/0.88))]"
              }`}
            >
              {/* Número */}
              <div className="border-b border-outline-ghost/10 pb-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-text-tertiary">
                  {service.number}
                </p>
              </div>

              {/* Contenido */}
              <div className="mt-6 flex flex-1 flex-col">
                <div>
                  <h3 className="text-2xl font-semibold text-text-primary">
                    {service.title}
                  </h3>
                  <p className="mt-4 text-sm leading-6 text-text-secondary sm:text-base sm:leading-7">
                    {service.description}
                  </p>
                </div>

                {/* Stack details */}
                <div className="mt-6 grid gap-2">
                  {service.details.map((detail) => (
                    <div
                      key={detail.label}
                      className="rounded-[var(--radius-soft)] border border-outline-ghost/10 bg-[rgb(var(--background)/0.1)] px-4 py-3"
                    >
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-tertiary">
                        {detail.label}
                      </p>
                      <p
                        className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.04em] whitespace-nowrap"
                        style={{ color: "rgb(var(--brand-primary))" }}
                      >
                        {detail.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Referencias */}
                <div className="mt-5 flex flex-wrap gap-2">
                  {service.references.map((ref) => (
                    <span
                      key={ref}
                      className="rounded-pill border border-outline-ghost/12 bg-surface-dim/75 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-text-secondary"
                    >
                      {ref}
                    </span>
                  ))}
                </div>

                {/* CTA por card */}
                <div className="mt-auto border-t border-outline-ghost/10 pt-6">
                  <a
                    href={phoneHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-brand-primary transition-colors hover:text-text-primary"
                  >
                    {service.cta}
                    <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </SectionShell>

      {/* ── PROCESO ── */}
      <SectionShell
        sectionClassName="bg-[linear-gradient(180deg,rgb(var(--surface)/0.08),rgb(var(--surface-dim)/0.22))]"
        containerClassName="py-10 sm:py-12 lg:py-16"
        surface="plain"
      >
        <div className="space-y-10 sm:space-y-12">
          <div className="max-w-3xl no-line-stack">
            <p className="technical-label">{labels.approach.eyebrow}</p>
            <h2 className="text-3xl font-semibold text-text-primary sm:text-4xl">
              {labels.approach.title}
            </h2>
            <p className="text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">
              {labels.approach.description}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {labels.approach.steps.map((step) => (
              <article
                key={step.label}
                className="surface-panel no-line-stack h-full border border-outline-ghost/10 bg-[rgb(var(--background)/0.1)] px-5 py-6 sm:px-6"
              >
                <div className="border-b border-outline-ghost/10 pb-4">
                  <span className="font-display text-[2.4rem] leading-none tracking-[-0.04em] text-brand-primary">
                    {step.label}
                  </span>
                </div>
                <div className="mt-5 space-y-3">
                  <h3 className="text-xl font-semibold tracking-tight text-text-primary sm:text-[1.35rem]">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-6 text-text-secondary sm:text-base sm:leading-7">
                    {step.detail}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </SectionShell>

      {/* ── CTA CIERRE ── */}
      <section className="site-container py-16 sm:py-20 lg:py-28">
        <div className="group relative overflow-hidden rounded-sm border border-outline-ghost/10 bg-[rgb(var(--surface-elevated))] px-8 py-14 text-center sm:px-16 sm:py-20">
          {/* glows */}
          <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-primary/8 blur-[100px] transition-colors duration-700 group-hover:bg-brand-primary/14" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-brand-secondary/8 blur-[80px]" />

          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl font-semibold leading-tight tracking-tight text-text-primary sm:text-4xl lg:text-5xl">
              {labels.cta.title}
            </h2>
            <p className="mt-5 text-base leading-7 text-text-secondary sm:text-lg">
              {labels.cta.subtitle}
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <a
                href={phoneHref}
                target="_blank"
                rel="noreferrer"
                className="button-primary inline-flex w-full items-center justify-center gap-2.5 sm:w-auto sm:min-w-[16rem]"
              >
                <WhatsAppIcon className="h-[1.1rem] w-[1.1rem] shrink-0" />
                <span>{labels.cta.primaryCta}</span>
                <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" />
              </a>
              <Link
                href={`/${currentLocale}/contact`}
                className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary transition-colors hover:text-brand-primary"
              >
                {labels.cta.secondaryCta}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
