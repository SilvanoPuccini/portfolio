"use client";

import { useState, useRef, useCallback } from "react";
import ProjectCard from "@/components/blocks/ProjectCard";
import ProjectGrid from "@/components/blocks/ProjectGrid";

const PROJECTS_PER_PAGE = 4;

type Project = {
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
  links: { demo?: string; repo?: string };
  demoAccess?: { label: string; credentials: string };
  media: { cover: string; alt: string };
};

type Labels = {
  challenge: string;
  impact: string;
  liveDemo: string;
  repository: string;
  sourceBacked: string;
};

function buildPageRange(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const delta = 1;
  const range: (number | "...")[] = [];
  const left = current - delta;
  const right = current + delta;
  range.push(1);
  if (left > 2) range.push("...");
  for (let i = Math.max(2, left); i <= Math.min(total - 1, right); i++) range.push(i);
  if (right < total - 1) range.push("...");
  range.push(total);
  return range;
}

interface Props {
  projects: Project[];
  labels: Labels;
  eyebrow: string;
  description: string;
}

export function ProjectsPaginatedGrid({ projects, labels, eyebrow, description }: Props) {
  const [page, setPage] = useState(1);
  const [animating, setAnimating] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  const totalPages = Math.ceil(projects.length / PROJECTS_PER_PAGE);
  const paginated = projects.slice((page - 1) * PROJECTS_PER_PAGE, page * PROJECTS_PER_PAGE);

  const scrollToSection = useCallback(() => {
    if (!sectionRef.current) return;
    const top = sectionRef.current.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo({ top, behavior: "smooth" });
  }, []);

  function changePage(next: number) {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setPage(next);
      setAnimating(false);
      scrollToSection();
    }, 200);
  }

  return (
    <div ref={sectionRef}>
      {/* Header */}
      <div className="mb-8 max-w-[52rem] space-y-3">
        <p className="technical-label">{eyebrow}</p>
        <p className="text-[0.95rem] leading-7 text-text-secondary sm:text-base sm:leading-7">
          {description}
        </p>
      </div>

      {/* Animated content */}
      <div
        style={{
          opacity: animating ? 0 : 1,
          transform: animating ? "translateY(10px)" : "translateY(0)",
          transition: "opacity 200ms ease, transform 200ms ease",
        }}
      >
        <ProjectGrid columns="two">
          {paginated.map((project) => (
            <ProjectCard key={project.slug} project={project} labels={labels} />
          ))}
        </ProjectGrid>

        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button
              onClick={() => changePage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="rounded-pill border border-outline-ghost/15 bg-surface-dim/50 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-text-secondary transition-all duration-200 hover:border-outline-ghost/30 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-30"
            >
              ← Anterior
            </button>

            {buildPageRange(page, totalPages).map((n, i) =>
              n === "..." ? (
                <span key={`ellipsis-${i}`} className="px-1 font-mono text-[11px] text-text-tertiary">
                  …
                </span>
              ) : (
                <button
                  key={n}
                  onClick={() => changePage(n)}
                  className={`h-8 w-8 rounded-pill border font-mono text-[11px] transition-all duration-200 ${
                    n === page
                      ? "border-brand-primary/30 bg-brand-primary/10 text-brand-primary"
                      : "border-outline-ghost/15 bg-surface-dim/50 text-text-secondary hover:border-outline-ghost/30 hover:text-text-primary"
                  }`}
                >
                  {n}
                </button>
              )
            )}

            <button
              onClick={() => changePage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="rounded-pill border border-outline-ghost/15 bg-surface-dim/50 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-text-secondary transition-all duration-200 hover:border-outline-ghost/30 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-30"
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
