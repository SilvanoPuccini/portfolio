import { getSupabaseAdmin } from '@/lib/supabase';
import { getBlogPostBySlug } from '@/lib/blog';
import { generateDistribution } from './ai/generate';
import { renderAndUpload } from './renderer/render';
import type { Distribution, DistributionStatus } from './types';

const SITE_URL = process.env.DISTRIBUTION_BASE_URL ?? 'https://silvanopuccini.dev';

// ── Helpers ──────────────────────────────────────────────────

async function log(
  distributionId: string,
  step: string,
  level: 'info' | 'warn' | 'error',
  message: string,
  metadata?: Record<string, unknown>
) {
  const db = getSupabaseAdmin();
  await db.from('distribution_logs').insert({
    distribution_id: distributionId,
    step,
    level,
    message,
    metadata: metadata ?? null,
  });
}

async function saveVersion(distributionId: string, dist: Distribution) {
  const db = getSupabaseAdmin();
  const { count } = await db
    .from('distribution_versions')
    .select('*', { count: 'exact', head: true })
    .eq('distribution_id', distributionId);

  await db.from('distribution_versions').insert({
    distribution_id: distributionId,
    version_number: (count ?? 0) + 1,
    linkedin_content: dist.linkedin_content,
    instagram_content: dist.instagram_content,
    twitter_content: dist.twitter_content,
    changed_by: 'user',
  });
}

// ── Crear distribución nueva ──────────────────────────────────

export async function createDistribution(slug: string): Promise<string> {
  const db = getSupabaseAdmin();

  const post = getBlogPostBySlug(slug);
  if (!post) throw new Error(`Post no encontrado: ${slug}`);

  // Insertar registro vacío para tener el ID desde el principio
  const { data: row, error: insertError } = await db
    .from('distributions')
    .insert({
      post_slug: slug,
      post_title: post.title,
      status: 'draft' as DistributionStatus,
    })
    .select('id')
    .single();

  if (insertError || !row) {
    throw new Error(`Error al crear distribución: ${insertError?.message}`);
  }

  const id: string = row.id;

  try {
    await log(id, 'ai_generate', 'info', 'Iniciando generación con Gemini');

    const mdxContent = `---\ntitle: ${post.title}\ncategory: ${post.category}\nexcerpt: ${post.excerpt}\n---\n\n${post.content}`;
    const postUrl = `${SITE_URL}/es/blog/${slug}`;

    const { content, metadata } = await generateDistribution(mdxContent, postUrl);

    await log(id, 'ai_generate', 'info', 'Contenido generado exitosamente', {
      tokens: metadata.tokens_used,
      attempts: metadata.attempts,
      model: metadata.model,
    });

    // Guardar contenido AI antes de renderizar
    const { error: updateError } = await db
      .from('distributions')
      .update({
        linkedin_content: content.linkedin,
        instagram_content: content.instagram,
        twitter_content: content.twitter,
        ai_metadata: metadata,
        status: 'draft',
        error_message: null,
      })
      .eq('id', id);

    if (updateError) throw new Error(`Error al guardar contenido: ${updateError.message}`);

    await log(id, 'db_save', 'info', 'Contenido AI guardado en base de datos');

    // Render imágenes — opcional, no bloquea si falla
    let linkedinImages: string[] = [];
    let instagramImages: string[] = [];

    try {
      await log(id, 'render_linkedin', 'info', 'Renderizando slides LinkedIn');
      linkedinImages = await renderAndUpload(id, content.linkedin.slides, 'linkedin');
      await log(id, 'render_linkedin', 'info', `${linkedinImages.length} slides LinkedIn renderizados`);

      await log(id, 'render_instagram', 'info', 'Renderizando slides Instagram');
      instagramImages = await renderAndUpload(id, content.instagram.slides, 'instagram');
      await log(id, 'render_instagram', 'info', `${instagramImages.length} slides Instagram renderizados`);

      await db.from('distributions')
        .update({ linkedin_images: linkedinImages, instagram_images: instagramImages })
        .eq('id', id);

      await log(id, 'upload_storage', 'info', 'Imágenes subidas a Supabase Storage');
    } catch (renderErr) {
      const msg = renderErr instanceof Error ? renderErr.message : String(renderErr);
      await log(id, 'render_linkedin', 'warn', `Render omitido — se puede regenerar después: ${msg}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    await db.from('distributions').update({
      status: 'error',
      error_message: message,
    }).eq('id', id);

    await log(id, 'ai_generate', 'error', `Generación fallida: ${message}`);
    throw err;
  }

  return id;
}

// ── Regenerar (total o parcial) ───────────────────────────────

export async function regenerateDistribution(
  id: string,
  scope: 'all' | 'linkedin' | 'instagram' | 'twitter' | 'caption' | 'hashtags' | 'slide',
  options?: { platform?: 'linkedin' | 'instagram'; slideIndex?: number }
): Promise<void> {
  const db = getSupabaseAdmin();

  const { data: existing, error: fetchError } = await db
    .from('distributions')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !existing) throw new Error(`Distribución no encontrada: ${id}`);

  // Guardar versión antes de modificar
  await saveVersion(id, existing as Distribution);

  const post = getBlogPostBySlug(existing.post_slug);
  if (!post) throw new Error(`Post no encontrado: ${existing.post_slug}`);

  await log(id, 'ai_generate', 'info', `Regenerando scope: ${scope}`, options);

  const mdxContent = `---\ntitle: ${post.title}\ncategory: ${post.category}\nexcerpt: ${post.excerpt}\n---\n\n${post.content}`;
  const postUrl = `${SITE_URL}/es/blog/${existing.post_slug}`;

  const { content, metadata } = await generateDistribution(mdxContent, postUrl);

  const updates: Record<string, unknown> = { ai_metadata: metadata };

  switch (scope) {
    case 'all':
      updates.linkedin_content = content.linkedin;
      updates.instagram_content = content.instagram;
      updates.twitter_content = content.twitter;
      break;
    case 'linkedin':
      updates.linkedin_content = content.linkedin;
      break;
    case 'instagram':
      updates.instagram_content = content.instagram;
      break;
    case 'twitter':
      updates.twitter_content = content.twitter;
      break;
    case 'caption': {
      const platform = options?.platform ?? 'linkedin';
      const current = platform === 'linkedin'
        ? existing.linkedin_content
        : existing.instagram_content;
      const fresh = platform === 'linkedin' ? content.linkedin : content.instagram;
      updates[`${platform}_content`] = { ...current, caption: fresh.caption };
      break;
    }
    case 'hashtags': {
      const platform = options?.platform ?? 'linkedin';
      const current = platform === 'linkedin'
        ? existing.linkedin_content
        : existing.instagram_content;
      const fresh = platform === 'linkedin' ? content.linkedin : content.instagram;
      updates[`${platform}_content`] = { ...current, hashtags: fresh.hashtags };
      break;
    }
    case 'slide': {
      const platform = options?.platform ?? 'linkedin';
      const idx = options?.slideIndex ?? 0;
      const current = platform === 'linkedin'
        ? { ...existing.linkedin_content }
        : { ...existing.instagram_content };
      const fresh = platform === 'linkedin' ? content.linkedin : content.instagram;
      current.slides = [...current.slides];
      current.slides[idx] = fresh.slides[idx] ?? current.slides[idx];
      updates[`${platform}_content`] = current;
      break;
    }
  }

  const { error: updateError } = await db
    .from('distributions')
    .update(updates)
    .eq('id', id);

  if (updateError) throw new Error(`Error al actualizar: ${updateError.message}`);

  await log(id, 'ai_generate', 'info', `Regeneración scope "${scope}" completada`);
}
