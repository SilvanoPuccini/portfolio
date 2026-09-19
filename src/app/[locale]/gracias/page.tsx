import type { Metadata } from "next";

import PageHero from "@/components/site/PageHero";
import { getSiteContent } from "@/content/site";
import { resolveLocale, type Locale } from "@/lib/i18n";

type LocaleParams = Promise<{ locale: string }>;

/**
 * Where Documenso sends the client after signing.
 *
 * The kickoff uses its own Cal.com event (NEXT_PUBLIC_CALCOM_KICKOFF_LINK) on
 * purpose: falling back to the diagnostic-call link would have a signed client
 * book a sales call. Without the kickoff link the page says the kickoff will
 * be coordinated by email instead.
 */
const copy = {
  es: {
    metaTitle: "Contrato firmado",
    heroEyebrow: "Todo listo",
    heroTitle: "Contrato firmado, gracias",
    heroSubtitle:
      "En unos minutos te llega un mail con los datos de pago de la seña. Con el pago acreditado arrancamos.",
    kickoffTitle: "Agendá el kickoff",
    kickoffText:
      "Elegí un horario para la reunión de arranque: repasamos alcance, accesos y el calendario de entregas.",
    fallbackText:
      "En las próximas 24 horas te escribo para coordinar el kickoff. Si tenés alguna duda antes, respondé el mail de pago.",
    contactCta: "Escribime",
  },
  en: {
    metaTitle: "Contract signed",
    heroEyebrow: "All set",
    heroTitle: "Contract signed, thank you",
    heroSubtitle:
      "In a few minutes you will get an email with the deposit payment details. Once the payment clears, we start.",
    kickoffTitle: "Book the kickoff",
    kickoffText:
      "Pick a time for the kickoff meeting: we will go over scope, access and the delivery schedule.",
    fallbackText:
      "Within the next 24 hours I will email you to schedule the kickoff. If you have questions before then, just reply to the payment email.",
    contactCta: "Email me",
  },
} as const;

export async function generateMetadata({
  params,
}: {
  params: LocaleParams;
}): Promise<Metadata> {
  const { locale } = await params;
  const labels = copy[resolveLocale(locale)];

  return {
    title: `${labels.metaTitle} | Silvano Puccini`,
    robots: { index: false, follow: false },
  };
}

export default async function GraciasPage({ params }: { params: LocaleParams }) {
  const { locale } = await params;
  const currentLocale: Locale = resolveLocale(locale);
  const content = getSiteContent(currentLocale);
  const labels = copy[currentLocale];
  const kickoffLink = process.env.NEXT_PUBLIC_CALCOM_KICKOFF_LINK;

  return (
    <>
      <PageHero
        eyebrow={labels.heroEyebrow}
        title={labels.heroTitle}
        subtitle={<p>{labels.heroSubtitle}</p>}
      />

      <section className="site-container pb-16 sm:pb-20">
        {kickoffLink ? (
          <>
            <h2 className="section-title-sm">{labels.kickoffTitle}</h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-text-secondary">
              {labels.kickoffText}
            </p>
            <div className="surface-panel mt-8 overflow-hidden border border-outline-ghost/10">
              <iframe
                src={kickoffLink}
                title={`${labels.kickoffTitle} (kickoff)`}
                className="h-[700px] w-full border-0"
                loading="lazy"
              />
            </div>
          </>
        ) : (
          <div className="surface-panel border border-outline-ghost/10 px-8 py-14 text-center sm:px-16">
            <p className="mx-auto max-w-lg text-base leading-7 text-text-secondary">
              {labels.fallbackText}
            </p>
            <div className="mt-8">
              <a
                href={`mailto:${content.metadata.email}`}
                className="button-primary inline-flex items-center justify-center"
              >
                {labels.contactCta}
              </a>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
