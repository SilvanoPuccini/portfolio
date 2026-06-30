import type { Metadata } from "next";

import PageHero from "@/components/site/PageHero";
import { getSiteContent } from "@/content/site";
import { resolveLocale, type Locale } from "@/lib/i18n";

type LocaleParams = Promise<{ locale: string }>;
type SearchParams = Promise<{ leadId?: string; name?: string; email?: string }>;

const copy = {
  es: {
    metaTitle: "Agendar llamada",
    metaDescription:
      "Agenda una llamada de diagnostico gratuita para hablar sobre tu proyecto.",
    heroEyebrow: "Siguiente paso",
    heroTitle: "Agenda tu llamada de diagnostico gratuita",
    heroSubtitle:
      "Elegí un horario que te quede cómodo. La llamada dura 30 minutos y no tiene costo ni compromiso.",
    fallbackTitle: "Estamos configurando el calendario",
    fallbackMessage:
      "Mientras tanto, podés escribirnos directamente para coordinar una llamada.",
    fallbackCta: "Contactar por email",
  },
  en: {
    metaTitle: "Schedule a call",
    metaDescription:
      "Schedule a free diagnostic call to discuss your project.",
    heroEyebrow: "Next step",
    heroTitle: "Schedule your free diagnostic call",
    heroSubtitle:
      "Pick a time that works for you. The call takes 30 minutes and has no cost or commitment.",
    fallbackTitle: "We are setting up the calendar",
    fallbackMessage:
      "In the meantime, you can reach out directly to coordinate a call.",
    fallbackCta: "Contact via email",
  },
} as const;

export async function generateMetadata({
  params,
}: {
  params: LocaleParams;
}): Promise<Metadata> {
  const { locale } = await params;
  const currentLocale: Locale = resolveLocale(locale);
  const content = getSiteContent(currentLocale);
  const labels = copy[currentLocale];

  return {
    title: `${content.metadata.siteName} | ${labels.metaTitle}`,
    description: labels.metaDescription,
    openGraph: {
      title: `${content.metadata.siteName} | ${labels.metaTitle}`,
      description: labels.metaDescription,
      type: "website",
      url: `https://silvanopuccini.dev/${locale}/services/agendar`,
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function AgendarPage({
  params,
  searchParams,
}: {
  params: LocaleParams;
  searchParams: SearchParams;
}) {
  const { locale } = await params;
  const { name, email } = await searchParams;
  const currentLocale: Locale = resolveLocale(locale);
  const content = getSiteContent(currentLocale);
  const labels = copy[currentLocale];
  const calcomLink = process.env.NEXT_PUBLIC_CALCOM_LINK;

  const calUrl = calcomLink
    ? `${calcomLink}?${new URLSearchParams({
        ...(name ? { name } : {}),
        ...(email ? { email } : {}),
      }).toString()}`
    : null;

  return (
    <>
      <PageHero
        eyebrow={labels.heroEyebrow}
        title={labels.heroTitle}
        subtitle={<p>{labels.heroSubtitle}</p>}
      />

      <section className="site-container pb-16 sm:pb-20">
        {calUrl ? (
          <div className="surface-panel overflow-hidden border border-outline-ghost/10">
            <iframe
              src={calUrl}
              title={labels.metaTitle}
              className="h-[700px] w-full border-0"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="surface-panel border border-outline-ghost/10 bg-[linear-gradient(180deg,rgb(var(--surface-elevated)/0.9),rgb(var(--surface)/0.76))] px-8 py-14 text-center sm:px-16 sm:py-20">
            <h2 className="text-2xl font-semibold text-text-primary sm:text-3xl">
              {labels.fallbackTitle}
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-text-secondary">
              {labels.fallbackMessage}
            </p>
            <div className="mt-8">
              <a
                href={`mailto:${content.metadata.email}`}
                className="button-primary inline-flex items-center justify-center"
              >
                {labels.fallbackCta}
              </a>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
