import { describe, expect, it } from "vitest";
import { defaultLocale, getLocalizedHref, isValidLocale, resolveLocale } from "@/lib/i18n";

describe("i18n helpers", () => {
  it("keeps spanish as the default locale", () => {
    expect(defaultLocale).toBe("es");
    expect(resolveLocale()).toBe("es");
    expect(resolveLocale("fr")).toBe("es");
  });

  it("validates supported locales only", () => {
    expect(isValidLocale("es")).toBe(true);
    expect(isValidLocale("en")).toBe(true);
    expect(isValidLocale("pt")).toBe(false);
  });

  it("rewrites sibling routes when switching locales", () => {
    expect(getLocalizedHref("/es/contact", "en")).toBe("/en/contact");
    expect(getLocalizedHref("/", "en")).toBe("/en");
    expect(getLocalizedHref("/projects", "es")).toBe("/es/projects");
  });
});
