"use client";

import { useState } from "react";
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

export function CategoryFilter({ posts, currentLocale, eyebrow }: Props) {
  const [active, setActive] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const filtered = active ? posts.filter((p) => p.category === active) : posts;
  const totalPages = Math.ceil(filtered.length / POSTS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);

  function handleFilter(cat: string | null) {
    setActive(cat);
    setPage(1);
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
      <section className="site-container pb-10 sm:pb-12 lg:pb-14">
        <div className="mb-8 flex items-center gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">
            {eyebrow}
          </span>
          <span className="h-px flex-1 bg-outline-ghost/15" />
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">
            {filtered.length} {filtered.length === 1 ? "post" : "posts"}
          </span>
        </div>

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
                      className="hover:underline"
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
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-pill border border-outline-ghost/15 bg-surface-dim/50 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-text-secondary transition-colors hover:border-outline-ghost/30 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-30"
            >
              ← Anterior
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`h-8 w-8 rounded-pill border font-mono text-[11px] transition-colors ${
                  n === page
                    ? "border-brand-primary/30 bg-brand-primary/10 text-brand-primary"
                    : "border-outline-ghost/15 bg-surface-dim/50 text-text-secondary hover:border-outline-ghost/30 hover:text-text-primary"
                }`}
              >
                {n}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-pill border border-outline-ghost/15 bg-surface-dim/50 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-text-secondary transition-colors hover:border-outline-ghost/30 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-30"
            >
              Siguiente →
            </button>
          </div>
        )}
      </section>
    </>
  );
}
