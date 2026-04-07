import Image from "next/image";
import Link from "next/link";
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
    liveDemo: "Ver producto",
    repository: "Código",
  },
  en: {
    eyebrow: "Projects",
    title: "Four projects that show how I work.",
    description:
      "Product thinking, execution, and technical decisions made visible. One main case and three supporting projects for a fast read.",
    allProjects: "Explore projects",
    liveDemo: "View product",
    repository: "Code",
  },
} as const;

export default function FeaturedProjects({
  locale,
  projects,
}: {
  locale: Locale;
  projects: FeaturedProjectView[];
}) {
  const labels = copy[locale];
  const priorityProjects = projects.filter((project) => project.priority).slice(0, 4);
  const [mainProject, ...secondaryProjects] = priorityProjects;

  if (!mainProject) {
    return null;
  }

  return (
    <section className="bg-[linear-gradient(180deg,rgb(var(--surface-elevated)/0.18),rgb(var(--surface)/0.1))] py-10 sm:py-12 lg:py-14">
      <div className="site-container">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl space-y-5">
            <p className="technical-label">{labels.eyebrow}</p>
            <div className="space-y-4">
              <h2 className="text-3xl font-semibold text-text-primary sm:text-4xl lg:text-[3.2rem] lg:leading-[1.02]">
                {labels.title}
              </h2>
              <p className="max-w-2xl text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">
                {labels.description}
              </p>
            </div>
          </div>

          <Link
            href={`/${locale}/projects`}
            className="inline-flex items-center justify-start font-mono text-xs uppercase tracking-[0.22em] text-brand-primary transition-opacity hover:opacity-80"
          >
            {labels.allProjects}
          </Link>
        </div>

        <div className="grid gap-5">
          <article className="overflow-hidden rounded-[1.5rem] bg-[rgb(var(--surface-elevated)/0.46)] shadow-[0_18px_40px_rgba(2,8,23,0.1)]">
            <div className="grid gap-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
              <div className="relative aspect-[16/10] overflow-hidden bg-surface-dim lg:aspect-auto lg:min-h-[24rem]">
                <div className="absolute inset-2 sm:inset-3 lg:inset-4">
                  <Image
                    src={mainProject.media.cover}
                    alt={mainProject.media.alt}
                    fill
                    sizes="(min-width: 1024px) 42vw, 100vw"
                    className="object-contain object-center"
                  />
                </div>
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,14,24,0.02),rgba(10,14,24,0.38))]" />
              </div>

              <div className="space-y-6 px-6 py-6 sm:px-7 sm:py-7 lg:px-8 lg:py-8">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">
                    {mainProject.year} · {mainProject.category} · {mainProject.status}
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold text-text-primary sm:text-[2rem]">{mainProject.name}</h3>
                  <p className="mt-3 text-sm leading-6 text-text-secondary sm:text-base sm:leading-7">
                    {mainProject.summary}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {mainProject.stack.slice(0, 4).map((item) => (
                    <span
                      key={item}
                      className="rounded-pill bg-[rgb(var(--background)/0.34)] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-text-secondary"
                    >
                      {item}
                    </span>
                  ))}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.2rem] bg-[rgb(var(--background)/0.14)] px-4 py-4 sm:px-5">
                    <p className="technical-label">{locale === "es" ? "Desafío" : "Challenge"}</p>
                    <p className="mt-3 text-sm leading-6 text-text-primary sm:text-[0.95rem] sm:leading-7">
                      {mainProject.challenge}
                    </p>
                  </div>

                  <div className="rounded-[1.2rem] bg-[rgb(var(--background)/0.1)] px-4 py-4 sm:px-5">
                    <p className="technical-label">{locale === "es" ? "Impacto" : "Impact"}</p>
                    <p className="mt-3 text-sm leading-6 text-text-primary sm:text-[0.95rem] sm:leading-7">
                      {mainProject.impact.join("; ")}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  {mainProject.links.demo ? (
                    <a
                      href={mainProject.links.demo}
                      target="_blank"
                      rel="noreferrer"
                      className="button-primary w-full sm:w-auto"
                    >
                      {labels.liveDemo}
                    </a>
                  ) : null}

                  {mainProject.links.repo ? (
                    <a
                      href={mainProject.links.repo}
                      target="_blank"
                      rel="noreferrer"
                      className="button-secondary w-full sm:w-auto"
                    >
                      {labels.repository}
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </article>

          {secondaryProjects.length ? (
            <div className="grid gap-5 md:grid-cols-3">
              {secondaryProjects.map((project) => (
                <article
                  key={project.slug}
                  className="overflow-hidden rounded-[1.5rem] bg-[rgb(var(--surface-elevated)/0.42)] shadow-[0_18px_40px_rgba(2,8,23,0.1)]"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-surface-dim">
                    <div className={project.slug === "aktivar" ? "absolute inset-2 sm:inset-3" : "absolute inset-0"}>
                      <Image
                        src={project.media.cover}
                        alt={project.media.alt}
                        fill
                        sizes="(min-width: 1024px) 28vw, 100vw"
                        className={project.slug === "aktivar" ? "object-contain object-center" : "object-cover"}
                      />
                    </div>
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,14,24,0.02),rgba(10,14,24,0.38))]" />
                  </div>

                  <div className="space-y-5 px-6 py-6 sm:px-7 sm:py-7">
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">
                        {project.year} · {project.category} · {project.status}
                      </p>
                      <h3 className="mt-3 text-2xl font-semibold text-text-primary">{project.name}</h3>
                      <p className="mt-3 text-sm leading-6 text-text-secondary sm:text-base">{project.summary}</p>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {project.stack.slice(0, 4).map((item) => (
                        <span
                          key={item}
                          className="rounded-pill bg-[rgb(var(--background)/0.34)] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-text-secondary"
                        >
                          {item}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                      {project.links.demo ? (
                        <a
                          href={project.links.demo}
                          target="_blank"
                          rel="noreferrer"
                          className="button-primary w-full sm:w-auto"
                        >
                          {labels.liveDemo}
                        </a>
                      ) : null}

                      {project.links.repo ? (
                        <a
                          href={project.links.repo}
                          target="_blank"
                          rel="noreferrer"
                          className="button-secondary w-full sm:w-auto"
                        >
                          {labels.repository}
                        </a>
                      ) : null}
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
