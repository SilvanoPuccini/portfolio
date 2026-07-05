import { describe, expect, it } from "vitest";
import { generatePageMetadata } from "@/lib/metadata";

const SITE_URL = "https://silvanopuccini.dev";

describe("generatePageMetadata", () => {
  describe("canonical URL", () => {
    it("builds canonical for a top-level path", () => {
      const meta = generatePageMetadata({
        locale: "es",
        path: "services",
        title: "Test title",
        description: "Test description",
      });

      expect(meta.alternates?.canonical).toBe(`${SITE_URL}/es/services`);
    });

    it("builds canonical for the home page (empty path)", () => {
      const meta = generatePageMetadata({
        locale: "en",
        path: "",
        title: "Home",
        description: "Home page description",
      });

      expect(meta.alternates?.canonical).toBe(`${SITE_URL}/en`);
    });

    it("builds canonical for a nested path", () => {
      const meta = generatePageMetadata({
        locale: "es",
        path: "services/agendar",
        title: "Schedule",
        description: "Schedule a call",
      });

      expect(meta.alternates?.canonical).toBe(`${SITE_URL}/es/services/agendar`);
    });
  });

  describe("hreflang alternates", () => {
    it("includes es, en, and x-default alternates", () => {
      const meta = generatePageMetadata({
        locale: "es",
        path: "contact",
        title: "Contact",
        description: "Contact page",
      });

      const languages = meta.alternates?.languages as Record<string, string>;
      expect(languages).toBeDefined();
      expect(languages["es"]).toBe(`${SITE_URL}/es/contact`);
      expect(languages["en"]).toBe(`${SITE_URL}/en/contact`);
      expect(languages["x-default"]).toBe(`${SITE_URL}/es/contact`);
    });

    it("produces correct hreflang URLs for en locale", () => {
      const meta = generatePageMetadata({
        locale: "en",
        path: "projects",
        title: "Projects",
        description: "Projects page",
      });

      const languages = meta.alternates?.languages as Record<string, string>;
      expect(languages["es"]).toBe(`${SITE_URL}/es/projects`);
      expect(languages["en"]).toBe(`${SITE_URL}/en/projects`);
    });

    it("x-default always points to the es locale route", () => {
      const metaEn = generatePageMetadata({
        locale: "en",
        path: "blog",
        title: "Blog",
        description: "Blog page",
      });

      const languages = metaEn.alternates?.languages as Record<string, string>;
      expect(languages["x-default"]).toContain("/es/");
    });
  });

  describe("og:image", () => {
    it("uses the default og image when no override is provided", () => {
      const meta = generatePageMetadata({
        locale: "es",
        path: "about",
        title: "About",
        description: "About me",
      });

      const images = (meta.openGraph?.images ?? []) as Array<{ url: string }>;
      expect(images.length).toBeGreaterThan(0);
      expect(images[0].url).toContain("silvanopuccini.dev");
      expect(images[0].url).toMatch(/og-default\.(png|svg)$/);
    });

    it("uses the override og image when provided", () => {
      const customImage = "https://silvanopuccini.dev/og-custom.png";
      const meta = generatePageMetadata({
        locale: "es",
        path: "projects",
        title: "Projects",
        description: "Projects",
        ogImage: customImage,
      });

      const images = (meta.openGraph?.images ?? []) as Array<{ url: string }>;
      expect(images[0].url).toBe(customImage);
    });

    it("includes width and height on og image", () => {
      const meta = generatePageMetadata({
        locale: "en",
        path: "services",
        title: "Services",
        description: "Services",
      });

      const images = (meta.openGraph?.images ?? []) as Array<{ url: string; width: number; height: number }>;
      expect(images[0].width).toBe(1200);
      expect(images[0].height).toBe(630);
    });
  });

  describe("openGraph fields", () => {
    it("sets og type to website by default", () => {
      const meta = generatePageMetadata({
        locale: "es",
        path: "",
        title: "Home",
        description: "Home",
      });

      // openGraph is typed as a union — cast to access type
      const og = meta.openGraph as { type?: string } | undefined;
      expect(og?.type).toBe("website");
    });

    it("respects ogType override", () => {
      const meta = generatePageMetadata({
        locale: "en",
        path: "blog/my-post",
        title: "Article",
        description: "An article",
        ogType: "article",
      });

      const og = meta.openGraph as { type?: string } | undefined;
      expect(og?.type).toBe("article");
    });

    it("sets og url equal to canonical", () => {
      const meta = generatePageMetadata({
        locale: "es",
        path: "services",
        title: "Services",
        description: "Services description",
      });

      const og = meta.openGraph as { url?: string } | undefined;
      expect(og?.url).toBe(meta.alternates?.canonical);
    });
  });

  describe("title and description", () => {
    it("passes through title and description", () => {
      const title = "Silvano Puccini | Developer";
      const description = "A full stack developer portfolio.";

      const meta = generatePageMetadata({ locale: "es", path: "", title, description });

      expect(meta.title).toBe(title);
      expect(meta.description).toBe(description);
    });
  });
});
