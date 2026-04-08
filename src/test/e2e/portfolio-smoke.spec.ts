import { expect, test, type Page } from "@playwright/test";

async function waitForClientInteractivity(page: Page) {
  await expect(page.locator("html")).toHaveAttribute("data-ui-ready", "true", { timeout: 15000 });
}

test.describe("portfolio rebuild smoke", () => {
  test("redirects / to /es and keeps the main navigation live", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/es$/);
    await waitForClientInteractivity(page);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    const nav = page.getByRole("navigation", { name: "Navegación principal" });

    await expect(nav.getByRole("link", { name: "Inicio" })).toHaveAttribute("href", "/es");
    await expect(nav.getByRole("link", { name: "Sobre mí" })).toHaveAttribute("href", "/es/about");
    await expect(nav.getByRole("link", { name: "Proyectos" })).toHaveAttribute("href", "/es/projects");
    await expect(nav.getByRole("link", { name: "Servicios" })).toHaveAttribute("href", "/es/services");
    await expect(nav.getByRole("link", { name: "Blog" })).toHaveAttribute("href", "/es/blog");
    await expect(nav.getByRole("link", { name: "Contacto" })).toHaveAttribute("href", "/es/contact");
    await expect(nav.getByRole("link", { name: "CV" })).toHaveCount(0);
    await expect(page.locator("header").getByRole("link", { name: /Descargar CV/i })).toHaveCount(0);

    await nav.getByRole("link", { name: "Blog" }).click();

    await expect(page).toHaveURL(/\/es\/blog$/);
    await expect(page.getByRole("heading", { level: 1, name: /Arquitectura Digital/i })).toBeVisible();
    await expect(page.getByText("Placeholder temporal").first()).toBeVisible();
    await expect(page.getByText("Suscribite al radar")).toBeVisible();
    await expect(page.getByRole("contentinfo").getByRole("link", { name: /Portfolio/i })).toHaveCount(0);
    await expect(page.getByRole("contentinfo").getByRole("link", { name: /GitHub/i })).toBeVisible();
    await expect(page.getByRole("contentinfo").getByRole("link", { name: /LinkedIn/i })).toBeVisible();
  });

  test("switches locale and theme, and keeps cv flows working from about", async ({ page }) => {
    await page.goto("/es/about");

    await waitForClientInteractivity(page);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.getByRole("button", { name: "Cambiar tema" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    await expect(page.getByRole("heading", { level: 2, name: "Disponible para construir productos reales." })).toBeVisible();
    await expect(page.getByRole("link", { name: "Descargar CV" }).first()).toHaveAttribute("href", "/cv");

    await page.getByRole("link", { name: "EN", exact: true }).click();
    await expect(page).toHaveURL(/\/en\/about$/);
    await expect(page.getByRole("heading", { level: 1, name: /Technical profile/i })).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: "Download CV" }).first().click(),
    ]);

    await expect(download.suggestedFilename()).toBe("CV_Silvano_Puccini_FullStack.pdf");

    await page.goto("/en/cv");
    await expect(page).toHaveURL(/\/en\/about#cv$/);
    await expect(page.getByRole("heading", { level: 2, name: "Available to build real products." })).toBeVisible();
  });

  test("shows spanish contact feedback for validation and successful submission", async ({ page }) => {
    await page.route("https://formspree.io/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto("/es/contact");

    await waitForClientInteractivity(page);

    const form = page.locator("form");
    const statusPanel = page.locator("#contact-form-status");

    await page.getByRole("button", { name: "Enviar propuesta" }).click();
    await expect(statusPanel).toContainText("Revisión requerida");
    await expect(statusPanel).toContainText("Revisá los campos e intentá nuevamente. Si persiste, podés escribirme directo por email.");
    await expect(form.getByText("Este campo es obligatorio.")).toHaveCount(4);

    await page.getByLabel("Nombre").fill("Silvano Puccini");
    await page.getByLabel("Email").fill("silvano@example.com");
    await page.getByLabel("Asunto").fill("Portfolio QA");
    await page.getByLabel("Mensaje").fill("Running the final smoke suite.");
    await page.getByRole("button", { name: "Enviar propuesta" }).click();

    await expect(page.getByText("Mensaje entregado")).toBeVisible();
    await expect(page.getByText("Mensaje enviado. Si todo salió bien, te responderé por email.")).toBeVisible();
  });
});
