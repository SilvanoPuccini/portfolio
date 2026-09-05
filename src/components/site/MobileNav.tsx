"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getSiteContent } from "@/content/site";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const copy = {
  es: {
    navigation: "Navegación móvil",
  },
  en: {
    navigation: "Mobile navigation",
  },
} as const;

const compactLabels = {
  es: {
    home: "Inicio",
    about: "Sobre mí",
    projects: "Proyectos",
    services: "Servicios",
    blog: "Blog",
    contact: "Contacto",
  },
  en: {
    home: "Home",
    about: "About",
    projects: "Projects",
    services: "Services",
    blog: "Blog",
    contact: "Contact",
  },
} as const;

export default function MobileNav({ locale, open }: { locale: Locale; open: boolean }) {
  const pathname = usePathname();
  const content = getSiteContent(locale);
  const labels = copy[locale];
  const mobileLabels = compactLabels[locale];

  if (!open) {
    return null;
  }

  return (
    <nav
      id="mobile-nav-row"
      className="grid grid-cols-3 items-center gap-x-1 gap-y-1.5 border-t border-outline-ghost/10 pt-3 sm:grid-cols-6"
      aria-label={labels.navigation}
    >
      {content.navigation.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "inline-flex min-w-0 items-center justify-center border-b border-transparent px-0 py-1 text-center font-display text-[0.72rem] tracking-tight text-text-secondary transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:text-text-primary sm:text-[0.78rem]",
              isActive ? "border-text-primary text-text-primary" : "hover:text-text-primary",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {mobileLabels[item.key]}
          </Link>
        );
      })}
    </nav>
  );
}
