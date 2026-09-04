import Spotlight from "@/components/site/Spotlight";
import Image from "next/image";
import { Github, Globe } from "lucide-react";
import CTACluster from "@/components/site/CTACluster";
import { cn } from "@/lib/utils";

type ProjectCardProject = {
  slug: string;
  name: string;
  year: string;
  category: string;
  status: string;
  headline: string;
  summary: string;
  challenge: string;
  impact: string[];
  stack: string[];
  sourceUrls: string[];
  links: {
    demo?: string;
    repo?: string;
  };
  demoAccess?: {
    label: string;
    credentials: string;
  };
  media: {
    cover: string;
    alt: string;
  };
};

type Labels = {
  challenge: string;
  impact: string;
  liveDemo: string;
  repository: string;
  sourceBacked: string;
};

export default function ProjectCard({
  project,
  labels,
  variant = "standard",
  accentLabel,
}: {
  project: ProjectCardProject;
  labels: Labels;
  variant?: "feature" | "standard";
  accentLabel?: string;
}) {
  const isFeature = variant === "feature";
  const isFacturiaFeature = isFeature && project.slug === "facturia-2-0";
  const isFacturiaProject = project.slug === "facturia-2-0";
  const usesContainedMedia =
    project.slug === "aktivar" || project.slug === "my-marketing-agency" || project.slug === "pediacore" || project.slug === "ferrestock" || project.slug === "facturia-2-0" || project.slug === "mindcode-academy";
  const mediaPanelClassName = cn(
    "relative overflow-hidden bg-surface-dim",
    isFacturiaFeature && "grid xl:grid-rows-[minmax(0,1fr)_auto]",
  );
  const mediaFrameClassName = cn(
    "project-media-hover relative overflow-hidden",
    isFeature ? "aspect-[16/11] xl:h-full xl:min-h-[27rem]" : "aspect-[6/5]",
    usesContainedMedia && "project-media-hover-contained",
    isFacturiaFeature && "aspect-[16/12] min-h-[18rem] xl:aspect-auto xl:min-h-[22rem]",
  );
  const copyBlock = (
    <div>
      <p className="technical-label">{project.headline}</p>
      <h3
        className={cn(
          "mt-3.5 font-semibold text-text-primary",
          isFeature ? "text-[2rem] leading-[1.06] sm:text-[2.35rem]" : "text-[1.7rem] leading-[1.08]",
        )}
      >
        {project.name}
      </h3>
      <p
        className={cn(
          "mt-3.5 text-text-secondary",
          isFeature ? "max-w-2xl text-[0.95rem] leading-7 sm:text-base sm:leading-7" : "text-sm leading-6",
        )}
      >
        {project.summary}
      </p>
    </div>
  );

  return (
    <Spotlight className="rounded-[var(--radius-soft)] h-full">
    <article
      className={cn(
        "surface-panel overflow-hidden",
        isFeature ? "grid gap-0 xl:grid-cols-[minmax(0,1.04fr)_minmax(19rem,0.96fr)]" : "flex h-full flex-col",
      )}
    >
      <div className={mediaPanelClassName}>
        <div className={mediaFrameClassName}>
          <div
            className={cn(
              "project-media-asset absolute inset-0",
              usesContainedMedia && "inset-2 sm:inset-3",
              isFacturiaFeature && "inset-1 sm:inset-2 lg:inset-3",
            )}
          >
            <Image
              src={project.media.cover}
              alt={project.media.alt}
              fill
              sizes={isFeature ? "(min-width: 1280px) 55vw, 100vw" : "(min-width: 1024px) 33vw, 100vw"}
              className={cn(
                usesContainedMedia ? "object-contain object-center" : "object-cover",
                isFacturiaProject && "scale-[1.16] sm:scale-[1.2] lg:scale-[1.24] object-[center_center]",
                "opacity-90",
              )}
            />
          </div>
          <div
            className={cn(
              "project-media-overlay absolute inset-0 bg-[linear-gradient(180deg,rgba(7,10,18,0.08),rgba(7,10,18,0.78))]",
              isFacturiaFeature && "bg-[linear-gradient(180deg,rgba(7,10,18,0.02),rgba(7,10,18,0.36))]",
            )}
          />
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap gap-2 px-5 pb-5 sm:px-6 sm:pb-6">
            {accentLabel ? (
              <span className="rounded-pill bg-surface-elevated/90 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-text-primary">
                {accentLabel}
              </span>
            ) : null}
            <span className="rounded-pill border border-outline-ghost/15 bg-surface-dim/80 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-text-secondary">
              {project.year} · {project.category}
            </span>
            <span className="rounded-pill border border-outline-ghost/15 bg-surface-dim/80 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-text-secondary">
              {project.status}
            </span>
          </div>
        </div>

        {isFacturiaFeature ? (
          <div className="no-line-stack border-t border-outline-ghost/10 bg-[linear-gradient(180deg,rgb(var(--surface-elevated)/0.68),rgb(var(--surface)/0.94))] px-5 py-5 sm:px-6 sm:py-6 lg:px-7 lg:py-7">
            {copyBlock}
          </div>
        ) : null}
      </div>

      <div className={cn("no-line-stack px-5 py-5 sm:px-6 sm:py-6 lg:px-7 lg:py-7", !isFeature && "flex flex-1 flex-col")}>
        {!isFacturiaFeature ? copyBlock : null}

        <div className={cn("grid gap-4", isFeature && "lg:grid-cols-2")}>
          <div className={cn(isFeature && "surface-subpanel px-4 py-4 sm:px-5 sm:py-5")}>
            <p className="technical-label">{labels.challenge}</p>
            <p className="mt-3 text-sm leading-6 text-text-secondary sm:text-base sm:leading-7">{project.challenge}</p>
          </div>

          <div className={cn(isFeature && "surface-subpanel px-4 py-4 sm:px-5 sm:py-5")}>
            <p className="technical-label">{labels.impact}</p>
            <ul className="mt-3 space-y-3 text-sm leading-6 text-text-secondary sm:text-base sm:leading-7">
              {project.impact.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {project.stack.slice(0, isFeature ? 8 : 5).map((item) => (
            <span
              key={`${project.slug}-${item}`}
              className="project-stack-chip rounded-pill border border-transparent bg-surface-dim/80 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-text-secondary"
            >
              {item}
            </span>
          ))}
        </div>

        {project.demoAccess ? (
          <div className="surface-subpanel bg-[rgb(var(--background)/0.12)] px-4 py-3 sm:px-5">
            <p className="technical-label">{project.demoAccess.label}</p>
            <p className="mt-2 font-mono text-[12px] leading-6 text-text-primary sm:text-[13px] sm:leading-6">
              {project.demoAccess.credentials}
            </p>
          </div>
        ) : null}

        <div className={cn("flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between", !isFeature && "mt-auto pt-2")}>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">
            {labels.sourceBacked} · {project.sourceUrls.length}
          </p>

          <CTACluster
            items={[
              ...(project.links.demo ? [{ label: labels.liveDemo, href: project.links.demo, external: true, icon: Globe }] : []),
              ...(project.links.repo
                ? [
                    {
                      label: labels.repository,
                      href: project.links.repo,
                      external: true,
                      icon: Github,
                      variant: "secondary" as const,
                    },
                  ]
                : []),
            ]}
          />
        </div>
      </div>
    </article>
    </Spotlight>
  );
}
