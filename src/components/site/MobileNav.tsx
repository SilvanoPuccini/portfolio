"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { getSiteContent } from "@/content/site";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const copy = {
  es: { navigation: "Navegación móvil", close: "Cerrar navegación" },
  en: { navigation: "Mobile navigation", close: "Close navigation" },
} as const;

export default function MobileNav({
  locale,
  open,
  onClose,
}: {
  locale: Locale;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const content = getSiteContent(locale);
  const labels = copy[locale];

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  // Close on route change
  useEffect(() => {
    onClose();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.nav
            className="absolute right-0 top-0 flex h-full w-72 flex-col border-l border-outline-ghost/12 bg-background p-6"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            aria-label={labels.navigation}
          >
            <div className="mb-8 flex items-center justify-between">
              <span className="font-display text-sm tracking-editorial text-text-tertiary">
                {content.metadata.siteName}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="interactive-control inline-flex h-9 w-9 items-center justify-center rounded-full border border-outline-ghost/12 text-text-primary"
                aria-label={labels.close}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-1">
              {content.navigation.map((item) => {
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={cn(
                      "rounded-lg px-3 py-3 font-display text-[1.05rem] tracking-tight transition-colors",
                      isActive
                        ? "bg-surface-elevated/60 text-text-primary"
                        : "text-text-secondary hover:bg-surface-elevated/30 hover:text-text-primary",
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </motion.nav>
        </div>
      )}
    </AnimatePresence>
  );
}
