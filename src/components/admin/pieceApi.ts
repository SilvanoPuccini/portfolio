import type { AgendaChannel } from '@/lib/agenda/types';
import type { PostPublicationStatus } from '@/lib/post-publications/types';

/**
 * Blog y LinkedIn viven en tablas y endpoints distintos, pero desde el listado
 * son la misma operación. Esta capa traduce el canal a su ruta para que las
 * páginas no repitan el condicional en cada acción.
 */
function endpoint(channel: AgendaChannel, sourceId: string) {
  const base = channel === 'blog' ? '/api/admin/posts-agenda' : '/api/admin/linkedin-posts';
  return `${base}/${encodeURIComponent(sourceId)}`;
}

async function readError(response: Response, fallback: string) {
  const json = await response.json().catch(() => ({}));
  return (json as { error?: string }).error ?? fallback;
}

export async function fetchPieceText(channel: AgendaChannel, sourceId: string): Promise<string> {
  const response = await fetch(endpoint(channel, sourceId));
  if (!response.ok) throw new Error(await readError(response, 'No se pudo traer el texto'));
  const json = await response.json();
  return (channel === 'blog' ? json.item?.raw_content : json.item?.body) ?? '';
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
  return patch(channel, sourceId, channel === 'blog' ? { raw_content: text } : { body: text });
}

/** El .md viaja crudo: el servidor lo convierte, así la conversión es una sola. */
export function attachPieceMarkdown(channel: AgendaChannel, sourceId: string, markdown: string, filename: string) {
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
