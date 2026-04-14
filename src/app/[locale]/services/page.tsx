import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import ServiceCard from "@/components/blocks/ServiceCard";
import CTACluster from "@/components/site/CTACluster";
import PageHero from "@/components/site/PageHero";
import SectionShell from "@/components/site/SectionShell";
import { getSiteContent } from "@/content/site";
import { resolveLocale, type Locale } from "@/lib/i18n";

type LocaleParams = Promise<{ locale: string }>;

const copy = {
  es: {
    metaDescription:
      "Servicios de desarrollo web, automatización con IA y auditoría técnica, adaptados al sistema editorial del portfolio y respaldados por experiencia verificable.",
    hero: {
      eyebrow: "Servicios",
      titleStart: "Soluciones con",
      titleAccent: "Precisión Técnica",
      intro:
        "Diseño, construyo y ordeno productos digitales con una lógica clara: resolver negocio real con software bien pensado, mantenible y listo para crecer.",
      support:
        "El perfil es híbrido por una razón concreta: combina ingeniería full stack, automatización aplicada y lectura comercial para tomar mejores decisiones antes, durante y después de construir.",
      primaryCta: "Agenda tu llamada",
      secondaryCta: "Ir a contacto",
    },
    services: {
      eyebrow: "Cobertura real",
      title:
        "Tres líneas de servicio sostenidas por trabajo publicado y experiencia verificable.",
      description:
        "No son categorías decorativas: cada frente conecta con proyectos reales, tecnologías visibles y decisiones que ya aparecen en el portfolio, el CV o repositorios públicos.",
      proofLabel: "Señales de prueba",
      referencesLabel: "Referencias",
    },
    approach: {
      ctaQuestion: "¿Tenés un proyecto en mente?",
      ctaTitle: "Agendá una conversación de 30 minutos sin compromiso.",
      ctaLabel: "Iniciar conversación",
      eyebrow: "Approach",
      titleLines: [
        "Proceso orientado a claridad,",
        "viabilidad técnica y resultado.",
      ],
      description:
        "La metodología nace de dos capas: experiencia comercial para entender contexto, y práctica de desarrollo para construir soluciones estables.",
      steps: [
        {
          label: "01",
          titleLines: ["Entender el", "problema"],
          detail:
            "Escucho, pregunto y analizo. 10 años en gestión comercial me enseñaron que el primer paso es entender el negocio, no el código.",
        },
        {
          label: "02",
          titleLines: ["Diseñar la", "solución"],
          detail:
            "Arquitectura, estructura de datos, wireframes. Planifico antes de escribir una línea para evitar rehacer después.",
        },
        {
          label: "03",
          titleLines: ["Desarrollar", "con calidad"],
          detail:
            "Código limpio, testing automatizado, documentación. No se entrega sin testear. 65 tests en FerrelonStock no fueron casualidad.",
        },
        {
          label: "04",
          titleLines: ["Entregar y", "acompañar"],
          detail:
            "Deploy en producción, capacitación de uso, 30 días de soporte. El proyecto no termina cuando el código está listo.",
        },
      ],
    },
    philosophy: {
      eyebrow: "Filosofía",
      title: "Código que resuelve problemas, no que los crea",
      paragraphs: [
        "Cada línea de código es escrita con mantenibilidad y escalabilidad en mente. No solo resuelvo problemas, creo activos digitales que generan valor a largo plazo.",
      ],
      statsTitle: "Señales concretas",
      statLabels: {
        projects: "Proyectos publicados",
        services: "Servicios principales",
        background: "Años de experiencia previa",
      },
    },
  },
  en: {
    metaDescription:
      "Web development, AI automation, and technical audit services adapted to the portfolio's editorial system and backed by verifiable experience.",
    hero: {
      eyebrow: "Digital capabilities",
      titleStart: "Solutions with",
      titleAccent: "Technical Precision.",
      intro:
        "I design, build, and structure digital products with a clear logic: solve real business problems through thoughtful, maintainable software ready to scale.",
      support:
        "The profile is hybrid for a practical reason: it combines full stack engineering, applied automation, and commercial awareness to make better decisions before, during, and after shipping.",
      profileLabel: "Hybrid profile",
      profileTitle: "Product, system, and business in the same conversation.",
      profileBody:
        "I work from architecture to final experience, avoiding generic packages and prioritizing solutions that can be audited, operated, and evolved with judgment.",
      metrics: [
        { label: "Coverage", value: "3 core fronts" },
        { label: "Background", value: "10+ years in business" },
        { label: "Evidence", value: "Real projects and cases" },
      ],
      primaryCta: "Schedule your call",
      secondaryCta: "Go to contact",
    },
    services: {
      eyebrow: "Real coverage",
      title:
        "Three service lines sustained by published work and verifiable background.",
      description:
        "These are not decorative categories: each line connects to real projects, visible technologies, and decisions already present in the portfolio, resume, or public repositories.",
      proofLabel: "Proof signals",
      referencesLabel: "References",
    },
    approach: {
      ctaQuestion: "Do you have a project in mind?",
      ctaTitle: "Schedule a 30-minute conversation with no commitment.",
      ctaLabel: "Start the conversation",
      eyebrow: "Approach",
      titleLines: [
        "A process built for clarity,",
        "technical viability, and outcome.",
      ],
      description:
        "The method comes from two layers: commercial experience to understand context, and development practice to build stable solutions.",
      steps: [
        {
          label: "01",
          titleLines: ["Understand the", "problem"],
          detail:
            "I listen, ask, and analyze. Ten years in commercial management taught me that the first step is understanding the business, not the code.",
        },
        {
          label: "02",
          titleLines: ["Design the", "solution"],
          detail:
            "Architecture, data structure, and wireframes. I plan before writing a single line to avoid rework later.",
        },
        {
          label: "03",
          titleLines: ["Develop with", "quality"],
          detail:
            "Clean code, automated testing, and documentation. Nothing ships untested. The 65 tests in FerrelonStock were not accidental.",
        },
        {
          label: "04",
          titleLines: ["Deliver and", "support"],
          detail:
            "Production deploy, usage training, and 30 days of support. The project does not end when the code is ready.",
        },
      ],
    },
    philosophy: {
      eyebrow: "Philosophy",
      title:
        "The best solution is not always the biggest one: it is the one that organizes complexity without losing precision.",
      paragraphs: [
        "My way of working avoids the noise of offering everything. I prefer to define clearly which problem should be solved, at what level of sophistication, and under which real constraints.",
        "Previous commercial experience adds something that purely technical profiles often miss: sensitivity to prioritize, explain impact, and sustain useful conversations with business stakeholders.",
        "When frontend, backend, automation, and product are treated as parts of the same system, execution gains focus and the outcome becomes more stable.",
      ],
      statsTitle: "Concrete signals",
      statLabels: {
        projects: "Published projects",
        services: "Primary services",
        background: "Years of previous background",
      },
    },
  },
} as const;

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M19.11 4.89A9.88 9.88 0 0 0 12.06 2C6.57 2 2.1 6.47 2.1 11.96c0 1.76.46 3.47 1.33 4.98L2 22l5.22-1.37a9.9 9.9 0 0 0 4.74 1.21h.01c5.49 0 9.96-4.47 9.96-9.96a9.9 9.9 0 0 0-2.82-6.99ZM12 20.16h-.01a8.21 8.21 0 0 1-4.19-1.15l-.3-.18-3.1.81.83-3.02-.2-.31a8.25 8.25 0 0 1 12.81-10.2A8.16 8.16 0 0 1 20.26 12c0 4.55-3.71 8.16-8.26 8.16Zm4.53-6.15c-.25-.13-1.47-.72-1.7-.8-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.14.17-.28.19-.53.06-.25-.13-1.05-.39-2-.25-.74-.66-1.24-1.47-1.39-1.72-.15-.25-.02-.38.11-.51.11-.11.25-.28.37-.42.12-.14.16-.24.24-.41.08-.16.04-.31-.02-.44-.06-.13-.56-1.35-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.16 0-.43.06-.66.31-.23.25-.86.84-.86 2.05 0 1.2.88 2.36 1 2.52.12.16 1.69 2.58 4.1 3.62.57.25 1.02.4 1.37.51.58.18 1.1.16 1.52.1.46-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.3Z" />
    </svg>
  );
}

const sectionBackgrounds = {
  services:
    "bg-[linear-gradient(180deg,rgb(var(--surface)/0.16),rgb(var(--surface-dim)/0.26))]",
  approach:
    "bg-[linear-gradient(180deg,rgb(var(--surface)/0.08),rgb(var(--surface-dim)/0.22))]",
  philosophy:
    "bg-[linear-gradient(180deg,rgb(var(--surface-elevated)/0.18),rgb(var(--surface)/0.1))]",
} as const;

const spanishDigitalCapabilities = [
  {
    number: "01",
    title: "Desarrollo web a medida",
    description:
      "Construcción end-to-end de productos, plataformas y herramientas internas con frontend, backend, datos, autenticación, despliegue y criterio editorial en la experiencia.",
    details: [
      {
        label: "Frontend",
        value: "Next.js / React / TypeScript",
      },
      {
        label: "Backend",
        value: "Node.js / Django / Python / APIs",
      },
      {
        label: "Data",
        value: "PostgreSQL / Supabase / flujos",
      },
    ],
    references: ["FerrelonStock", "Aktivar", "PayTrack"],
  },
  {
    number: "02",
    title: "Automatización con IA",
    description:
      "Diseño de flujos asistidos por IA para reducir tareas manuales, clasificar información, documentar procesos y convertir operaciones repetitivas en sistemas auditables.",
    details: [
      {
        label: "Procesos",
        value: "Clasificación / extracción / validación",
      },
      {
        label: "Tooling",
        value: "Pipelines / agentes / dashboards",
      },
      {
        label: "Objetivo",
        value: "Velocidad con trazabilidad",
      },
    ],
    references: ["FacturIA 2.0", "PayTrack", "MCP / agentes IA"],
  },
  {
    number: "03",
    title: "Auditoría técnica",
    description:
      "Revisión de arquitectura, UX técnica, performance y claridad de producto para detectar fricción, ordenar prioridades y proponer un siguiente paso ejecutable.",
    details: [
      {
        label: "Arquitectura",
        value: "Stack / escalabilidad / deuda",
      },
      {
        label: "Producto",
        value: "UX / narrativa / prioridades",
      },
      {
        label: "Salida",
        value: "Diagnóstico + roadmap",
      },
    ],
    references: [
      "Roadmaps técnicos",
      "Auditoría 360",
      "Visión negocio + ejecución",
    ],
  },
] as const;

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
  const englishHero = currentLocale === "en" ? copy.en.hero : null;
  const projectBySlug = new Map(
    content.projects.map((project) => [project.slug, project]),
  );
  const publishedProjects = content.projects.length;
  const phoneHref = `https://wa.me/${content.metadata.phone.replace(/\D/g, "")}`;

  const fullStackCases = ["ferrelonstock", "aktivar", "paytrack"]
    .map((slug) => projectBySlug.get(slug))
    .filter((project): project is NonNullable<typeof project> =>
      Boolean(project),
    );

  const serviceReferences = {
    "full-stack-builds": fullStackCases.map((project) => ({
      label: project.name,
      value: `${project.category} · ${project.status} · ${project.year}`,
      detail: project.summary,
    })),
    "automation-ai": ["facturia-2-0", "paytrack"]
      .map((slug) => projectBySlug.get(slug))
      .filter((project): project is NonNullable<typeof project> =>
        Boolean(project),
      )
      .map((project) => ({
        label: project.name,
        value: `${project.category} · ${project.status}`,
        detail: project.challenge,
      })),
    "product-ux-engineering": [
      {
        label:
          currentLocale === "es" ? "Experiencia previa" : "Previous background",
        value:
          currentLocale === "es"
            ? "Gestión comercial + coordinación"
            : "Commercial management + coordination",
        detail: content.about.summary[2],
      },
      {
        label: "Modern Art Gallery",
        value: projectBySlug.get("modern-art-gallery")?.headline ?? "—",
        detail: projectBySlug.get("modern-art-gallery")?.summary ?? "—",
      },
      {
        label: currentLocale === "es" ? "Fortaleza" : "Strength",
        value: content.about.strengths[0] ?? "—",
        detail: content.about.strengths[1] ?? "—",
      },
    ],
  } as const;

  const philosophyStats = [
    {
      label: labels.philosophy.statLabels.projects,
      value: String(publishedProjects),
      detail: "Proyectos publicados en el portfolio",
    },
    {
      label: labels.philosophy.statLabels.services,
      value: String(content.services.length),
      detail: "Líneas de servicio activas",
    },
    {
      label: labels.philosophy.statLabels.background,
      value: "10+",
      detail: "Años en gestión comercial y tech",
    },
    {
      label: "Enfoque",
      value: "Full stack",
      detail: "Del frontend al backend y datos",
    },
  ];

  return (
    <>
      <PageHero
        eyebrow={labels.hero.eyebrow}
        title={
          <>
            {labels.hero.titleStart} {labels.hero.titleAccent}
          </>
        }
        contentClassName="max-w-[72rem]"
        bodyClassName="space-y-7 sm:space-y-8"
        titleClassName="leading-[0.97]"
        subtitle={<p>{labels.hero.intro}</p>}
        subtitleClassName="max-w-[54rem] text-[2rem] leading-[1.08] sm:text-[2.5rem] lg:text-[3.05rem]"
        description={<p>{labels.hero.support}</p>}
        descriptionClassName="max-w-[50rem] text-[1.08rem] leading-8 text-text-secondary sm:text-[1.22rem] sm:leading-9 lg:text-[1.28rem]"
        actions={
          <>
            <a
              href={phoneHref}
              target="_blank"
              rel="noreferrer"
              className="button-primary w-full gap-2.5 sm:min-w-[13.5rem] sm:w-auto"
            >
              <WhatsAppIcon className="h-[1.1rem] w-[1.1rem] shrink-0" />
              <span>{labels.hero.primaryCta}</span>
              <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" />
            </a>

            <Link
              href={`/${currentLocale}/contact`}
              className="button-secondary w-full sm:min-w-[13.5rem] sm:w-auto"
            >
              {labels.hero.secondaryCta}
            </Link>
          </>
        }
        aside={
          englishHero ? (
            <div className="surface-panel no-line-stack border border-outline-ghost/10 bg-[linear-gradient(180deg,rgb(var(--surface-elevated)/0.9),rgb(var(--surface)/0.78))] px-5 py-6 sm:px-7 sm:py-8 lg:px-8">
              <div>
                <p className="technical-label">{englishHero.profileLabel}</p>
                <h2 className="mt-3 text-[1.4rem] font-semibold leading-tight text-text-primary sm:text-[1.55rem]">
                  {englishHero.profileTitle}
                </h2>
                <p className="mt-3 text-sm leading-6 text-text-secondary sm:text-base sm:leading-7">
                  {englishHero.profileBody}
                </p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {englishHero.metrics.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[var(--radius-soft)] bg-[rgb(var(--background)/0.14)] px-4 py-4"
                  >
                    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">
                      {item.label}
                    </p>
                    <p className="mt-2 text-base font-semibold leading-6 text-text-primary">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null
        }
      />

      {currentLocale === "es" ? (
        <SectionShell
          eyebrow="Capacidades digitales"
          title="Desarrollo, automatización e ingeniería para productos reales."
          description={
            <p>
              Cada servicio tiene casos concretos, stack real y proyectos que lo respaldan.
            </p>
          }
          sectionClassName={sectionBackgrounds.services}
          containerClassName="py-10 sm:py-12 lg:py-14"
          surface="plain"
        >
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {spanishDigitalCapabilities.map((service, index) => (
              <article
                key={service.number}
                className={`surface-panel no-line-stack flex h-full flex-col overflow-hidden border border-outline-ghost/10 px-5 py-6 sm:px-6 sm:py-7 ${
                  index === 1
                    ? "bg-[linear-gradient(180deg,rgb(var(--surface-elevated)/0.9),rgb(var(--surface)/0.78))]"
                    : "bg-[linear-gradient(180deg,rgb(var(--surface)/0.72),rgb(var(--surface-dim)/0.88))]"
                }`}
              >
                <div className="border-b border-outline-ghost/10 pb-4">
                  <p className="technical-label">
                    {service.number}
                  </p>
                </div>

                <div className="mt-8 flex flex-1 flex-col">
                  <div>
                    <h3 className="text-2xl font-semibold text-text-primary">
                      {service.title}
                    </h3>
                    <p className="mt-4 text-sm leading-6 text-text-secondary sm:text-base sm:leading-7">
                      {service.description}
                    </p>
                  </div>

                  <div className="mt-8 grid gap-3">
                    {service.details.map((detail) => (
                      <div
                        key={`${service.number}-${detail.label}`}
                        className="rounded-[var(--radius-soft)] border border-outline-ghost/10 bg-[rgb(var(--background)/0.1)] px-4 py-4"
                      >
                        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">
                          {detail.label}
                        </p>
                        <p
                          className="mt-3 text-base font-medium leading-7 whitespace-nowrap"
                          style={{
                            fontFamily: "var(--font-jetbrains-mono), monospace",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            color: "rgb(var(--brand-primary))",
                            fontSize: "0.75rem",
                          }}
                        >
                          {detail.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto border-t border-outline-ghost/10 pt-6">
                    <div className="flex flex-wrap gap-2">
                      {service.references.map((reference) => (
                        <span
                          key={`${service.number}-${reference}`}
                          className="rounded-pill border border-outline-ghost/12 bg-surface-dim/75 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-text-secondary"
                        >
                          {reference}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </SectionShell>
      ) : (
        <SectionShell
          eyebrow={labels.services.eyebrow}
          title={labels.services.title}
          description={<p>{labels.services.description}</p>}
        >
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {content.services.map((service) => (
              <ServiceCard
                key={service.slug}
                eyebrow={service.slug}
                title={service.title}
                description={service.description}
                proofLabel={labels.services.proofLabel}
                proofPoints={service.proofPoints}
                referencesLabel={labels.services.referencesLabel}
                references={
                  serviceReferences[
                    service.slug as keyof typeof serviceReferences
                  ]
                }
              />
            ))}
          </div>
        </SectionShell>
      )}

      <SectionShell
        sectionClassName={sectionBackgrounds.approach}
        containerClassName="py-10 sm:py-12 lg:py-14"
        surface="plain"
      >
        <div className="space-y-8 sm:space-y-10">
          <article className="surface-panel no-line-stack max-w-[48rem] border border-outline-ghost/10 bg-[linear-gradient(180deg,rgb(var(--surface-elevated)/0.9),rgb(var(--surface)/0.76))] px-5 py-6 sm:px-6 sm:py-6 lg:px-7 lg:py-7">
            <div className="space-y-3 sm:space-y-4">
              <p className="text-lg font-semibold tracking-tight text-text-primary sm:text-[1.45rem]">
                {labels.approach.ctaQuestion}
              </p>
              <p className="text-sm leading-6 text-text-secondary sm:text-base sm:leading-7">
                {labels.approach.ctaTitle}
              </p>
            </div>

            <div className="mt-6">
              <CTACluster
                items={[
                  {
                    label: labels.approach.ctaLabel,
                    href: `/${currentLocale}/contact`,
                  },
                ]}
              />
            </div>
          </article>

          <div className="max-w-3xl no-line-stack">
            <p className="technical-label">{labels.approach.eyebrow}</p>
            <h2 className="text-3xl font-semibold text-text-primary sm:text-4xl">
              {labels.approach.titleLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h2>
            <div className="text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">
              <p>{labels.approach.description}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {labels.approach.steps.map((step) => (
              <article
                key={`${step.label}-${step.titleLines.join("-")}`}
                className="surface-panel no-line-stack h-full border border-outline-ghost/10 bg-[rgb(var(--background)/0.1)] px-5 py-6 sm:px-6"
              >
                <div className="border-b border-outline-ghost/10 pb-4">
                  <span className="font-display text-[2.4rem] leading-none tracking-[-0.04em] text-brand-primary">
                    {step.label}
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  <h3 className="text-xl font-semibold tracking-tight text-text-primary sm:text-[1.35rem]">
                    {step.titleLines.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
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

      <SectionShell
        eyebrow={labels.philosophy.eyebrow}
        title={<span className="whitespace-nowrap">{labels.philosophy.title}</span>}
        description={
          <p>
            Cada línea de código es escrita con mantenibilidad y escalabilidad en mente. No solo resuelvo problemas, creo activos digitales que generan valor a largo plazo.
          </p>
        }
        sectionClassName={sectionBackgrounds.philosophy}
        containerClassName="py-10 sm:py-12 lg:py-14"
        surface="plain"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {philosophyStats.map((item, index) => (
            <article
              key={item.label}
              className={`surface-panel no-line-stack flex h-full flex-col overflow-hidden border border-outline-ghost/10 px-5 py-5 sm:px-5 ${
                index === 1
                  ? "bg-[linear-gradient(180deg,rgb(var(--surface-elevated)/0.9),rgb(var(--surface)/0.78))]"
                  : "bg-[linear-gradient(180deg,rgb(var(--surface)/0.72),rgb(var(--surface-dim)/0.88))]"
              }`}
            >
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">
                {item.label}
              </p>
              <p
                className="mt-3 text-2xl font-semibold leading-none"
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: "rgb(var(--brand-primary))",
                }}
              >
                {item.value}
              </p>
              <p className="mt-3 text-sm leading-5 text-text-secondary">
                {item.detail}
              </p>
            </article>
          ))}
        </div>
      </SectionShell>
    </>
  );
}
