import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n";

const SITE_URL = "https://silvanopuccini.dev";
// PNG required: social crawlers (LinkedIn, Facebook, Twitter) do not render SVG og:image.
// Cache-busting query param: bump this when og-home.png changes so LinkedIn/Facebook
// treat it as a new URL instead of serving their stale cached image.
const DEFAULT_OG_IMAGE = "/og-home.png?v=3";

export type PageMetadataOptions = {
  locale: Locale;
  /** Path segment after the locale, e.g. "services", "contact", "" for home. */
  path: string;
  title: string;
  description: string;
  /** Absolute or relative URL to override the default og:image. */
  ogImage?: string;
  ogType?: "website" | "article";
};

/**
 * Generates a complete Next.js Metadata object with:
 * - Self-referencing canonical URL
 * - hreflang alternates for es, en, and x-default
 * - OpenGraph image (static default or override)
 */
export function generatePageMetadata(opts: PageMetadataOptions): Metadata {
  const { locale, path, title, description, ogType = "website" } = opts;

  const pathSegment = path ? `/${path}` : "";
  const canonicalUrl = `${SITE_URL}/${locale}${pathSegment}`;
  const ogImage = opts.ogImage ?? `${SITE_URL}${DEFAULT_OG_IMAGE}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        es: `${SITE_URL}/es${pathSegment}`,
        en: `${SITE_URL}/en${pathSegment}`,
        "x-default": `${SITE_URL}/es${pathSegment}`,
      },
    },
    openGraph: {
      title,
      description,
      type: ogType,
      url: canonicalUrl,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      // X cae al og:image cuando falta esta, pero depender de ese respaldo es
      // frágil: si la tarjeta se arma sin imagen queda el texto pelado.
      images: [ogImage],
    },
  };
}
