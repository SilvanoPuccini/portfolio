import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import SiteShell from "@/components/site/SiteShell";
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

  return <SiteShell locale={locale as Locale}>{children}</SiteShell>;
}
