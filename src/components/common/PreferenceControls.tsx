"use client";

import { Languages, Moon, Sun } from "lucide-react";
import { usePreferences } from "@/components/providers/PreferencesProvider";

export default function PreferenceControls() {
  const { language, theme, toggleLanguage, toggleTheme } = usePreferences();

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggleLanguage}
        className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-secondary"
      >
        <Languages size={14} />
        {language === "es" ? "EN" : "ES"}
      </button>

      <button
        type="button"
        onClick={toggleTheme}
        className="inline-flex items-center rounded-lg border border-white/20 p-2 text-slate-200 hover:border-secondary"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
      </button>
    </div>
  );
}
