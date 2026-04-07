import Image from "next/image";
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
  const usesContainedMedia = project.slug === "aktivar";

  return (
    <article
      className={cn(
        "surface-panel overflow-hidden",
        isFeature && "grid gap-0 xl:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.92fr)]",
      )}
    >
      <div className="relative overflow-hidden bg-surface-dim">
        <div className={cn("relative overflow-hidden", isFeature ? "aspect-[16/11] xl:h-full xl:min-h-[30rem]" : "aspect-[5/4]")}>
          <div className={cn("absolute inset-0", usesContainedMedia && "inset-2 sm:inset-3")}>
            <Image
              src={project.media.cover}
              alt={project.media.alt}
              fill
              sizes={isFeature ? "(min-width: 1280px) 55vw, 100vw" : "(min-width: 1024px) 33vw, 100vw"}
              className={cn(usesContainedMedia ? "object-contain object-center" : "object-cover", "opacity-90")}
            />
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,10,18,0.08),rgba(7,10,18,0.78))]" />
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap gap-2 px-5 pb-5 sm:px-7 sm:pb-7">
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
      </div>

      <div className="no-line-stack px-6 py-6 sm:px-7 sm:py-7">
        <div>
          <p className="technical-label">{project.headline}</p>
          <h3 className={cn("mt-4 font-semibold text-text-primary", isFeature ? "text-3xl sm:text-4xl" : "text-2xl")}>{project.name}</h3>
          <p className={cn("mt-4 text-text-secondary", isFeature ? "max-w-2xl text-base leading-7 sm:text-lg sm:leading-8" : "text-sm leading-6")}>{project.summary}</p>
        </div>

        <div className={cn("grid gap-5", isFeature && "lg:grid-cols-2")}>
          <div>
            <p className="technical-label">{labels.challenge}</p>
            <p className="mt-3 text-sm leading-6 text-text-secondary sm:text-base sm:leading-7">{project.challenge}</p>
          </div>

          <div>
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
              className="rounded-pill border border-outline-ghost/15 bg-surface-dim/80 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-text-secondary"
            >
              {item}
            </span>
          ))}
        </div>

        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">
            {labels.sourceBacked} · {project.sourceUrls.length}
          </p>

          <CTACluster
            items={[
              ...(project.links.demo ? [{ label: labels.liveDemo, href: project.links.demo, external: true }] : []),
              ...(project.links.repo
                ? [
                    {
                      label: labels.repository,
                      href: project.links.repo,
                      external: true,
                      variant: "secondary" as const,
                    },
                  ]
                : []),
            ]}
          />
        </div>
      </div>
    </article>
  );
}
