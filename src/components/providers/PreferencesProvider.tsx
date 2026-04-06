"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { dictionary, type Language } from "@/lib/i18n";

type Theme = "dark" | "light";

type PreferencesContextType = {
  language: Language;
  theme: Theme;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  toggleTheme: () => void;
  t: (typeof dictionary)[Language];
};

const PreferencesContext = createContext<PreferencesContextType | null>(null);

export default function PreferencesProvider({ children }: PropsWithChildren) {
  const [language, setLanguageState] = useState<Language>("es");
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const storedLang = window.localStorage.getItem("language") as Language | null;
    const storedTheme = window.localStorage.getItem("theme") as Theme | null;

    if (storedLang === "es" || storedLang === "en") setLanguageState(storedLang);
    if (storedTheme === "light" || storedTheme === "dark") setTheme(storedTheme);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    window.localStorage.setItem("language", lang);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === "es" ? "en" : "es");
  }, [language, setLanguage]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  const value = useMemo(
    () => ({
      language,
      theme,
      setLanguage,
      toggleLanguage,
      toggleTheme,
      t: dictionary[language],
    }),
    [language, theme, setLanguage, toggleLanguage, toggleTheme],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);

  if (!context) {
    throw new Error("usePreferences must be used within PreferencesProvider");
  }

  return context;
}
