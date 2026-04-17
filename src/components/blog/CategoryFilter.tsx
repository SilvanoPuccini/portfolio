"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import type { BlogPost } from "@/types/blog";
import { PostCover } from "@/components/blog/PostCover";

const CATEGORIES = ["Performance", "Producto", "Automatización"] as const;
const POSTS_PER_PAGE = 6;

const categoryColors: Record<string, string> = {
  Performance: "bg-green-500/10 text-green-400 border-green-500/20",
  Producto: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Automatización: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

interface Props {
  posts: BlogPost[];
  currentLocale: string;
  eyebrow: string;
}

function buildPageRange(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const delta = 1; // páginas a cada lado de la actual
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

export function CategoryFilter({ posts, currentLocale, eyebrow }: Props) {
  const [active, setActive] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [animating, setAnimating] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const filtered = active ? posts.filter((p) => p.category === active) : posts;
  const totalPages = Math.ceil(filtered.length / POSTS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);

  const scrollToGrid = useCallback(() => {
    if (!gridRef.current) return;
    const top = gridRef.current.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo({ top, behavior: "smooth" });
  }, []);

  function changePage(next: number) {
    setAnimating(true);
    setTimeout(() => {
      setPage(next);
      setAnimating(false);
      scrollToGrid();
    }, 200);
  }

  function handleFilter(cat: string | null) {
    setAnimating(true);
    setTimeout(() => {
      setActive(cat);
      setPage(1);
      setAnimating(false);
    }, 200);
  }

  return (
    <>
      {/* Filtros */}
      <section className="site-container py-6 sm:py-8">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleFilter(null)}
            className={`rounded-pill border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors ${
              active === null
                ? "border-brand-primary/30 bg-brand-primary/10 text-brand-primary"
                : "border-outline-ghost/15 bg-surface-dim/50 text-text-secondary hover:border-brand-primary/20 hover:text-brand-primary"
            }`}
          >
            Todos
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleFilter(cat)}
              className={`rounded-pill border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors ${
                active === cat
                  ? categoryColors[cat]
                  : "border-outline-ghost/15 bg-surface-dim/50 text-text-secondary hover:border-outline-ghost/30 hover:text-text-primary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Grilla */}
      <section ref={gridRef} className="site-container pb-10 sm:pb-12 lg:pb-14">
        <div className="mb-8 flex items-center gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">
            {eyebrow}
          </span>
          <span className="h-px flex-1 bg-outline-ghost/15" />
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">
            {filtered.length} {filtered.length === 1 ? "post" : "posts"}
          </span>
        </div>

        <div
          style={{
            opacity: animating ? 0 : 1,
            transform: animating ? "translateY(10px)" : "translateY(0)",
            transition: "opacity 200ms ease, transform 200ms ease",
          }}
        >
          {filtered.length === 0 ? (
            <p className="py-16 text-center font-mono text-sm text-text-tertiary">
              No hay posts en esta categoría todavía.
            </p>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {paginated.map((post) => (
                <article
                  key={post.slug}
                  className="surface-panel no-line-stack flex h-full flex-col overflow-hidden border border-outline-ghost/10 bg-[linear-gradient(180deg,rgb(var(--surface)/0.72),rgb(var(--surface-dim)/0.88))]"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <PostCover title={post.title} category={post.category} />
                  </div>

                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <span
                      className={`inline-flex w-fit rounded-pill border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${
                        categoryColors[post.category] ||
                        "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      }`}
                    >
                      {post.category}
                    </span>

                    <h3 className="mt-4 text-xl font-semibold leading-tight text-text-primary sm:text-2xl">
                      <Link
                        href={`/${currentLocale}/blog/${post.slug}`}
                        className="hover:underline hover:text-brand-primary transition-colors duration-150"
                      >
                        {post.title}
                      </Link>
                    </h3>

                    <p className="mt-3 flex-1 text-sm leading-6 text-text-secondary sm:text-[0.95rem] sm:leading-7">
                      {post.excerpt}
                    </p>

                    <div className="mt-4 flex items-center justify-between border-t border-outline-ghost/10 pt-4">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">
                          {post.readingTime}
                        </span>
                        <span className="h-1 w-1 rounded-full bg-outline-ghost/30" />
                        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">
                          {formatDate(post.date)}
                        </span>
                      </div>
                      <Link
                        href={`/${currentLocale}/blog/${post.slug}`}
                        className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand-primary hover:underline"
                      >
                        Leer más →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              <button
                onClick={() => page > 1 && changePage(page - 1)}
                className={`rounded-pill border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-all duration-200 ${
                  page === 1
                    ? "cursor-not-allowed border-outline-ghost/10 bg-surface-dim/30 text-text-tertiary opacity-30"
                    : "border-outline-ghost/15 bg-surface-dim/50 text-text-secondary hover:border-outline-ghost/30 hover:text-text-primary"
                }`}
              >
                ← Anterior
              </button>

              {buildPageRange(page, totalPages).map((n, i) =>
                n === "..." ? (
                  <span
                    key={`ellipsis-${i}`}
                    className="font-mono text-[11px] text-text-tertiary px-1"
                  >
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
                onClick={() => page < totalPages && changePage(page + 1)}
                className={`rounded-pill border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-all duration-200 ${
                  page === totalPages
                    ? "cursor-not-allowed border-outline-ghost/10 bg-surface-dim/30 text-text-tertiary opacity-30"
                    : "border-outline-ghost/15 bg-surface-dim/50 text-text-secondary hover:border-outline-ghost/30 hover:text-text-primary"
                }`}
              >
                Siguiente →
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
