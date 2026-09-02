import Link from 'next/link';
import type { Locale } from '@/lib/i18n';
import type { NextScheduledPost } from '@/lib/post-publications/visibility';

const COPY: Record<Locale, { eyebrow: string; verb: (date: string) => string }> = {
  es: {
    eyebrow: 'Próximo domingo',
    verb: (date) => `Sale el ${date}`,
  },
  en: {
    eyebrow: 'Next Sunday',
    verb: (date) => `Publishing ${date}`,
  },
};

export function NextIssueTeaser({ post, locale }: { post: NextScheduledPost; locale: Locale }) {
  const copy = COPY[locale];
  const formattedDate = new Date(post.scheduledAt).toLocaleDateString(
    locale === 'es' ? 'es-AR' : 'en-US',
    { weekday: 'long', day: 'numeric', month: 'long' },
  );

  return (
    <Link
      href={`/${locale}/blog/${post.slug}`}
      className="group flex items-center gap-3 text-sm text-text-tertiary transition-colors hover:text-text-secondary"
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-brand-primary/70">
        {copy.eyebrow}
      </span>
      <span className="h-1 w-1 rounded-full bg-outline-ghost/30" />
      <span className="truncate">{post.title}</span>
      <span className="whitespace-nowrap font-mono text-[11px] text-text-tertiary/70">
        {copy.verb(formattedDate)}
      </span>
    </Link>
  );
}
