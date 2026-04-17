import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Github, Globe } from "lucide-react";
import ProjectCard from "@/components/blocks/ProjectCard";
import ProjectGrid from "@/components/blocks/ProjectGrid";
import CTACluster from "@/components/site/CTACluster";
import { ProjectsPaginatedGrid } from "@/components/projects/ProjectsPaginatedGrid";
import PageHero from "@/components/site/PageHero";
import SectionShell from "@/components/site/SectionShell";
import { getSiteContent } from "@/content/site";
import { resolveLocale, type Locale } from "@/lib/i18n";

type LocaleParams = Promise<{ locale: string }>;

const primarySlugs = ["ferrelonstock", "aktivar", "modern-art-gallery", "paytrack"] as const;

const copy = {
  es: {
    hero: {
      eyebrow: "PROYECTOS",
      title: "Casos reales con foco en producto, ejecución y sistemas en producción",
      intro: "Desarrollo soluciones donde la arquitectura, la experiencia y el negocio funcionan como un sistema.",
      support: "Cada proyecto refleja decisiones técnicas reales — del diseño a la puesta en producción.",
      primaryCta: "Ver proyectos",
      secondaryCta: "Hablemos",
      visualEyebrow: "Sistema en producción",
      visualSourcesSuffix: "fuentes",
    },
    lead: {
      eyebrow: "PROYECTO PRINCIPAL",
      description: [
        "E-commerce para ferretería y corralón construido con Django 5, catálogo filtrable, carrito sin recarga y checkout en producción.",
        "Integra Stripe, Mercado Pago, tracking de envíos y una arquitectura MVT modular respaldada por tests automatizados.",
      ],
      challengeTitle: "DESAFÍO",
      challenge: "Convertir una entrega del módulo de Django en un e-commerce funcional con catálogo, carrito, pagos, envíos y administración listos para demo pública.",
      solutionTitle: "SOLUCIÓN",
      solution: "Implementación 100% Django con templates, HTMX y Alpine.js; 7 apps modulares, PostgreSQL y servicios como Cloudinary, Stripe y Mercado Pago.",
      impactTitle: "IMPACTO",
      impact: [
        "Carrito y filtros dinámicos sin recargar la página",
        "Pagos reales con Stripe y Mercado Pago, más seguimiento de envíos",
        "65 tests automatizados y deploy público en Render",
      ],
      primaryCta: "Ver demo",
      secondaryCta: "Código",
    },
    grid: {
      eyebrow: "PROYECTOS SELECCIONADOS",
      title: "Cuatro proyectos donde cada uno representa un enfoque distinto: performance, experiencia, producto y ejecución técnica.",
      ctaDemo: "Ver demo",
      ctaCode: "Código",
      cards: {
        aktivar: {
          description:
            "Plataforma orientada a performance y claridad de producto, con foco en interacción y comunicación visual.",
          bullets: [
            "Sistema frontend optimizado",
            "Arquitectura modular",
            "Experiencia centrada en usuario",
          ],
        },
        "modern-art-gallery": {
          description:
            "Experiencia visual basada en narrativa y jerarquía de contenido, con implementación cuidada de layout y accesibilidad.",
          bullets: [
            "Diseño orientado a storytelling",
            "UI limpia y estructurada",
            "Navegación optimizada",
          ],
        },
        paytrack: {
          description:
            "Aplicación de gestión financiera con integración de APIs y estructura preparada para evolución futura.",
          bullets: [
            "Integración con servicios externos",
            "Arquitectura escalable",
            "Base para automatización",
          ],
        },
      },
    },
    automation: {
      eyebrow: "PROYECTOS ADICIONALES",
    },
    editorial: {
      title: "ENFOQUE",
      intro: [
        "Un portfolio no es solo una colección de proyectos.",
        "Es una forma de entender cómo se construyen soluciones reales.",
      ],
      listTitle: "Trabajo con una lógica simple y repetible:",
      itemTitles: ["Arquitectura primero", "Experiencia con intención", "Negocio como criterio"],
      bullets: [
        "Defino una base técnica clara para que el producto pueda crecer sin fricción, con estructura modular y decisiones sostenibles.",
        "Ordeno la interfaz para que cada pantalla tenga jerarquía, ritmo y una interacción fácil de entender desde el primer recorrido.",
        "Bajo cada decisión al contexto real del proyecto: objetivos, tiempos, mantenimiento y valor para quien lo usa o lo opera.",
      ],
    },
    cta: {
      title: "¿Tenés un producto o idea en desarrollo?",
      description: "Puedo ayudarte a construir una solución clara, escalable y orientada a resultados.",
      primaryCta: "CONTACTAR",
      secondaryCta: "Ver más proyectos",
    },
    labels: {
      challenge: "Desafío",
      impact: "Impacto",
      liveDemo: "Ver demo",
      repository: "Código",
      sourceBacked: "Fuentes reales",
    },
  },
  en: {
    hero: {
      eyebrow: "PROJECTS",
      title: "Real case studies focused on product, execution, and systems running in production.",
      intro: "I build solutions where architecture, experience, and business work as one system.",
      support: "Every project reflects real technical decisions — from design to production.",
      primaryCta: "View projects",
      secondaryCta: "Let’s talk",
      visualEyebrow: "Production system",
      visualSourcesSuffix: "sources",
    },
    lead: {
      eyebrow: "FEATURED PROJECT",
      description: [
        "Hardware and building-supplies e-commerce built with Django 5, featuring a filterable catalog, no-refresh cart, and production checkout.",
        "It integrates Stripe, Mercado Pago, shipping tracking, and a modular MVT architecture backed by automated tests.",
      ],
      challengeTitle: "CHALLENGE",
      challenge: "Turn a Django course delivery into a functional e-commerce product with catalog, cart, payments, shipping, and admin flows ready for a public demo.",
      solutionTitle: "SOLUTION",
      solution: "A 100% Django implementation using templates, HTMX, and Alpine.js; 7 modular apps, PostgreSQL, and services such as Cloudinary, Stripe, and Mercado Pago.",
      impactTitle: "IMPACT",
      impact: [
        "Dynamic cart and filters without full page reloads",
        "Real payments with Stripe and Mercado Pago plus shipping tracking",
        "65 automated tests and a public Render deployment",
      ],
      primaryCta: "View demo",
      secondaryCta: "Code",
    },
    grid: {
      eyebrow: "SELECTED PROJECTS",
      title: "Four projects where each one represents a different focus: performance, experience, product, and technical execution.",
      ctaDemo: "View demo",
      ctaCode: "Code",
      cards: {
        aktivar: {
          description:
            "Platform centered on performance and product clarity, with a strong focus on interaction and visual communication.",
          bullets: [
            "Optimized frontend system",
            "Modular architecture",
            "User-centered experience",
          ],
        },
        "modern-art-gallery": {
          description:
            "Visual experience built around storytelling and content hierarchy, with careful layout and accessibility work.",
          bullets: [
            "Storytelling-driven design",
            "Clean, structured UI",
            "Optimized navigation",
          ],
        },
        paytrack: {
          description:
            "Financial management app with API integrations and a structure ready to evolve over time.",
          bullets: [
            "External service integrations",
            "Scalable architecture",
            "Foundation for automation",
          ],
        },
      },
    },
    automation: {
      eyebrow: "ADDITIONAL PROJECTS",
    },
    editorial: {
      title: "APPROACH",
      intro: [
        "A portfolio is not just a collection of projects.",
        "It is a way to understand how real solutions are built.",
      ],
      listTitle: "I work on systems where:",
      itemTitles: ["Architecture", "Experience", "Business"],
      bullets: [
        "architecture supports growth",
        "experience guides interaction",
        "business shapes decisions",
      ],
    },
    cta: {
      title: "Do you have a product or idea in progress?",
      description: "I can help you build a clear, scalable solution focused on results.",
      primaryCta: "CONTACT",
      secondaryCta: "View more projects",
    },
    labels: {
      challenge: "Challenge",
      impact: "Impact",
      liveDemo: "View demo",
      repository: "Code",
      sourceBacked: "Real sources",
    },
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

  return {
    title: `${content.metadata.siteName} | ${content.navigation.find((item) => item.key === "projects")?.label ?? "Projects"}`,
    description: content.projects.find((project) => project.slug === "ferrelonstock")?.summary ?? content.metadata.description,
  };
}

export default async function ProjectsPage({
  params,
}: {
  params: LocaleParams;
}) {
  const { locale } = await params;
  const currentLocale: Locale = resolveLocale(locale);
  const content = getSiteContent(currentLocale);
  const labels = copy[currentLocale];
  const primaryProjects = primarySlugs
    .map((slug) => content.projects.find((project) => project.slug === slug))
    .filter((project): project is NonNullable<typeof project> => Boolean(project));
  const leadProject = primaryProjects[0];
  const gridProjects = primaryProjects.slice(1).concat(
    content.projects.filter((p) => !primarySlugs.includes(p.slug as typeof primarySlugs[number]) && p.slug !== leadProject?.slug)
  );
  const githubProfile = content.metadata.socialLinks.find((link) => link.platform === "github")?.href;
  if (!leadProject) {
    return null;
  }

  const sectionBackgrounds = {
    lead: "bg-[linear-gradient(180deg,rgb(var(--surface)/0.16),rgb(var(--surface-dim)/0.26))]",
    grid: "bg-[linear-gradient(180deg,rgb(var(--surface-elevated)/0.12),rgb(var(--surface)/0.08))]",
    automation: "bg-[linear-gradient(180deg,rgb(var(--surface)/0.1),rgb(var(--surface-dim)/0.24))]",
    editorial: "bg-[linear-gradient(180deg,rgb(var(--surface-elevated)/0.3),rgb(var(--surface)/0.18))]",
    cta: "bg-[linear-gradient(180deg,rgb(var(--surface-elevated)/0.26),rgb(var(--surface)/0.14))]",
  } as const;

  return (
    <>
      <PageHero
        eyebrow={labels.hero.eyebrow}
        title={labels.hero.title}
        bodyClassName="space-y-7 sm:space-y-8"
        subtitle={<p>{labels.hero.intro}</p>}
        description={<p>{labels.hero.support}</p>}
        actions={
          <>
            <Link href="#projects-list" className="button-primary w-full sm:min-w-[13.5rem] sm:w-auto">
              {labels.hero.primaryCta}
            </Link>
            <Link href={`/${currentLocale}/contact`} className="button-secondary w-full sm:min-w-[13.5rem] sm:w-auto">
              {labels.hero.secondaryCta}
            </Link>
          </>
        }
      />

      <div id="projects-list" className="scroll-mt-28">
        <SectionShell
          eyebrow={labels.lead.eyebrow}
          sectionClassName={sectionBackgrounds.lead}
          containerClassName="py-10 sm:py-12 lg:py-14"
          surface="plain"
        >
          <article className="surface-panel overflow-hidden">
            <div className="relative overflow-hidden bg-[linear-gradient(180deg,rgb(var(--surface-dim)/0.92),rgb(var(--surface)/0.88))]">
              <div className="project-media-hover project-media-hover-contained relative aspect-[16/10] w-full overflow-hidden sm:aspect-[16/9] lg:aspect-[16/8.4]">
                <div className="project-media-asset absolute inset-1 sm:inset-2 lg:inset-3">
                  <Image
                    src={leadProject.media.cover}
                    alt={leadProject.media.alt}
                    fill
                    sizes="(min-width: 1280px) 88vw, (min-width: 1024px) 92vw, 100vw"
                    className="object-contain object-center"
                  />
                </div>
                <div className="project-media-overlay pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(7,10,18,0.02),rgba(7,10,18,0.08))]" />
              </div>
            </div>

            <div className="no-line-stack px-5 py-5 sm:px-6 sm:py-6 lg:px-7 lg:py-7">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">
                  {leadProject.year} · {leadProject.category} · {leadProject.status}
                </p>
                <p className="technical-label mt-4">{labels.lead.eyebrow}</p>
                <h2 className="mt-3 text-[2rem] font-semibold leading-[1.05] tracking-[-0.03em] text-text-primary sm:text-[2.3rem] lg:text-[2.45rem]">
                  {leadProject.name}
                </h2>
                <div className="mt-4 space-y-3 text-sm leading-6 text-text-secondary sm:text-base sm:leading-7">
                  {labels.lead.description.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {leadProject.stack.slice(0, 6).map((item) => (
                  <span
                    key={`${leadProject.slug}-${item}`}
                    className="project-stack-chip rounded-pill border border-transparent bg-surface-dim/80 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-text-secondary"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="grid gap-3.5 lg:grid-cols-3">
                <div className="surface-subpanel px-4 py-4 sm:px-5 sm:py-5">
                  <p className="technical-label">{labels.lead.challengeTitle}</p>
                  <p className="mt-3 text-sm leading-6 text-text-secondary sm:text-base sm:leading-7">{labels.lead.challenge}</p>
                </div>

                <div className="surface-subpanel px-4 py-4 sm:px-5 sm:py-5">
                  <p className="technical-label">{labels.lead.solutionTitle}</p>
                  <p className="mt-3 text-sm leading-6 text-text-secondary sm:text-base sm:leading-7">{labels.lead.solution}</p>
                </div>

                <div className="surface-subpanel px-4 py-4 sm:px-5 sm:py-5">
                  <p className="technical-label">{labels.lead.impactTitle}</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-text-secondary sm:text-base sm:leading-7">
                    {labels.lead.impact.map((item) => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">
                  {labels.labels.sourceBacked} · {leadProject.sourceUrls.length}
                </p>

                <CTACluster
                  items={[
                    ...(leadProject.links.demo
                      ? [{ label: labels.lead.primaryCta, href: leadProject.links.demo, external: true, icon: Globe }]
                      : []),
                    ...(leadProject.links.repo
                      ? [{ label: labels.lead.secondaryCta, href: leadProject.links.repo, external: true, icon: Github, variant: "secondary" as const }]
                      : []),
                  ]}
                />
              </div>
            </div>
          </article>
        </SectionShell>
      </div>

      <SectionShell
        sectionClassName={sectionBackgrounds.grid}
        containerClassName="py-10 sm:py-12 lg:py-14"
        surface="plain"
      >
        <ProjectsPaginatedGrid
          projects={gridProjects}
          labels={labels.labels}
          eyebrow={labels.grid.eyebrow}
          description={labels.grid.title}
        />
      </SectionShell>

      <SectionShell
        sectionClassName={sectionBackgrounds.editorial}
        containerClassName="py-10 sm:py-12 lg:py-14"
        surface="plain"
      >
        <article className="no-line-stack space-y-8">
          <div className="max-w-3xl space-y-4">
            <h2 className="text-[2rem] leading-[1.02] font-semibold tracking-editorial text-text-primary sm:text-[2.35rem] lg:text-[2.7rem]">
              {labels.editorial.title}
            </h2>

            <div className="space-y-3 text-sm leading-6 text-text-secondary sm:text-base sm:leading-7">
              {labels.editorial.intro.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <p className="technical-label pt-1">{labels.editorial.listTitle}</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
            {labels.editorial.bullets.map((item, index) => (
              <article
                key={item}
                className="surface-panel no-line-stack border border-outline-ghost/10 bg-[linear-gradient(180deg,rgb(var(--surface-elevated)/0.84),rgb(var(--surface)/0.72))] px-5 py-5 sm:px-6 sm:py-6"
              >
                <div className="border-b border-outline-ghost/10 pb-4">
                  <span className="font-display text-[2.5rem] leading-none tracking-[-0.04em] text-brand-primary sm:text-[2.8rem]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-semibold tracking-tight text-text-primary sm:text-[1.35rem]">
                    {labels.editorial.itemTitles[index]}
                  </h3>
                  <p className="text-sm leading-6 text-text-secondary sm:text-base sm:leading-7">{item}</p>
                </div>
              </article>
            ))}
          </div>
        </article>
      </SectionShell>

      <SectionShell
        title={<span className="text-[2rem] leading-[1.06] sm:text-[2.3rem]">{labels.cta.title}</span>}
        description={<p className="text-[0.95rem] leading-7 sm:text-base sm:leading-7">{labels.cta.description}</p>}
        sectionClassName={sectionBackgrounds.cta}
        containerClassName="py-10 sm:py-12 lg:py-14"
        surface="plain"
      >
        <article className="surface-panel no-line-stack max-w-[46rem] border border-outline-ghost/10 bg-[linear-gradient(180deg,rgb(var(--surface-elevated)/0.88),rgb(var(--surface)/0.74))] px-5 py-5 sm:px-6 sm:py-6 lg:px-7 lg:py-7">
          <CTACluster
            items={[
              { label: labels.cta.primaryCta, href: `/${currentLocale}/contact` },
              {
                label: labels.cta.secondaryCta,
                href: githubProfile ?? `/${currentLocale}/projects#projects-list`,
                external: Boolean(githubProfile),
                variant: "secondary",
              },
            ]}
            size="default"
          />
        </article>
      </SectionShell>
    </>
  );
}
