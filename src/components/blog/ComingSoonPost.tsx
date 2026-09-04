import Link from 'next/link';
import { RadarBadge } from '@/components/blog/RadarBadge';
import type { Locale } from '@/lib/i18n';

const COPY: Record<Locale, { back: string; eyebrow: string; heading: string; body: (date: string) => string }> = {
  es: {
    back: 'Blog',
    eyebrow: 'Próximamente',
    heading: 'Este número de El Radar todavía no salió.',
    // Sin punto final: el formato de hora en es-AR ya termina en "a. m."
    body: (date) => `Se publica el ${date}`,
  },
  en: {
    back: 'Blog',
    eyebrow: 'Coming soon',
    heading: 'This issue of El Radar hasn’t gone out yet.',
    body: (date) => `Publishing on ${date}`,
  },
};

export function ComingSoonPost({
  title,
  scheduledAt,
  locale,
}: {
  title: string;
  scheduledAt: string;
  locale: Locale;
}) {
  const copy = COPY[locale];
  const formattedDate = new Date(scheduledAt).toLocaleString(locale === 'es' ? 'es-AR' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="site-container flex flex-col items-center py-20 text-center sm:py-28">
      <nav className="mb-10 self-start">
        <Link
          href={`/${locale}/blog`}
          className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary transition-colors hover:text-brand-primary"
        >
          <span aria-hidden>←</span>
          {copy.back}
        </Link>
      </nav>

      <RadarBadge scale={0.9} />

      <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.22em] text-brand-primary">
        {copy.eyebrow}
      </p>

      <h1 className="mt-4 max-w-xl section-title-sm">
        {title}
      </h1>

      <p className="mt-5 text-base text-text-secondary sm:text-lg">{copy.body(formattedDate)}</p>
    </div>
  );
}
