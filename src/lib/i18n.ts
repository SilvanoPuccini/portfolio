import type { Locale } from "@/content/schema";

export type { Locale } from "@/content/schema";

export const locales = ["es", "en"] as const satisfies readonly Locale[];

export const defaultLocale: Locale = "es";

export const localeLabels: Record<Locale, string> = {
  es: "ES",
  en: "EN",
};

export function isValidLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function resolveLocale(value?: string): Locale {
  return value && isValidLocale(value) ? value : defaultLocale;
}

export function getLocalizedHref(pathname: string, nextLocale: Locale) {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return `/${nextLocale}`;
  }

  if (isValidLocale(segments[0])) {
    segments[0] = nextLocale;
    return `/${segments.join("/")}`;
  }

  return `/${nextLocale}/${segments.join("/")}`;
}
