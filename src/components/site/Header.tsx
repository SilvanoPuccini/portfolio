"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import LocaleSwitcher from "@/components/site/LocaleSwitcher";
import MobileNav from "@/components/site/MobileNav";
import ThemeToggle from "@/components/site/ThemeToggle";
import { getSiteContent } from "@/content/site";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const menuLabel = {
  es: "Abrir navegación",
  en: "Open navigation",
} as const;

export default function Header({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const content = getSiteContent(locale);
  const [mobileNavOpen, setMobileNavOpen] = useState(true);

  return (
    <header className="fixed inset-x-0 top-0 z-50 w-full border-b border-outline-ghost/12 bg-background/95 shadow-[0_18px_48px_rgba(2,8,23,0.34)] backdrop-blur-xl">
      <div className="site-container">
        <div className="hidden h-20 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-6">
          <div className="min-w-0">
            <Link href={`/${locale}`} className="inline-flex min-w-0 flex-col justify-center">
              <span className="truncate font-display text-lg tracking-editorial text-text-primary sm:text-[1.3rem]">
                {content.metadata.siteName}
              </span>
              <span className="truncate font-mono text-[10px] uppercase tracking-[0.22em] text-text-tertiary sm:text-[11px]">
                {content.metadata.role}
              </span>
            </Link>
          </div>

          <nav
            className="hidden items-center justify-center gap-7 lg:flex xl:gap-8"
            aria-label={locale === "es" ? "Navegación principal" : "Primary navigation"}
          >
            {content.navigation.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    "border-b border-transparent py-2 font-display text-[0.95rem] tracking-tight transition-colors focus-visible:outline-none focus-visible:text-text-primary",
                    isActive ? "border-text-primary text-text-primary" : "text-text-secondary hover:text-text-primary",
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center justify-self-end lg:flex lg:gap-3">
            <LocaleSwitcher locale={locale} />
            <ThemeToggle locale={locale} />
          </div>
        </div>

        <div className="flex min-h-[5.75rem] flex-col justify-center py-3 lg:hidden">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <Link href={`/${locale}`} className="min-w-0 font-display text-[1rem] tracking-tight text-text-primary sm:text-[1.08rem]">
              <span className="block truncate">{content.metadata.siteName}</span>
            </Link>

            <div className="flex items-center justify-self-end gap-2">
              <LocaleSwitcher
                locale={locale}
                className="h-9 w-9 rounded-full border border-outline-ghost/12 bg-surface-elevated/72 text-[10px] tracking-[0.18em]"
              />
              <ThemeToggle locale={locale} className="h-9 w-9 border border-outline-ghost/12 bg-surface-elevated/72" />
              <button
                type="button"
                onClick={() => setMobileNavOpen((current) => !current)}
                className="interactive-control inline-flex h-9 w-9 items-center justify-center border border-outline-ghost/12 bg-surface-elevated/72 text-text-primary"
                aria-label={menuLabel[locale]}
                aria-expanded={mobileNavOpen}
                aria-controls="mobile-nav-row"
              >
                {mobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="pt-3">
            <MobileNav locale={locale} open={mobileNavOpen} />
          </div>
        </div>
      </div>
    </header>
  );
}
