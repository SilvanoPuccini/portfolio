import Reveal, { STAGGER } from "@/components/site/Reveal";
import Image from "next/image";
import Link from "next/link";
import { Github, Globe } from "lucide-react";
import CTACluster from "@/components/site/CTACluster";
import type { getFeaturedProjects } from "@/content/site";
import type { Locale } from "@/lib/i18n";

type FeaturedProjectView = ReturnType<typeof getFeaturedProjects>[number];

const copy = {
  es: {
    eyebrow: "Proyectos",
    title: "Trabajo seleccionado con foco en producto, decisiones técnicas y ejecución real.",
    description:
      "Proyectos con arquitectura visible, decisiones técnicas claras y resultados en producción.",
    allProjects: "Explorar proyectos",
    liveDemo: "Ver demo",
    repository: "Código",
    challenge: "Desafío",
    impact: "Impacto",
  },
  en: {
    eyebrow: "Projects",
    title: "Four projects that show how I work.",
    description:
      "Product thinking, execution, and technical decisions made visible. One main case and three supporting projects for a fast read.",
    allProjects: "Explore projects",
    liveDemo: "View demo",
    repository: "Code",
    challenge: "Challenge",
    impact: "Impact",
  },
} as const;

export default function FeaturedProjects({
  locale,
  projects,
  showAllProjectsLink = true,
  condensedMain = false,
}: {
  locale: Locale;
  projects: FeaturedProjectView[];
  showAllProjectsLink?: boolean;
  condensedMain?: boolean;
}) {
  const labels = copy[locale];
  const priorityProjects = projects.filter((project) => project.priority).slice(0, 4);
  const [mainProject, ...secondaryProjects] = priorityProjects;
  const isFerrerlonMainProject = mainProject?.slug === "ferrelonstock";

  if (!mainProject) {
    return null;
  }

  return (
    <section
      id="proyectos"
      className="scroll-mt-24 bg-[linear-gradient(180deg,rgb(var(--surface-elevated)/0.18),rgb(var(--surface)/0.1))] py-10 sm:py-12 lg:py-14"
    >
      <div className="site-container">
        <div className="mb-10 max-w-3xl space-y-5">
          <Reveal as="p" className="technical-label">
            {labels.eyebrow}
          </Reveal>
          <div className="space-y-4">
            <Reveal>
              <h2 className="section-title">{labels.title}</h2>
            </Reveal>
            <Reveal>
              <p className="max-w-2xl text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">
                {labels.description}
              </p>
            </Reveal>
          </div>
          {showAllProjectsLink && (
            <Link
              href={`/${locale}/projects`}
              className="inline-flex items-center justify-start font-mono text-xs uppercase tracking-[0.22em] text-brand-primary transition-opacity hover:opacity-80"
            >
              {labels.allProjects}
            </Link>
          )}
        </div>

        <div className="grid gap-5">
          <article id={mainProject.slug} className="surface-panel scroll-mt-28 overflow-hidden">
            {isFerrerlonMainProject ? (
              <>
                <div className="project-media-hover project-media-hover-contained relative aspect-[16/10] overflow-hidden bg-surface-dim sm:aspect-[16/9] lg:aspect-[16/8.4]">
                  <div className="project-media-asset absolute inset-3 sm:inset-4 lg:inset-6">
                    <Image
                      src={mainProject.media.cover}
                      alt={mainProject.media.alt}
                      fill
                      sizes="(min-width: 1024px) 72vw, 100vw"
                      className="object-contain object-center"
                    />
                  </div>
                  <div className="project-media-overlay absolute inset-0 bg-[linear-gradient(180deg,rgba(10,14,24,0.02),rgba(10,14,24,0.34))]" />
                </div>

                <div className="space-y-6 px-6 py-6 sm:px-7 sm:py-7 lg:px-8 lg:py-8">
                  {condensedMain ? (
                    <>
                      <div>
                        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">
                          {mainProject.year} · {mainProject.category} · {mainProject.status}
                        </p>
                        <h3 className="mt-3 card-title">
                          {mainProject.name}
                        </h3>
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-text-secondary sm:text-base sm:leading-7">
                          {mainProject.summary}
                        </p>
                      </div>
                      <CTACluster
                        items={[
                          ...(mainProject.links.demo
                            ? [{ label: labels.liveDemo, href: mainProject.links.demo, external: true, icon: Globe }]
                            : []),
                          ...(mainProject.links.repo
                            ? [{ label: labels.repository, href: mainProject.links.repo, external: true, icon: Github, variant: "secondary" as const }]
                            : []),
                        ]}
                      />
                    </>
                  ) : (
                    <>
                      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:items-start">
                        <div>
                          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">
                            {mainProject.year} · {mainProject.category} · {mainProject.status}
                          </p>
                          <h3 className="mt-3 card-title">
                            {mainProject.name}
                          </h3>
                          <p className="mt-3 max-w-3xl text-base leading-7 text-text-primary sm:text-[1.05rem] sm:leading-8">
                            {mainProject.headline}
                          </p>
                          <p className="mt-4 max-w-3xl text-sm leading-6 text-text-secondary sm:text-base sm:leading-7">
                            {mainProject.summary}
                          </p>
                        </div>

                        {mainProject.demoAccess ? (
                          <div className="surface-subpanel bg-[rgb(var(--background)/0.16)] px-4 py-4 sm:px-5">
                            <p className="technical-label">{mainProject.demoAccess.label}</p>
                            <p className="mt-3 break-words font-mono text-xs leading-6 text-text-primary sm:text-[0.82rem]">
                              {mainProject.demoAccess.credentials}
                            </p>
                          </div>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-2.5">
                        {mainProject.stack.slice(0, 6).map((item) => (
                          <span
                            key={item}
                            className="project-stack-chip rounded-pill bg-[rgb(var(--background)/0.34)] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-text-secondary"
                          >
                            {item}
                          </span>
                        ))}
                      </div>

                      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
                        <div className="surface-subpanel bg-[rgb(var(--background)/0.14)] px-4 py-4 sm:px-5 sm:py-5">
                          <p className="technical-label">{labels.challenge}</p>
                          <p className="mt-3 text-sm leading-6 text-text-primary sm:text-[0.95rem] sm:leading-7">
                            {mainProject.challenge}
                          </p>
                        </div>

                        <div className="surface-subpanel bg-[rgb(var(--background)/0.1)] px-4 py-4 sm:px-5 sm:py-5">
                          <p className="technical-label">{labels.impact}</p>
                          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-6 text-text-primary sm:text-[0.95rem] sm:leading-7">
                            {mainProject.impact.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <CTACluster
                        items={[
                          ...(mainProject.links.demo
                            ? [{ label: labels.liveDemo, href: mainProject.links.demo, external: true, icon: Globe }]
                            : []),
                          ...(mainProject.links.repo
                            ? [{ label: labels.repository, href: mainProject.links.repo, external: true, icon: Github, variant: "secondary" as const }]
                            : []),
                        ]}
                      />
                    </>
                  )}
                </div>
              </>
            ) : (
                <div className="grid gap-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                  <div className="project-media-hover project-media-hover-contained relative aspect-[16/10] overflow-hidden bg-surface-dim lg:min-h-[24rem] lg:aspect-auto">
                  <div className="project-media-asset absolute inset-2 sm:inset-3 lg:inset-4">
                    <Image
                      src={mainProject.media.cover}
                      alt={mainProject.media.alt}
                      fill
                      sizes="(min-width: 1024px) 42vw, 100vw"
                      className="object-contain object-center"
                    />
                  </div>
                  <div className="project-media-overlay absolute inset-0 bg-[linear-gradient(180deg,rgba(10,14,24,0.02),rgba(10,14,24,0.38))]" />
                </div>

                <div className="space-y-6 px-6 py-6 sm:px-7 sm:py-7 lg:px-8 lg:py-8">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">
                      {mainProject.year} · {mainProject.category} · {mainProject.status}
                    </p>
                    <h3 className="mt-2.5 card-title sm:mt-3">{mainProject.name}</h3>
                    <p className="mt-3.5 text-sm leading-6 text-text-secondary sm:text-base sm:leading-7">
                      {mainProject.summary}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    {mainProject.stack.slice(0, 4).map((item) => (
                      <span
                        key={item}
                        className="project-stack-chip rounded-pill bg-[rgb(var(--background)/0.34)] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-text-secondary"
                      >
                        {item}
                      </span>
                    ))}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="surface-subpanel bg-[rgb(var(--background)/0.14)] px-4 py-4 sm:px-5">
                      <p className="technical-label">{labels.challenge}</p>
                      <p className="mt-3 text-sm leading-6 text-text-primary sm:text-[0.95rem] sm:leading-7">
                        {mainProject.challenge}
                      </p>
                    </div>

                    <div className="surface-subpanel bg-[rgb(var(--background)/0.1)] px-4 py-4 sm:px-5">
                      <p className="technical-label">{labels.impact}</p>
                      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-6 text-text-primary sm:text-[0.95rem] sm:leading-7">
                        {mainProject.impact.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <CTACluster
                    items={[
                      ...(mainProject.links.demo
                        ? [{ label: labels.liveDemo, href: mainProject.links.demo, external: true, icon: Globe }]
                        : []),
                      ...(mainProject.links.repo
                        ? [{ label: labels.repository, href: mainProject.links.repo, external: true, icon: Github, variant: "secondary" as const }]
                        : []),
                    ]}
                  />
                </div>
              </div>
            )}
          </article>

          {secondaryProjects.length ? (
            <div className="grid gap-5 md:grid-cols-3">
              {secondaryProjects.map((project) => (
                <article
                  key={project.slug}
                  id={project.slug}
                  className="surface-panel flex h-full flex-col overflow-hidden scroll-mt-28"
                >
                  <div
                    className={
                      project.slug === "aktivar" || project.slug === "my-marketing-agency"
                        ? "project-media-hover project-media-hover-contained relative aspect-[16/9] overflow-hidden bg-surface-dim"
                        : "project-media-hover relative aspect-[16/9] overflow-hidden bg-surface-dim"
                    }
                  >
                    <div
                      className={project.slug === "aktivar" || project.slug === "my-marketing-agency" ? "project-media-asset absolute inset-2 sm:inset-3" : "project-media-asset absolute inset-0"}
                    >
                      <Image
                        src={project.media.cover}
                        alt={project.media.alt}
                        fill
                        sizes="(min-width: 1024px) 28vw, 100vw"
                        className={project.slug === "aktivar" || project.slug === "my-marketing-agency" ? "object-contain object-center" : "object-cover"}
                      />
                    </div>
                    <div className="project-media-overlay absolute inset-0 bg-[linear-gradient(180deg,rgba(10,14,24,0.02),rgba(10,14,24,0.38))]" />
                  </div>

                  <div className="flex flex-1 flex-col px-6 py-4 sm:px-7 sm:py-4.5">
                    <div className="min-h-[9.5rem] space-y-2.5">
                      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">
                        {project.year} · {project.category} · {project.status}
                      </p>
                      <h3 className="card-title">{project.name}</h3>
                      <p className="text-sm leading-6 text-text-secondary sm:text-base">{project.summary}</p>
                    </div>

                    <div className="mt-auto flex flex-col gap-3 pt-4">
                      <div className="grid min-h-[4.5rem] grid-cols-2 content-start gap-2">
                        {project.stack.slice(0, 4).map((item) => (
                          <span
                            key={item}
                            className="project-stack-chip inline-flex min-h-8 items-center rounded-pill bg-[rgb(var(--background)/0.34)] px-2.5 py-1 text-left font-mono text-[10px] uppercase tracking-[0.12em] text-text-secondary"
                          >
                            {item}
                          </span>
                        ))}
                      </div>

                      <div className="min-h-[3.25rem]">
                        <CTACluster
                          items={[
                            ...(project.links.demo
                              ? [{ label: labels.liveDemo, href: project.links.demo, external: true, icon: Globe }]
                              : []),
                            ...(project.links.repo
                              ? [{ label: labels.repository, href: project.links.repo, external: true, icon: Github, variant: "secondary" as const }]
                              : []),
                          ]}
                        />
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
