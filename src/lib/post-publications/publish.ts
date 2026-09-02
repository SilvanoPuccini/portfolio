import { getSupabaseAdmin } from '@/lib/supabase';
import { getBlogPostBySlug } from '@/lib/mdx';
import { sendPostNewsletter } from '@/lib/newsletter/send-post-newsletter';
import type { PostPublication } from './types';

export type PublishFailure =
  | 'missing-mdx'
  | 'not-found'
  | 'invalid-state'
  | 'db-error'
  | 'notify-failed';

export type PublishOutcome =
  | { ok: true; slug: string; notified: boolean; alreadyPublished: boolean }
  | { ok: false; slug: string; reason: PublishFailure; detail: string };

/**
 * Única ruta de código para publicar un post. La usan el botón "Publicar
 * ahora" del admin y el cron dominical, así que ambos caminos se comportan
 * igual: mismo orden, misma idempotencia, mismos errores.
 *
 * Orden deliberado:
 * 1. Verificar que el .mdx exista — publicar algo sin archivo deja una ruta
 *    en 404 y un mail apuntando a la nada.
 * 2. Compare-and-swap de preaprobado -> publicado. Si otra invocación ganó
 *    la carrera, no se vuelve a publicar ni a mandar el mail.
 * 3. Recién ahí el newsletter, y solo si nunca se mandó (notified_at null).
 *    Si falla el envío el post queda publicado y el mail pendiente: el cron
 *    lo reintenta después, sin volver a tocar el estado.
 */
export async function publishPost(slug: string): Promise<PublishOutcome> {
  const db = getSupabaseAdmin();

  const { data: existing, error: readError } = await db
    .from('post_publications')
    .select('*')
    .eq('post_slug', slug)
    .maybeSingle<PostPublication>();

  if (readError) {
    return { ok: false, slug, reason: 'db-error', detail: readError.message };
  }
  if (!existing) {
    return { ok: false, slug, reason: 'not-found', detail: 'No está en la agenda' };
  }

  // 1. El .mdx tiene que existir antes de tocar nada.
  const post = await getBlogPostBySlug(slug);
  if (!post) {
    return {
      ok: false,
      slug,
      reason: 'missing-mdx',
      detail: 'Todavía no existe el .mdx de este post — falta hardcodearlo y deployarlo',
    };
  }

  // 2. Compare-and-swap: solo un preaprobado pasa a publicado.
  let alreadyPublished = existing.status === 'publicado';

  if (!alreadyPublished) {
    if (existing.status !== 'preaprobado') {
      return {
        ok: false,
        slug,
        reason: 'invalid-state',
        detail: `No se puede publicar desde "${existing.status}": primero tiene que estar preaprobado`,
      };
    }

    const now = new Date().toISOString();
    const { data: swapped, error: swapError } = await db
      .from('post_publications')
      .update({ status: 'publicado', published_at: now, updated_at: now })
      .eq('post_slug', slug)
      .eq('status', 'preaprobado')
      .select('post_slug');

    if (swapError) {
      return { ok: false, slug, reason: 'db-error', detail: swapError.message };
    }

    // 0 filas = otra invocación lo publicó en el medio. No es error, pero
    // tampoco corresponde volver a mandar el mail desde acá.
    if (!swapped || swapped.length === 0) {
      alreadyPublished = true;
    }
  }

  // 3. Newsletter, solo una vez.
  const shouldNotify = existing.notify_subscribers && existing.notified_at === null;

  if (!shouldNotify) {
    return { ok: true, slug, notified: false, alreadyPublished };
  }

  const result = await sendPostNewsletter(slug);

  if (!result.ok) {
    await db
      .from('post_publications')
      .update({
        notify_attempts: (existing.notify_attempts ?? 0) + 1,
        notify_error: result.error,
        updated_at: new Date().toISOString(),
      })
      .eq('post_slug', slug);

    return { ok: false, slug, reason: 'notify-failed', detail: result.error };
  }

  await db
    .from('post_publications')
    .update({
      notified_at: new Date().toISOString(),
      notify_attempts: (existing.notify_attempts ?? 0) + 1,
      notify_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq('post_slug', slug);

  return { ok: true, slug, notified: true, alreadyPublished };
}
