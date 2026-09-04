import Link from 'next/link';

interface PostCardProps {
  slug: string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
  readingTime?: string;
  locale?: string;
}

export function PostCard({ slug, title, date, category, excerpt, readingTime, locale = 'es' }: PostCardProps) {
  // Colores por categoría
  const categoryColors: Record<string, string> = {
    'Performance':    'bg-green-500/10 text-green-400',
    'Producto':       'bg-purple-500/10 text-purple-400',
    'Automatización': 'bg-amber-500/10 text-amber-400',
    'Criterio':       'bg-indigo-500/10 text-indigo-400',
    'Editorial':      'bg-cyan-500/10 text-cyan-400',
  };

  const categoryColor = categoryColors[category] || 'bg-blue-500/10 text-blue-400';

  return (
    <article className="surface-panel no-line-stack flex h-full flex-col overflow-hidden border border-outline-ghost/10 px-5 py-6 sm:px-6 sm:py-7 bg-[linear-gradient(180deg,rgb(var(--surface)/0.72),rgb(var(--surface-dim)/0.88))]">
      <div className="border-b border-outline-ghost/10 pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`rounded-pill px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${categoryColor}`}>
            {category}
          </span>
          {readingTime && (
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">
              {readingTime}
            </span>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-1 flex-col">
        <h3 className="card-title">
          <Link href={`/${locale}/blog/${slug}`} className="hover:underline">
            {title}
          </Link>
        </h3>
        <p className="mt-4 text-sm leading-6 text-text-secondary sm:text-base sm:leading-7">
          {excerpt}
        </p>
      </div>

      <div className="mt-auto border-t border-outline-ghost/10 pt-6">
        <div className="flex items-center justify-between">
          <time className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">
            {date}
          </time>
          <Link
            href={`/${locale}/blog/${slug}`}
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand-primary hover:underline"
          >
            {locale === 'en' ? 'Read more →' : 'Leer más →'}
          </Link>
        </div>
      </div>
    </article>
  );
}