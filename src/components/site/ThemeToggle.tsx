"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const copy = {
  es: {
    label: "Cambiar tema",
    light: "Light",
    dark: "Dark",
  },
  en: {
    label: "Toggle theme",
    light: "Light",
    dark: "Dark",
  },
} as const;

export default function ThemeToggle({ locale, className }: { locale: Locale; className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const content = copy[locale];
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={content.label}
      aria-pressed={!isDark}
      title={isDark ? content.light : content.dark}
      className={cn(
        "interactive-control inline-flex h-10 w-10 items-center justify-center rounded-full border border-outline-ghost/15 bg-surface-elevated/78 text-text-primary",
        className,
      )}
    >
      {isDark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
    </button>
  );
}
