import { cn } from "@/lib/utils";

type BlogCardPost = {
  accent: "cyan" | "blue" | "slate" | "amber";
  category: string;
  excerpt: string;
  layout: "standard" | "wide";
  publishedAt: string;
  readingTime: string;
  temporaryLabel: string;
  title: string;
};

const accentStyles = {
  cyan: "from-brand-primary/18 via-brand-primary/5 to-transparent",
  blue: "from-brand-secondary/22 via-brand-secondary/8 to-transparent",
  slate: "from-white/8 via-slate-300/5 to-transparent",
  amber: "from-accent-warm/18 via-accent-warm/6 to-transparent",
} as const;

const accentText = {
  cyan: "text-brand-primary",
  blue: "text-sky-300",
  slate: "text-slate-300",
  amber: "text-amber-300",
} as const;

const defaultCopy = {
  placeholder: "Placeholder",
  readMore: "Read more",
  explore: "Explore technical case",
} as const;

export default function BlogCard({
  post,
  variant = "standard",
  readMoreLabel = defaultCopy.readMore,
  exploreLabel = defaultCopy.explore,
}: {
  post: BlogCardPost;
  variant?: "standard" | "wide";
  readMoreLabel?: string;
  exploreLabel?: string;
}) {
  const isWide = variant === "wide" || post.layout === "wide";

  return (
    <article
      className={cn(
        "group overflow-hidden rounded-[var(--radius-soft)] bg-surface-elevated/92 shadow-ambient transition-all duration-300 hover:-translate-y-1 hover:bg-surface/95",
        isWide && "md:col-span-2",
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-background/50",
          isWide ? "min-h-[20rem]" : "aspect-[16/10]",
        )}
      >
        <div className={cn("absolute inset-0 bg-gradient-to-br", accentStyles[post.accent])} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_24%,rgba(255,255,255,0.08),transparent_24%),radial-gradient(circle_at_74%_72%,rgba(138,235,255,0.16),transparent_28%)]" />
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:24px_24px]" />

        <div className="relative flex h-full flex-col justify-between p-7 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className={cn("technical-label", accentText[post.accent])}>{post.category}</span>
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-tertiary">
              {post.readingTime}
            </span>
          </div>

          <p className="max-w-[12ch] font-display text-4xl uppercase tracking-[-0.04em] text-white/16 sm:text-5xl">
            {post.category}
          </p>
        </div>
      </div>

      <div className="flex h-full flex-col px-7 py-7 sm:px-8 sm:py-8">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <span className="rounded-pill border border-brand-primary/20 bg-brand-primary/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-brand-primary">
            {post.temporaryLabel ?? defaultCopy.placeholder}
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-tertiary">
            {post.publishedAt}
          </span>
        </div>

        <h3 className={cn("text-white transition-colors group-hover:text-brand-primary", isWide ? "max-w-3xl section-title-sm" : "card-title")}>
          {post.title}
        </h3>

        <p className={cn("mt-5 text-text-secondary", isWide ? "max-w-2xl text-base leading-7 sm:text-lg sm:leading-8" : "text-sm leading-7")}>{post.excerpt}</p>

        <div className="mt-8 inline-flex items-center gap-3 font-semibold text-brand-primary">
          <span>{isWide ? exploreLabel : readMoreLabel}</span>
          <span aria-hidden="true">→</span>
        </div>
      </div>
    </article>
  );
}
