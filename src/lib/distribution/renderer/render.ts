import { launchBrowser } from './puppeteer-setup';
import { renderLinkedInSlide } from './linkedin-templates';
import { renderInstagramSlide } from './instagram-templates';
import { getSupabaseAdmin } from '@/lib/supabase';
import type { Slide, LinkedInSlide } from '../types';

// ── Render a PNG buffer per slide ─────────────────────────────

export interface RenderResult {
  buffers: Buffer[];
  failedIndexes: number[];
}

export async function renderCarouselImages(
  slides: LinkedInSlide[] | Slide[],
  platform: 'linkedin' | 'instagram'
): Promise<RenderResult> {
  const browser = await launchBrowser();

  try {
    const results = await Promise.allSettled(
      slides.map(async (slide, i) => {
        const page = await browser.newPage();
        await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 2 });

        const html =
          platform === 'linkedin'
            ? renderLinkedInSlide(slide as LinkedInSlide, i + 1, slides.length)
            : renderInstagramSlide(slide as Slide, i + 1, slides.length);

        await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 15000 });
        const screenshot = await page.screenshot({ type: 'png' });
        await page.close();
        return Buffer.from(screenshot);
      })
    );

    const buffers: Buffer[] = [];
    const failedIndexes: number[] = [];

    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        buffers[i] = result.value;
      } else {
        console.error(`[render] Slide ${i} failed:`, result.reason);
        failedIndexes.push(i);
      }
    });

    if (failedIndexes.length > 0) {
      console.warn(`[render] ${failedIndexes.length} slide(s) fallidos: ${failedIndexes.join(', ')}`);
    }

    return { buffers, failedIndexes };
  } finally {
    await browser.close();
  }
}

// ── Upload buffers to Supabase Storage ────────────────────────

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? 'distributions';

export async function uploadCarouselImages(
  distributionId: string,
  platform: 'linkedin' | 'instagram',
  buffers: Buffer[]
): Promise<string[]> {
  const db = getSupabaseAdmin();

  const results = await Promise.allSettled(
    buffers.map(async (buf, i) => {
      const path = `${distributionId}/${platform}/slide-${String(i + 1).padStart(2, '0')}.png`;

      const { error } = await db.storage.from(BUCKET).upload(path, buf, {
        contentType: 'image/png',
        upsert: true,
      });

      if (error) throw new Error(`Storage upload failed (${path}): ${error.message}`);

      const { data } = db.storage.from(BUCKET).getPublicUrl(path);
      return data.publicUrl;
    })
  );

  const urls: string[] = [];
  const failedPaths: number[] = [];

  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      urls[i] = result.value;
    } else {
      console.error(`[upload] Slide ${i} upload failed:`, result.reason);
      failedPaths.push(i);
    }
  });

  if (failedPaths.length > 0) {
    console.warn(`[upload] ${failedPaths.length} upload(s) fallidos: ${failedPaths.join(', ')}`);
  }

  return urls.filter(Boolean);
}

// ── Render + upload in one call ───────────────────────────────

export async function renderAndUpload(
  distributionId: string,
  slides: LinkedInSlide[] | Slide[],
  platform: 'linkedin' | 'instagram'
): Promise<{ urls: string[]; failedIndexes: number[] }> {
  const { buffers, failedIndexes } = await renderCarouselImages(slides, platform);
  const urls = await uploadCarouselImages(distributionId, platform, buffers.filter(Boolean));
  return { urls, failedIndexes };
}
