import { getSupabaseAdmin } from '@/lib/supabase';
import { X_USERNAME } from './author-profile';
import { publishThread, threadUrl } from './client';
import { planWeek } from './gemini';
import { fingerprint, orchestrateThread } from './orchestrate';
import { allowedUrls, createWeek, siblingsOf, updateThread } from './repository';
import { xScheduleFor } from './scheduling';
import type { XThread } from './types';

/**
 * Las operaciones de negocio del circuito de X, sin HTTP.
 *
 * El admin y el cron llaman a las mismas funciones: si el botón manual y el
 * automático tomaran caminos distintos, uno de los dos iría a quedar sin
 * arreglar cuando cambie una regla.
 */

async function loadArticle(postSlug: string) {
  const { data, error } = await getSupabaseAdmin()
    .from('post_publications')
    .select('post_slug, raw_title, raw_content, scheduled_at')
    .eq('post_slug', postSlug).is('deleted_at', null).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('El post del blog no está en la agenda');
  if (!data.raw_content?.trim()) throw new Error('El post del blog todavía no tiene texto cargado');
  return data as { post_slug: string; raw_title: string; raw_content: string; scheduled_at: string };
}

/**
 * Arma la semana de un post: pide el guion de ángulos y crea un turno por día.
 * El texto de cada hilo se escribe después, día por día.
 */
export async function planWeekFor(postSlug: string) {
  const article = await loadArticle(postSlug);
  const { angles, tokens } = await planWeek(article.raw_title, article.raw_content);
  if (angles.length === 0) {
    throw new Error('El artículo no dio ningún ángulo distinto para publicar');
  }
  const dates = xScheduleFor(article.scheduled_at);
  const rows = await createWeek(postSlug, angles, dates);
  return { threads: rows, angles, tokens };
}

/** Escribe y valida el texto de un hilo. Deja el resultado en la fila. */
export async function generateThread(thread: XThread) {
  const article = await loadArticle(thread.post_slug);
  const siblings = await siblingsOf(thread.post_slug, thread.id);

  // El guion completo se reconstruye desde las filas hermanas de la semana:
  // el escritor necesita ver hacia dónde va, no solo su propio ángulo.
  const result = await orchestrateThread({
    articleTitle: article.raw_title,
    articleUrl: `https://www.silvanopuccini.dev/es/blog/${article.post_slug}`,
    articleText: article.raw_content,
    angles: [{ id: thread.angle_id, summary: thread.angle_summary, question: '' }],
    selectedAngleId: thread.angle_id,
    publishedThisWeek: siblings,
    allowedUrls: allowedUrls(),
  });

  if (result.outcome === 'blocked') {
    return updateThread(thread.id, {
      status: 'planificado',
      generation_attempts: thread.generation_attempts + result.attempts,
      last_error: result.reasons.join(' | ').slice(0, 1000),
      // Se guarda igual para poder mirarlo, pero sin huella no se publica.
      tweets: result.lastDraft?.tweets.map((text) => ({ text })) ?? [],
      approved_fingerprint: null,
    });
  }

  return updateThread(thread.id, {
    status: 'preaprobado',
    pre_approved_at: new Date().toISOString(),
    thesis: result.draft.thesis,
    tweets: result.draft.tweets.map((text) => ({ text })),
    reply_with_link: result.draft.reply_with_link,
    evidence: result.draft.evidence,
    approved_fingerprint: result.fingerprint,
    generation_attempts: thread.generation_attempts + result.attempts,
    last_error: null,
  });
}

/**
 * Publica un hilo ya aprobado.
 *
 * Antes de mandar nada comprueba que el texto sea exactamente el que pasó los
 * controles. Si alguien lo editó a mano después de aprobarlo, la huella no
 * coincide y se niega: publicar algo que nadie validó es justo lo que este
 * circuito existe para impedir.
 */
export async function publishThreadNow(thread: XThread) {
  if (thread.published_at) {
    return { alreadyPublished: true as const, thread };
  }
  const texts = (thread.tweets ?? []).map((tweet) => tweet.text);
  const reply = thread.reply_with_link ?? '';
  if (texts.length === 0) throw new Error('El hilo no tiene texto');

  if (!thread.approved_fingerprint) {
    throw new Error('El hilo no está aprobado: falta pasarlo por los controles');
  }
  if (fingerprint(texts, reply) !== thread.approved_fingerprint) {
    throw new Error('El texto cambió después de aprobarse. Volvé a generarlo antes de publicar.');
  }

  // La respuesta con el link va al final de la misma cadena: adentro del hilo
  // un link le costaría entre el 50% y el 90% del alcance.
  const sequence = reply ? [...texts, reply] : texts;

  try {
    const ids = await publishThread({
      texts: sequence,
      alreadyPublished: thread.published_ids ?? [],
      onProgress: async (published) => {
        await updateThread(thread.id, { published_ids: published });
      },
    });

    const updated = await updateThread(thread.id, {
      status: 'publicado',
      published_at: new Date().toISOString(),
      published_ids: ids,
      published_url: threadUrl(X_USERNAME, ids[0]),
      publish_attempts: thread.publish_attempts + 1,
      last_error: null,
    });
    return { alreadyPublished: false as const, thread: updated };
  } catch (reason) {
    const detail = reason instanceof Error ? reason.message : String(reason);
    await updateThread(thread.id, {
      status: 'error',
      publish_attempts: thread.publish_attempts + 1,
      last_error: detail.slice(0, 1000),
    });
    throw reason;
  }
}
