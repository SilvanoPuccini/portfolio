import { expect, test } from "@playwright/test";

function getNavLinks(html: string) {
  const navMatch = html.match(/<nav[^>]*aria-label="Navegación principal"[^>]*>([\s\S]*?)<\/nav>/i);
  const navHtml = navMatch?.[1] ?? "";

  return Array.from(navHtml.matchAll(/<a[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/g)).map((match) => ({
    href: match[1],
    label: match[2].replace(/<[^>]+>/g, "").trim(),
  }));
}

function getHeaderHtml(html: string) {
  return html.match(/<header[\s\S]*?<\/header>/i)?.[0] ?? "";
}

function getFooterHtml(html: string) {
  return html.match(/<footer[\s\S]*?<\/footer>/i)?.[0] ?? "";
}

test.describe("portfolio rebuild http smoke", () => {
  test("redirects / to /es", async ({ request }) => {
    const response = await request.get("/", { maxRedirects: 0 });

    expect(response.status()).toBe(307);
    expect(response.headers().location).toBe("/es");
  });

  test("renders spanish primary navigation with blog and without cv", async ({ request }) => {
    const response = await request.get("/es");
    const html = await response.text();
    const links = getNavLinks(html);
    const headerHtml = getHeaderHtml(html);
    const footerHtml = getFooterHtml(html);

    expect(response.ok()).toBeTruthy();
    expect(links.length).toBeGreaterThan(0);

    expect(links).toEqual(
      expect.arrayContaining([
        { label: "Inicio", href: "/es" },
        { label: "Sobre mí", href: "/es/about" },
        { label: "Proyectos", href: "/es/projects" },
        { label: "Servicios", href: "/es/services" },
        { label: "Blog", href: "/es/blog" },
        { label: "Contacto", href: "/es/contact" },
      ]),
    );
    expect(links.some((link) => link.label === "CV")).toBeFalsy();

    expect(headerHtml).not.toContain('href="/cv"');
    expect(headerHtml).not.toContain("Descargar CV");
    expect(headerHtml).not.toContain("Hablemos");
    expect(headerHtml).toContain("border-b");
    expect(headerHtml).not.toContain("rounded-[1.5rem]");

    expect(footerHtml).toContain("Código");
    expect(footerHtml).toContain("LinkedIn");
    expect(footerHtml).toContain("Email");
    expect(footerHtml).toContain("Discord");
    expect(footerHtml).not.toContain("Portfolio");
  });

  test("serves the real pdf from /cv", async ({ request }) => {
    const response = await request.get("/cv");
    const pdf = Buffer.from(await response.body());

    expect(response.ok()).toBeTruthy();
    expect(response.headers()["content-type"]).toContain("application/pdf");
    expect(response.headers()["content-disposition"]).toContain(
      'filename="CV_Silvano_Puccini_FullStack.pdf"',
    );
    expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
  });

  test("exposes cv access from /es/about", async ({ request }) => {
    const response = await request.get("/es/about");
    const html = await response.text();

    expect(response.ok()).toBeTruthy();
    expect(html).toContain('id="cv"');
    expect(html).toContain('href="/cv"');
    expect(html).toContain("Descargar CV");
  });

  test("renders /es/blog with explicit placeholder messaging", async ({ request }) => {
    const response = await request.get("/es/blog");
    const html = await response.text();

    expect(response.ok()).toBeTruthy();
    expect(html).toContain("Placeholder temporal");
    expect(html).toContain("Suscribite al radar");
    expect(html).toContain("Blog activo en navegación");
  });

  test("renders /es/contact with visible feedback states", async ({ request }) => {
    const response = await request.get("/es/contact");
    const html = await response.text();

    expect(response.ok()).toBeTruthy();
    expect(html).toContain("Enviar propuesta");
    expect(html).toContain("Mensaje enviado. Si todo salió bien, te responderé por email.");
    expect(html).toContain("Revisá los campos e intentá nuevamente. Si persiste, podés escribirme directo por email.");
    expect(html).toContain("Listo para recibir tu mensaje");
  });
});
