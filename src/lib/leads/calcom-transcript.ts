/**
 * La transcripción de la llamada ya no viene adentro del aviso.
 *
 * Cal.com manda links de descarga en cuatro formatos (json, srt, txt, vtt) y
 * el panel necesita el texto: es lo que lee la IA para escribir el seguimiento.
 * Se baja el .txt, que es el único sin marcas de tiempo.
 */

export interface TranscriptPayload {
  downloadLinks?: {
    transcription?: { format?: string; link?: string }[];
  };
}

/** El link al texto plano, o el primero que haya si no vino el .txt. */
export function transcriptLink(payload: TranscriptPayload): string | null {
  const links = payload.downloadLinks?.transcription ?? [];
  const txt = links.find((l) => l.format === 'txt' && l.link);
  return txt?.link ?? links.find((l) => l.link)?.link ?? null;
}

/** El texto de la transcripción. Nunca lanza: sin texto, devuelve null. */
export async function fetchTranscript(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    const text = (await res.text()).trim();
    return text || null;
  } catch (reason) {
    console.warn('[calcom] No se pudo bajar la transcripción:', reason instanceof Error ? reason.message : reason);
    return null;
  }
}
