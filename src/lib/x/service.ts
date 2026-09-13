import { getSupabaseAdmin } from '@/lib/supabase';
import { X_USERNAME } from './author-profile';
import {
  CREDITS_DEPLETED_MESSAGE, isCreditsDepletedError, publishThread, threadUrl,
} from './client';
import { planWeek } from './gemini';
import { fingerprint, orchestrateThread } from './orchestrate';
import {
  allowedUrls, appendRewriteHistory, createThread, createWeek, siblingsOf, updateThread,
} from './repository';
import { xScheduleFor } from './scheduling';
import { MAX_REWRITE_HISTORY, type XAngle, type XRewriteHistoryEntry, type XThread } from './types';

export const MAX_TWEET_LENGTH = 280;

/**
 * Importa un hilo escrito a mano o fuera del panel.
 *
 * Una línea por tweet. Reporta los tweets que exceden el límite de X, pero los
 * guarda igual: el editor los recorta y la validación los pincha hasta que
 * queden publicables. La fila nace planificada, sin aprobación.
 */
export async function importThread(row: {
  post_slug: string;
  angle_id: string;
  angle_summary: string;
  scheduled_at: string;
  text: string;
}) {
  const { tweets, oversize } = parseThreadText(row.text);

  if (tweets.length === 0) throw new Error('No vino ningún tweet: una línea por tweet');

  const thread = await createThread({
    post_slug: row.post_slug,
    angle_id: row.angle_id,
    angle_summary: row.angle_summary,
    scheduled_at: row.scheduled_at,
    tweets,
  });

  return { thread, oversize };
}

/**
 * Parte el texto importado en tweets, una línea por tweet.
 *
 * Las líneas en blanco son separadores visuales, no tweets vacíos. Se reportan
 * los que pasan de 280 sin descartarlos: el límite es de X, no del clipboard.
 */
export function parseThreadText(text: string): {
  tweets: { text: string; tweet_number: number }[];
  oversize: { tweet_number: number; length: number }[];
} {
  const tweets = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((text, index) => ({ text, tweet_number: index + 1 }));

  const oversize = tweets
    .filter((tweet) => tweet.text.length > MAX_TWEET_LENGTH)
    .map((tweet) => ({ tweet_number: tweet.tweet_number, length: tweet.text.length }));

  return { tweets, oversize };
}

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
 * El guion de la semana para un hilo, desde el snapshot persistido (R8).
 *
 * Regenerar NUNCA vuelve a pedirle el guion a la IA: el plan guardado es la
 * fuente. Solo si no hay snapshot (fila vieja sin backfill) se reconstruye un
 * ángulo único desde lo que tiene la fila.
 */
function planFor(thread: XThread): XAngle[] {
  if (thread.plan && thread.plan.length > 0) return thread.plan;
  return [{
    id: thread.angle_id,
    summary: thread.angle_summary.split(' | ')[0] ?? thread.angle_summary,
    question: thread.angle_summary.split(' | ')[1] ?? '',
  }];
}

/**
 * Arma la semana de un post: pide el guion de ángulos y crea un turno por día.
 * El texto de cada hilo se escribe después, día por día.
 */
export async function planWeekFor(postSlug: string) {
  const article = await loadArticle(postSlug);
  const { data, tokens, provider } = await planWeek(article.raw_title, article.raw_content);
  const angles = data.angles;
  if (angles.length === 0) {
    throw new Error('El artículo no dio ningún ángulo distinto para publicar');
  }
  const dates = xScheduleFor(article.scheduled_at);
  const rows = await createWeek(postSlug, angles, dates);
  return { threads: rows, angles, tokens, provider };
}

/** Escribe y valida el texto de un hilo. Deja el resultado en la fila. */
export async function generateThread(thread: XThread) {
  const article = await loadArticle(thread.post_slug);
  const siblings = await siblingsOf(thread.post_slug, thread.id);

  // La historia con memória: cada vuelta se persiste apenas termina, así que
  // si la corrida muere a la mitad, lo que ya se intentó no se pierde.
  let history: XRewriteHistoryEntry[] = (thread.rewrite_history ?? []).slice(-MAX_REWRITE_HISTORY);
  const persistAttempt = async (entry: XRewriteHistoryEntry) => {
    history = appendRewriteHistory(history, entry);
    await updateThread(thread.id, { rewrite_history: history });
  };

  const result = await orchestrateThread({
    articleTitle: article.raw_title,
    articleUrl: `https://www.silvanopuccini.dev/es/blog/${article.post_slug}`,
    articleText: article.raw_content,
    angles: planFor(thread),
    selectedAngleId: thread.angle_id,
    publishedThisWeek: siblings,
    allowedUrls: allowedUrls(),
    history,
    onAttempt: persistAttempt,
  });

  if (result.outcome === 'blocked') {
    return updateThread(thread.id, {
      status: 'planificado',
      generation_attempts: thread.generation_attempts + result.attempts,
      last_error: result.reasons.join(' | ').slice(0, 1000),
      // Se guarda igual para poder mirarlo, pero sin huella no se publica.
      tweets: (result.lastDraft?.tweets ?? []).map((text, index) => ({ text, tweet_number: index + 1 })),
      approved_fingerprint: null,
    });
  }

  return updateThread(thread.id, {
    status: 'preaprobado',
    pre_approved_at: new Date().toISOString(),
    thesis: result.draft.thesis,
    tweets: result.draft.tweets.map((text, index) => ({ text, tweet_number: index + 1 })),
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
    if (isCreditsDepletedError(reason)) {
      // El panel muestra el mensaje manual y el botón de copiar: el hilo ya
      // no se puede publicar desde acá hasta que haya crédito.
      await updateThread(thread.id, {
        status: 'error',
        publish_attempts: thread.publish_attempts + 1,
        last_error: CREDITS_DEPLETED_MESSAGE,
      });
      throw reason;
    }
    const detail = reason instanceof Error ? reason.message : String(reason);
    await updateThread(thread.id, {
      status: 'error',
      publish_attempts: thread.publish_attempts + 1,
      last_error: detail.slice(0, 1000),
    });
    throw reason;
  }
}