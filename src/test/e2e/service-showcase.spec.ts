import { expect, test } from '@playwright/test';

for (const locale of ['es', 'en'] as const) {
  for (const width of [390, 1440]) {
    test(`${locale} Web showcase at ${width}px stays isolated from checkout`, async ({ page }) => {
      test.setTimeout(60000);
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const mutations: string[] = [];
      const errors: string[] = [];
      page.on('request', (request) => { if (!['GET', 'HEAD'].includes(request.method())) mutations.push(request.url()); });
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(`/${locale}/services/web`);
      const example = page.getByRole('link', { name: /Explorar el ejemplo|Explore the example/ });
      await expect(example).toBeVisible();
      await example.click();
      await expect(page).toHaveURL(new RegExp(`/demo/${locale}/bruma`), { timeout: 30000 });
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
      await expect(page.getByText(/negocio ficticio|fictional business/)).toBeVisible();
      await page.getByRole('link', { name: /Explorar la carta|Explore the menu/ }).click();
      await expect(page).toHaveURL(/#bruma-menu$/);
      await page.locator('summary').focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('details')).toHaveAttribute('open', '');
      expect(await page.locator('body').evaluate((body) => body.scrollWidth > innerWidth)).toBe(false);
      await page.screenshot({ path: `/tmp/bruma-${locale}-${width}.png`, fullPage: true });
      await page.getByRole('link', { name: /Volver a Web|Back to Web/ }).click();
      const landing = page.getByRole('button', { name: /Landing/ });
      await expect(landing).toHaveAttribute('aria-pressed', 'false');
      expect(mutations).toEqual([]);
      await landing.click();
      await expect(landing).toHaveAttribute('aria-pressed', 'true');
      const checkout = page.getByRole('button', { name: /Contratar y firmar|Get it and sign/ });
      await expect(checkout).toHaveCount(1);
      await expect(page.getByLabel(/Precio y costos de continuidad|Price and ongoing costs/)).toContainText(/USD 40/);
      expect(await page.locator('body').evaluate((body) => body.scrollWidth > innerWidth)).toBe(false);
      await page.screenshot({ path: `/tmp/web-marketing-${locale}-${width}.png`, fullPage: true });
      expect(mutations).toEqual([]);
      expect(errors).toEqual([]);
    });
  }
}
