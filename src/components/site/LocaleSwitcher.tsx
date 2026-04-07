"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getLocalizedHref, localeLabels, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function LocaleSwitcher({ locale, className }: { locale: Locale; className?: string }) {
  const pathname = usePathname();
  const nextLocale = locale === "es" ? "en" : "es";
  const title = locale === "es" ? "Cambiar idioma a inglés" : "Switch language to Spanish";

  return (
    <Link
      href={getLocalizedHref(pathname, nextLocale)}
      title={title}
      className={cn(
        "interactive-control inline-flex h-10 w-10 items-center justify-center rounded-xl border border-outline-ghost/15 bg-surface-elevated/78 font-mono text-[11px] uppercase tracking-[0.22em] text-text-primary",
        className,
      )}
    >
      {localeLabels[nextLocale]}
    </Link>
  );
}
