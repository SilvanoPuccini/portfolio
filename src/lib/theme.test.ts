import { describe, expect, it } from "vitest";
import { defaultTheme, getNextTheme, isTheme, storageKey, themeScript } from "@/lib/theme";

describe("theme helpers", () => {
  it("starts in dark mode", () => {
    expect(defaultTheme).toBe("dark");
    expect(storageKey).toBe("portfolio-theme");
  });

  it("validates allowed themes and toggles correctly", () => {
    expect(isTheme("dark")).toBe(true);
    expect(isTheme("light")).toBe(true);
    expect(isTheme("system")).toBe(false);
    expect(getNextTheme("dark")).toBe("light");
    expect(getNextTheme("light")).toBe("dark");
  });

  it("keeps the theme bootstrap script aligned with the storage contract", () => {
    expect(themeScript).toContain(storageKey);
    expect(themeScript).toContain(defaultTheme);
    expect(themeScript).toContain("document.documentElement.dataset.theme = theme");
  });
});
