import type { Metadata } from "next";
import Link from "next/link";
import FeaturedProjects from "@/components/blocks/FeaturedProjects";
import HeroEditorial from "@/components/blocks/HeroEditorial";
import TrustStrip from "@/components/blocks/TrustStrip";
import JsonLd from "@/components/JsonLd";
import { getFeaturedProjects, getSiteContent } from "@/content/site";
import { resolveLocale, type Locale } from "@/lib/i18n";
import { generatePageMetadata } from "@/lib/metadata";

type LocaleParams = Promise<{ locale: string }>;

export async function generateMetadata({
  params,
}: {
  params: LocaleParams;
}): Promise<Metadata> {
  const { locale } = await params;
  const currentLocale: Locale = resolveLocale(locale);
  const content = getSiteContent(currentLocale);

  return generatePageMetadata({
    locale: currentLocale,
    path: "",
    title: `${content.metadata.siteName} | ${content.metadata.role}`,
    description: content.metadata.description,
  });
}

export default async function LocaleHomePage({
  params,
}: {
  params: LocaleParams;
}) {
  const { locale } = await params;
  const currentLocale: Locale = resolveLocale(locale);
  const content = getSiteContent(currentLocale);
  const featuredProjects = getFeaturedProjects(currentLocale);
  const contactSupportCopy =
    currentLocale === "es"
      ? "Sistemas de gestión, sitios web y automatización de procesos para negocios que necesitan ordenarse."
      : "Available to collaborate on digital products, web platforms, and process automation.";

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Person",
          name: "Silvano Puccini",
          jobTitle: "Full Stack Developer",
          url: "https://silvanopuccini.dev",
          sameAs: [
            "https://github.com/SilvanoPuccini",
            "https://www.linkedin.com/in/silvano-puccini/",
          ],
        }}
      />
      <HeroEditorial content={content} locale={currentLocale} />
      <FeaturedProjects locale={currentLocale} projects={featuredProjects} showAllProjectsLink={false} condensedMain={true} />
      <TrustStrip locale={currentLocale} />

      <section className="bg-[linear-gradient(180deg,rgba(var(--surface-dim),0.42),rgba(var(--surface),0.18))]">
        <div className="site-container section-rhythm">
          <div className="max-w-3xl">
            <p className="section-eyebrow">{content.contact.eyebrow}</p>
            <h2 className="mt-4 section-title">{content.contact.title}</h2>
            <p className="mt-5 section-lede">{content.contact.intro}</p>
            <div className="mt-9 flex max-w-2xl flex-col items-start gap-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">
                {content.contact.availability}
              </p>
              <p className="max-w-2xl text-sm leading-6 text-text-secondary sm:text-base sm:leading-7">{contactSupportCopy}</p>

              <Link
                href={content.contact.primaryCtas[0]?.href ?? `/${currentLocale}/contact`}
                className="button-primary button-primary-soft w-full sm:w-auto"
              >
                {content.contact.primaryCtas[0]?.label ?? (currentLocale === "es" ? "Contacto" : "Contact")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
