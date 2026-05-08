import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import SiteShell from "@/components/site/SiteShell";
import JsonLd from "@/components/JsonLd";
import { isValidLocale, locales, type Locale } from "@/lib/i18n";

type LocaleParams = Promise<{ locale: string }>;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: LocaleParams;
}) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  return (
    <SiteShell locale={locale as Locale}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Silvano Puccini Portfolio",
          url: "https://silvanopuccini.dev",
        }}
      />
      {children}
    </SiteShell>
  );
}
