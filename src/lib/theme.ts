export const storageKey = "portfolio-theme";

export const themes = ["dark", "light"] as const;

export type Theme = (typeof themes)[number];

export const defaultTheme: Theme = "dark";

export function isTheme(value: string | null | undefined): value is Theme {
  return value === "dark" || value === "light";
}

export function getNextTheme(theme: Theme): Theme {
  return theme === "dark" ? "light" : "dark";
}

export const themeScript = `(() => {
  const storageKey = "${storageKey}";
  const defaultTheme = "${defaultTheme}";
  const savedTheme = window.localStorage.getItem(storageKey);
  const theme = savedTheme === "light" || savedTheme === "dark" ? savedTheme : defaultTheme;
  document.documentElement.dataset.theme = theme;
})();`;
