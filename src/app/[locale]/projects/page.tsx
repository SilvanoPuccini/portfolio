import type { Metadata } from "next";
import ProjectCard from "@/components/blocks/ProjectCard";
import ProjectGrid from "@/components/blocks/ProjectGrid";
import SpecSheet from "@/components/blocks/SpecSheet";
import CTACluster from "@/components/site/CTACluster";
import PageHero from "@/components/site/PageHero";
import SectionShell from "@/components/site/SectionShell";
import { getSiteContent } from "@/content/site";
import { resolveLocale, type Locale } from "@/lib/i18n";

type LocaleParams = Promise<{ locale: string }>;

const primarySlugs = ["ferrelonstock", "aktivar", "modern-art-gallery", "paytrack"] as const;

const copy = {
  es: {
    hero: {
      eyebrow: "Proyectos",
      title: "Casos reales curados con jerarquía editorial, criterio técnico y foco en producto.",
      intro:
        "La página prioriza los proyectos que mejor explican cómo trabajo: sistemas full stack, producto digital, automatización aplicada y ejecución con material verificable.",
      support:
        "Los cuatro casos principales concentran la lectura del portfolio y FacturIA 2.0 entra como proyecto real adicional para mostrar la capa de automatización e IA sin diluir la selección principal.",
      deck: "Selección principal",
      sources: "Material verificable",
      output: "Cobertura",
      outputValue: "5 proyectos reales",
    },
    lead: {
      eyebrow: "Caso principal",
      title: "Proyecto ancla para abrir la lectura del portfolio.",
      description:
        "FerrelonStock funciona como dossier de apertura: combina producto, backend, checkout, operación real y una narrativa visual suficientemente sólida para sostener la página completa.",
      sheetEyebrow: "Spec sheet",
      sheetTitle: "Por qué esta selección se siente terminada y no placeholder.",
      items: {
        selection: "Selección",
        editorial: "Lectura",
        proof: "Prueba",
        scope: "Cobertura",
      },
      selectionValue: "4 proyectos principales + 1 caso adicional",
      demoValue: "Demo",
      repoValue: "Repositorio",
      sourcesValue: "fuentes",
    },
    grid: {
      eyebrow: "Catálogo principal",
      title: "Cuatro proyectos foco, cada uno con una señal distinta de valor.",
      description:
        "Aktivar, Modern Art Gallery y PayTrack completan la lectura principal desde plataforma, branding frontend y producto SaaS. Cada ficha conserva lenguaje editorial, datos reales y accesos concretos.",
      accent: "Proyecto principal",
    },
    automation: {
      eyebrow: "Capa adicional",
      title: "FacturIA 2.0 suma profundidad real en automatización e IA aplicada.",
      description:
        "No compite con los cuatro proyectos foco, pero sí refuerza una parte importante del perfil: pipelines auditables, procesamiento documental y producto orientado a eficiencia operativa.",
      accent: "Proyecto real adicional",
    },
    closing: {
      eyebrow: "Criterio editorial",
      title: "Un portfolio de proyectos tiene que ayudar a elegir, no sólo a mostrar.",
      description:
        "La página cierra explicando el patrón de selección: prioridad a casos navegables, stack visible, desafíos concretos y acceso directo a demo o repositorio siempre que exista.",
      stats: {
        primary: "Proyectos principales",
        additional: "Proyecto adicional",
        sources: "Fuentes reunidas",
      },
      noteTitle: "Qué comunica esta página",
      notes: [
        "Trabajo full stack con base real en despliegue, pagos, dashboards y operación.",
        "Sensibilidad editorial para presentar producto y frontend premium sin perder claridad técnica.",
        "Automatización e IA como capacidad respaldada por proyectos concretos, no como claim vacío.",
      ],
      primaryCta: "Hablemos de un producto real",
      secondaryCta: "Ver Sobre mí",
    },
    labels: {
      challenge: "Desafío",
      impact: "Impacto",
      liveDemo: "Ver demo",
      repository: "GitHub",
      sourceBacked: "Fuentes reales",
    },
  },
  en: {
    hero: {
      eyebrow: "Projects",
      title: "Real case studies curated with editorial hierarchy, technical judgment, and product focus.",
      intro:
        "This page prioritizes the projects that best explain how I work: full stack systems, digital product thinking, applied automation, and execution backed by verifiable material.",
      support:
        "The four lead cases drive the portfolio narrative, while FacturIA 2.0 appears as an additional real project to reinforce the automation and AI layer without diluting the primary selection.",
      deck: "Lead selection",
      sources: "Verified material",
      output: "Coverage",
      outputValue: "5 real projects",
    },
    lead: {
      eyebrow: "Lead case",
      title: "Anchor project that opens the portfolio narrative.",
      description:
        "FerrelonStock works as the opening dossier: product thinking, backend depth, checkout flows, real operations, and enough visual strength to carry the full page.",
      sheetEyebrow: "Spec sheet",
      sheetTitle: "Why this selection feels finished instead of placeholder.",
      items: {
        selection: "Selection",
        editorial: "Reading",
        proof: "Proof",
        scope: "Coverage",
      },
      selectionValue: "4 lead projects + 1 additional case",
      demoValue: "Demo",
      repoValue: "Repository",
      sourcesValue: "sources",
    },
    grid: {
      eyebrow: "Core catalog",
      title: "Four focus projects, each showing a different value signal.",
      description:
        "Aktivar, Modern Art Gallery, and PayTrack complete the main read through platform work, premium frontend branding, and SaaS/product execution. Each card keeps the editorial language, real data, and concrete links.",
      accent: "Lead project",
    },
    automation: {
      eyebrow: "Additional layer",
      title: "FacturIA 2.0 adds real depth in automation and applied AI.",
      description:
        "It does not compete with the four lead projects, but it strengthens an important part of the profile: auditable pipelines, document processing, and efficiency-oriented product thinking.",
      accent: "Additional real project",
    },
    closing: {
      eyebrow: "Editorial criteria",
      title: "A projects portfolio should help someone choose, not just browse.",
      description:
        "The page closes by making the selection logic explicit: priority goes to navigable cases, visible stacks, concrete challenges, and direct access to demos or repositories whenever they exist.",
      stats: {
        primary: "Lead projects",
        additional: "Additional project",
        sources: "Sources gathered",
      },
      noteTitle: "What this page communicates",
      notes: [
        "Real full stack work across deployments, payments, dashboards, and operations.",
        "Editorial sensitivity to present premium frontend and product work without losing technical clarity.",
        "Automation and AI as a source-backed capability, not an empty claim.",
      ],
      primaryCta: "Let’s talk about a real product",
      secondaryCta: "View About",
    },
    labels: {
      challenge: "Challenge",
      impact: "Impact",
      liveDemo: "View demo",
      repository: "GitHub",
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
  const supportingProjects = primaryProjects.slice(1);
  const automationProject = content.projects.find((project) => project.slug === "facturia-2-0");
  const totalSources = content.projects.reduce((total, project) => total + project.sourceUrls.length, 0);

  if (!leadProject) {
    return null;
  }

  return (
    <>
      <PageHero
        eyebrow={labels.hero.eyebrow}
        title={labels.hero.title}
        description={
          <div className="space-y-4">
            <p>{labels.hero.intro}</p>
            <p className="text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">{labels.hero.support}</p>
          </div>
        }
        aside={
          <div className="no-line-stack">
            <div>
              <p className="technical-label">{labels.hero.deck}</p>
              <div className="mt-4 space-y-4">
                {primaryProjects.map((project) => (
                  <div key={project.slug}>
                    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-secondary">
                      {project.year} · {project.category}
                    </p>
                    <p className="mt-2 text-base font-semibold text-text-primary">{project.name}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">{labels.hero.sources}</p>
                <p className="mt-2 text-sm font-medium leading-6 text-text-primary">{totalSources}+</p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">{labels.hero.output}</p>
                <p className="mt-2 text-sm font-medium leading-6 text-text-primary">{labels.hero.outputValue}</p>
              </div>
            </div>

            <CTACluster
              items={[
                { label: labels.closing.primaryCta, href: `/${currentLocale}/contact` },
                { label: labels.closing.secondaryCta, href: `/${currentLocale}/about`, variant: "secondary" },
              ]}
            />
          </div>
        }
      />

      <SectionShell
        eyebrow={labels.lead.eyebrow}
        title={labels.lead.title}
        description={<p>{labels.lead.description}</p>}
      >
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.18fr)_22rem]">
          <ProjectCard project={leadProject} labels={labels.labels} variant="feature" accentLabel={labels.grid.accent} />

          <SpecSheet
            eyebrow={labels.lead.sheetEyebrow}
            title={labels.lead.sheetTitle}
            items={[
              { label: labels.lead.items.selection, value: labels.lead.selectionValue },
              { label: labels.lead.items.editorial, value: leadProject.headline },
              {
                label: labels.lead.items.proof,
                value: `${leadProject.links.demo ? labels.lead.demoValue : labels.lead.repoValue} + ${leadProject.sourceUrls.length} ${labels.lead.sourcesValue}`,
              },
              { label: labels.lead.items.scope, value: `${leadProject.category} · ${leadProject.status} · ${leadProject.year}` },
            ]}
            stack={leadProject.stack.slice(0, 8)}
          />
        </div>
      </SectionShell>

      <SectionShell
        eyebrow={labels.grid.eyebrow}
        title={labels.grid.title}
        description={<p>{labels.grid.description}</p>}
      >
        <ProjectGrid>
          {supportingProjects.map((project) => (
            <ProjectCard key={project.slug} project={project} labels={labels.labels} accentLabel={labels.grid.accent} />
          ))}
        </ProjectGrid>
      </SectionShell>

      {automationProject ? (
        <SectionShell
          eyebrow={labels.automation.eyebrow}
          title={labels.automation.title}
          description={<p>{labels.automation.description}</p>}
        >
          <ProjectCard
            project={automationProject}
            labels={labels.labels}
            variant="feature"
            accentLabel={labels.automation.accent}
          />
        </SectionShell>
      ) : null}

      <SectionShell
        eyebrow={labels.closing.eyebrow}
        title={labels.closing.title}
        description={<p>{labels.closing.description}</p>}
      >
        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
            {[
              { label: labels.closing.stats.primary, value: String(primaryProjects.length) },
              { label: labels.closing.stats.additional, value: automationProject ? "1" : "0" },
              { label: labels.closing.stats.sources, value: `${totalSources}+` },
            ].map((item) => (
              <article key={item.label} className="surface-panel px-6 py-6 sm:px-7">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">{item.label}</p>
                <p className="mt-4 text-3xl font-semibold text-text-primary">{item.value}</p>
              </article>
            ))}
          </div>

          <article className="surface-panel no-line-stack px-6 py-6 sm:px-7 sm:py-7">
            <div>
              <p className="technical-label">{labels.closing.noteTitle}</p>
              <h3 className="mt-4 text-2xl font-semibold text-text-primary sm:text-3xl">{labels.closing.title}</h3>
            </div>

            <div className="space-y-4 text-sm leading-6 text-text-secondary sm:text-base sm:leading-7">
              {labels.closing.notes.map((note) => (
                <p key={note}>{note}</p>
              ))}
            </div>

            <CTACluster
              items={[
                { label: labels.closing.primaryCta, href: `/${currentLocale}/contact` },
                { label: labels.closing.secondaryCta, href: `/${currentLocale}/about`, variant: "secondary" },
              ]}
            />
          </article>
        </div>
      </SectionShell>
    </>
  );
}
