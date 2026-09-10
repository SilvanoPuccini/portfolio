import type { AgendaChannel } from '@/lib/agenda/types';
import type { PostPublicationStatus } from '@/lib/post-publications/types';

/**
 * Blog y LinkedIn viven en tablas y endpoints distintos, pero desde el listado
 * son la misma operación. Esta capa traduce el canal a su ruta para que las
 * páginas no repitan el condicional en cada acción.
 */
const BASE: Record<AgendaChannel, string> = {
  blog: '/api/admin/posts-agenda',
  linkedin: '/api/admin/linkedin-posts',
  x: '/api/admin/x-threads',
};

function endpoint(channel: AgendaChannel, sourceId: string) {
  return `${BASE[channel]}/${encodeURIComponent(sourceId)}`;
}

async function readError(response: Response, fallback: string) {
  const json = await response.json().catch(() => ({}));
  return (json as { error?: string }).error ?? fallback;
}

export async function fetchPieceText(channel: AgendaChannel, sourceId: string): Promise<string> {
  const response = await fetch(endpoint(channel, sourceId));
  if (!response.ok) throw new Error(await readError(response, 'No se pudo traer el texto'));
  const json = await response.json();
  if (channel === 'blog') return json.item?.raw_content ?? '';
  if (channel === 'linkedin') return json.item?.body ?? '';
  // Un hilo son varios tweets: se muestran juntos, separados, solo para leer.
  return ((json.item?.tweets ?? []) as { text: string }[]).map((tweet) => tweet.text).join('\n\n');
}

async function patch(channel: AgendaChannel, sourceId: string, body: Record<string, unknown>) {
  const response = await fetch(endpoint(channel, sourceId), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) return { ok: false as const, error: await readError(response, 'No se pudo guardar') };
  return { ok: true as const };
}

export function savePieceText(channel: AgendaChannel, sourceId: string, text: string) {
  if (channel === 'x') {
    // Editar un hilo desde la agenda partiría los tweets a ciegas por saltos
    // de línea. Se edita en su propia sección, donde cada uno tiene su caja.
    return Promise.resolve({ ok: false as const, error: 'Los hilos de X se editan en su sección' });
  }
  return patch(channel, sourceId, channel === 'blog' ? { raw_content: text } : { body: text });
}

/** El .md viaja crudo: el servidor lo convierte, así la conversión es una sola. */
export function attachPieceMarkdown(channel: AgendaChannel, sourceId: string, markdown: string, filename: string) {
  if (channel === 'x') {
    return Promise.resolve({ ok: false as const, error: 'Un hilo de X se escribe con Gemini, no se adjunta' });
  }
  return patch(channel, sourceId, channel === 'blog'
    ? { source_markdown: markdown }
    : { source_markdown: markdown, source_filename: filename });
}

export function changePieceStatus(channel: AgendaChannel, sourceId: string, status: PostPublicationStatus) {
  return patch(channel, sourceId, { status });
}

/** Solo el blog tiene borrado; una pieza de LinkedIn se archiva desde su detalle. */
export async function deletePiece(sourceId: string) {
  const response = await fetch(endpoint('blog', sourceId), { method: 'DELETE' });
  if (!response.ok) return { ok: false as const, error: await readError(response, 'No se pudo eliminar') };
  return { ok: true as const };
}
