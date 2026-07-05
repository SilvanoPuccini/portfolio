import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";

import PageHero from "@/components/site/PageHero";
import SectionShell from "@/components/site/SectionShell";
import ServiceFormFlow from "@/components/blocks/ServiceFormFlow";
import type { ServiceCardData } from "@/components/blocks/ServiceFormFlow";
import { getSiteContent } from "@/content/site";
import { resolveLocale, type Locale } from "@/lib/i18n";
import { generatePageMetadata } from "@/lib/metadata";
import ServiceJsonLd from "@/components/blocks/ServiceJsonLd";

type LocaleParams = Promise<{ locale: string }>;

const copy = {
  es: {
    metaDescription:
      "Servicios de desarrollo web, automatización con IA y auditoría técnica. Full stack + criterio comercial para que no tengas que elegir entre velocidad y calidad.",
    hero: {
      eyebrow: "Servicios",
      title: "Convertí tu idea en un producto que funciona en producción.",
      subtitle:
        "Arquitectura de software de alto rendimiento diseñada para escalar. Resolvemos cuellos de botella técnicos para que puedas enfocarte en el crecimiento de tu negocio.",
      description:
        "Full stack + automatización + criterio comercial — para que no tengas que elegir entre velocidad y calidad.",
      primaryCta: "Ver servicios",
      secondaryCta: "Ver servicios",
    },
    metrics: [
      { value: "10 años", label: "en negocio" },
      { value: "65", label: "tests automatizados" },
      { value: "7", label: "proyectos en producción" },
      { value: "30 días", label: "de soporte incluido" },
    ],
    services: {
      eyebrow: "Cobertura real",
      title: "Tres servicios. Cada uno con proyectos que lo respaldan.",
      cards: [
        {
          number: "01",
          subtitle: "La estructura digital de tu negocio",
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
          slug: "full-stack-builds" as const,
        },
        {
          number: "02",
          subtitle: "Los procesos que corren sin vos",
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
          slug: "automation-ai" as const,
        },
        {
          number: "03",
          subtitle: "Claridad antes de invertir",
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
          slug: "product-ux-engineering" as const,
        },
      ],
    },
    howIWork: {
      eyebrow: "Método",
      title: "Cómo trabajo",
      description:
        "Cada proyecto pasa por cuatro ejes que garantizan que la solución funcione en producción y tenga impacto real en tu negocio.",
      pillars: [
        {
          title: "Estructura",
          description:
            "Arquitectura sólida que sostiene tu operación digital. Base de datos, backend, frontend y deploy — todo conectado y testeado.",
          anchor: "FerrelonStock",
          anchorDetail: "E-commerce con 65 tests, panel admin y gestión de inventario",
        },
        {
          title: "Procesos",
          description:
            "Automatizo lo que hoy hacés a mano. Clasificación, extracción y validación con IA — para que no pierdas tiempo en tareas repetitivas.",
          anchor: "FacturIA 2.0",
          anchorDetail: "Pipeline de facturación automatizada con IA",
        },
        {
          title: "Liderazgo",
          description:
            "Antes de escribir código, entiendo tu negocio. 10 años en gestión comercial me enseñaron que el problema real rara vez es el que te dicen primero.",
          anchor: "+10 años en negocio",
          anchorDetail: "Experiencia comercial aplicada a decisiones técnicas",
        },
        {
          title: "Libertad",
          description:
            "El objetivo final: que tu sistema funcione sin depender de mí. Código documentado, paneles de admin y procesos que corren solos.",
          anchor: "My Marketing Agency",
          anchorDetail: "SaaS donde el cliente opera sin asistencia técnica",
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
    closing:
      "Completá el formulario del servicio que te interesa para agendar tu llamada de diagnóstico gratuita.",
  },
  en: {
    metaDescription:
      "Web development, AI automation, and technical audit services. Full stack + commercial judgment so you don't have to choose between speed and quality.",
    hero: {
      eyebrow: "Services",
      title: "Turn your idea into a product that works in production.",
      subtitle:
        "High-performance software architecture designed to scale. We resolve technical bottlenecks so you can focus on growing your business.",
      description:
        "Full stack + automation + commercial judgment — so you don't have to choose between speed and quality.",
      primaryCta: "See services",
      secondaryCta: "See services",
    },
    metrics: [
      { value: "10 years", label: "in business" },
      { value: "65", label: "automated tests" },
      { value: "7", label: "projects in production" },
      { value: "30 days", label: "of support included" },
    ],
    services: {
      eyebrow: "Real coverage",
      title: "Three services. Each backed by real projects.",
      cards: [
        {
          number: "01",
          subtitle: "The digital backbone of your business",
          title: "Custom web development",
          description:
            "End-to-end build: frontend, backend, data, auth, and deploy. Projects that work in production from day one.",
          details: [
            { label: "Frontend", value: "Next.js / React / TypeScript" },
            { label: "Backend", value: "Node.js / Django / Python / APIs" },
            { label: "Data", value: "PostgreSQL / Supabase / pipelines" },
          ],
          references: ["FerrelonStock", "Aktivar", "PayTrack"],
          cta: "Request a quote",
          slug: "full-stack-builds" as const,
        },
        {
          number: "02",
          subtitle: "Processes that run without you",
          title: "AI automation",
          description:
            "Flows that replace repetitive manual work. Classification, extraction, validation, and auditable pipelines — with a human in the loop when it matters.",
          details: [
            { label: "Processes", value: "Classification / extraction / validation" },
            { label: "Tooling", value: "Pipelines / agents / dashboards" },
            { label: "Goal", value: "Speed with traceability" },
          ],
          references: ["FacturIA 2.0", "PayTrack", "MCP / AI agents"],
          cta: "Check feasibility",
          slug: "automation-ai" as const,
        },
        {
          number: "03",
          subtitle: "Clarity before you invest",
          title: "Technical audit",
          description:
            "Architecture, performance, and tech debt review. You leave with a clear diagnosis and an executable roadmap — not just a list of problems.",
          details: [
            { label: "Architecture", value: "Stack / scalability / debt" },
            { label: "Product", value: "UX / narrative / priorities" },
            { label: "Output", value: "Diagnosis + roadmap" },
          ],
          references: ["Technical roadmaps", "360 audit", "Business + execution"],
          cta: "Request an audit",
          slug: "product-ux-engineering" as const,
        },
      ],
    },
    howIWork: {
      eyebrow: "Method",
      title: "How I work",
      description:
        "Every project goes through four pillars that ensure the solution works in production and delivers real business impact.",
      pillars: [
        {
          title: "Structure",
          description:
            "Solid architecture that supports your digital operation. Database, backend, frontend, and deploy — all connected and tested.",
          anchor: "FerrelonStock",
          anchorDetail: "E-commerce with 65 tests, admin panel, and inventory management",
        },
        {
          title: "Processes",
          description:
            "I automate what you do by hand today. Classification, extraction, and AI-powered validation — so you stop wasting time on repetitive tasks.",
          anchor: "FacturIA 2.0",
          anchorDetail: "AI-powered automated invoicing pipeline",
        },
        {
          title: "Leadership",
          description:
            "Before writing code, I understand your business. Ten years in commercial management taught me that the real problem is rarely what they tell you first.",
          anchor: "Business experience",
          anchorDetail: "Commercial experience applied to technical decisions",
        },
        {
          title: "Freedom",
          description:
            "The end goal: your system works without depending on me. Documented code, admin panels, and processes that run on their own.",
          anchor: "My Marketing Agency",
          anchorDetail: "SaaS where the client operates without technical assistance",
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
    closing:
      "Complete the service form that interests you to schedule your free diagnostic call.",
  },
} as const;


export async function generateMetadata({
  params,
}: {
  params: LocaleParams;
}): Promise<Metadata> {
  const { locale } = await params;
  const currentLocale: Locale = resolveLocale(locale);
  const content = getSiteContent(currentLocale);
  const labels = copy[currentLocale];

  const servicesLabel = content.navigation.find((item) => item.key === "services")?.label ?? "Services";

  return generatePageMetadata({
    locale: currentLocale,
    path: "services",
    title: `${content.metadata.siteName} | ${servicesLabel}`,
    description: labels.metaDescription,
  });
}

export default async function ServicesPage({
  params,
}: {
  params: LocaleParams;
}) {
  const { locale } = await params;
  const currentLocale: Locale = resolveLocale(locale);
  const labels = copy[currentLocale];

  const serviceSchemas = labels.services.cards.map((card, index) => ({
    name: card.title,
    description: card.description,
    url: `https://silvanopuccini.dev/${currentLocale}/services#service-${index + 1}`,
  }));

  // Build ServiceCardData array for the client component
  const serviceCards: ServiceCardData[] = labels.services.cards.map((card) => ({
    number: card.number,
    subtitle: card.subtitle,
    title: card.title,
    description: card.description,
    details: [...card.details],
    references: [...card.references],
    cta: card.cta,
    slug: card.slug,
  }));

  return (
    <>
      <ServiceJsonLd
        services={serviceSchemas}
        providerName="Silvano Puccini"
        providerUrl="https://silvanopuccini.dev"
      />
      {/* ── HERO ── */}
      <PageHero
        eyebrow={labels.hero.eyebrow}
        title={labels.hero.title}
        subtitle={<p>{labels.hero.subtitle}</p>}
        description={<p>{labels.hero.description}</p>}
        actions={
          <>
            <a
              href="#servicios"
              className="button-primary w-full gap-2.5 sm:min-w-[13.5rem] sm:w-auto"
            >
              <span>{labels.hero.primaryCta}</span>
              <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" />
            </a>
            <a
              href="#servicios"
              className="button-secondary w-full sm:min-w-[13.5rem] sm:w-auto"
            >
              {labels.hero.secondaryCta}
            </a>
          </>
        }
      />

      {/* ── METRICS ── */}
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

      {/* ── SERVICES (vertical stack with form flow) ── */}
      <div id="servicios" />
      <SectionShell
        eyebrow={labels.services.eyebrow}
        title={labels.services.title}
        sectionClassName="bg-[linear-gradient(180deg,rgb(var(--surface)/0.16),rgb(var(--surface-dim)/0.26))]"
        containerClassName="py-10 sm:py-12 lg:py-16"
        surface="plain"
      >
        <ServiceFormFlow locale={currentLocale} cards={serviceCards} />
      </SectionShell>

      {/* ── HOW I WORK ── */}
      <SectionShell
        eyebrow={labels.howIWork.eyebrow}
        title={labels.howIWork.title}
        description={labels.howIWork.description}
        sectionClassName="bg-[linear-gradient(180deg,rgb(var(--surface-dim)/0.18),rgb(var(--surface)/0.12))]"
        containerClassName="py-10 sm:py-12 lg:py-16"
        surface="plain"
      >
        <div className="grid gap-5 md:grid-cols-2">
          {labels.howIWork.pillars.map((pillar, index) => (
            <article
              key={pillar.title}
              className="surface-panel no-line-stack group relative flex flex-col overflow-hidden border border-outline-ghost/10 bg-[rgb(var(--background)/0.1)] px-6 py-7 sm:px-7 sm:py-8"
            >
              <div className="flex items-start justify-between gap-4">
                <span
                  className="font-display text-[2.8rem] leading-none tracking-[-0.04em] text-brand-primary/20"
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-4 text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">
                {pillar.title}
              </h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-text-secondary sm:text-base sm:leading-7">
                {pillar.description}
              </p>
              <div className="mt-5 border-t border-outline-ghost/10 pt-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-brand-primary">
                  {pillar.anchor}
                </p>
                <p className="mt-1 text-xs leading-5 text-text-tertiary">
                  {pillar.anchorDetail}
                </p>
              </div>
            </article>
          ))}
        </div>
      </SectionShell>

      {/* ── PROCESS ── */}
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

      {/* ── CLOSING TEXT ── */}
      <section className="site-container py-14 sm:py-18 lg:py-22">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-lg leading-8 text-text-secondary sm:text-xl sm:leading-9">
            {labels.closing}
          </p>
        </div>
      </section>
    </>
  );
}
