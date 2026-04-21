import { launchBrowser } from './puppeteer-setup';
import { renderLinkedInSlide } from './linkedin-templates';
import { renderInstagramSlide } from './instagram-templates';
import { getSupabaseAdmin } from '@/lib/supabase';
import type { Slide, LinkedInSlide } from '../types';

// ── Render a PNG buffer per slide ─────────────────────────────

export async function renderCarouselImages(
  slides: LinkedInSlide[] | Slide[],
  platform: 'linkedin' | 'instagram'
): Promise<Buffer[]> {
  const browser = await launchBrowser();
  const images: Buffer[] = [];

  try {
    for (let i = 0; i < slides.length; i++) {
      const page = await browser.newPage();
      await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 2 });

      const html =
        platform === 'linkedin'
          ? renderLinkedInSlide(slides[i] as LinkedInSlide, i + 1, slides.length)
          : renderInstagramSlide(slides[i] as Slide, i + 1, slides.length);

      // networkidle0 espera a que las Google Fonts carguen
      await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 15000 });

      const screenshot = await page.screenshot({ type: 'png' });
      images.push(Buffer.from(screenshot));
      await page.close();
    }
  } finally {
    await browser.close();
  }

  return images;
}

// ── Upload buffers to Supabase Storage ────────────────────────

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? 'distributions';

export async function uploadCarouselImages(
  distributionId: string,
  platform: 'linkedin' | 'instagram',
  buffers: Buffer[]
): Promise<string[]> {
  const db = getSupabaseAdmin();
  const urls: string[] = [];

  for (let i = 0; i < buffers.length; i++) {
    const path = `${distributionId}/${platform}/slide-${String(i + 1).padStart(2, '0')}.png`;

    const { error } = await db.storage.from(BUCKET).upload(path, buffers[i], {
      contentType: 'image/png',
      upsert: true,
    });

    if (error) throw new Error(`Storage upload failed (${path}): ${error.message}`);

    const { data } = db.storage.from(BUCKET).getPublicUrl(path);
    urls.push(data.publicUrl);
  }

  return urls;
}

// ── Render + upload in one call ───────────────────────────────

export async function renderAndUpload(
  distributionId: string,
  slides: LinkedInSlide[] | Slide[],
  platform: 'linkedin' | 'instagram'
): Promise<string[]> {
  const buffers = await renderCarouselImages(slides, platform);
  return uploadCarouselImages(distributionId, platform, buffers);
}
