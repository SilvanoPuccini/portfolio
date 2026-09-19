import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * El archivo del contrato firmado.
 *
 * Documenso le manda el PDF firmado por mail a las dos partes, pero un mail se
 * borra. Si algún día hay un conflicto por un pago, lo que vale es el contrato
 * firmado y su registro de auditoría — IP, fecha y mail de cada firma. Por eso
 * se guardan los dos en Storage, en el bucket privado `contratos`.
 *
 * Usa la Envelope API v2 de Documenso: la v1 y el endpoint de documento están
 * deprecados. Son dos pasos: pedir el sobre para saber qué documentos tiene y
 * bajar cada uno en su versión firmada.
 *
 * Nunca lanza. Si el archivo falla, la firma ya ocurrió y la venta ya avanzó:
 * perder el respaldo es malo, pero deshacer una firma real por eso sería peor.
 */

const BUCKET = 'contratos';

export type ArchiveResult =
  | { ok: true; paths: string[] }
  | { ok: false; detail: string };

function apiBase(): string {
  return (process.env.DOCUMENSO_API_URL ?? 'https://app.documenso.com/api/v2').replace(/\/+$/, '');
}

/**
 * Los bytes de un PDF, venga como venga.
 *
 * La especificación de Documenso declara estas respuestas como JSON sin decir
 * su forma. En la práctica pueden devolver el PDF directo, un JSON con un link
 * de descarga, o un JSON con el archivo en base64. Se aceptan los tres, porque
 * adivinar uno solo es exactamente cómo se rompió la primera versión del
 * webhook.
 */
export async function fetchPdf(url: string, token: string): Promise<Uint8Array> {
  const response = await fetch(url, { headers: { Authorization: token } });
  if (!response.ok) throw new Error(`Documenso respondió ${response.status} en ${url}`);

  const type = response.headers.get('content-type') ?? '';
  if (!type.includes('json')) return new Uint8Array(await response.arrayBuffer());

  const json = await response.json() as Record<string, unknown>;
  const link = [json.downloadUrl, json.url, json.signedUrl].find((v): v is string => typeof v === 'string');
  if (link) {
    // El link ya viene firmado por Documenso: no lleva el token.
    const file = await fetch(link);
    if (!file.ok) throw new Error(`No se pudo bajar el archivo (${file.status})`);
    return new Uint8Array(await file.arrayBuffer());
  }

  const base64 = [json.data, json.base64, json.file].find((v): v is string => typeof v === 'string');
  if (base64) return Uint8Array.from(Buffer.from(base64, 'base64'));

  throw new Error(`Formato de descarga desconocido: ${Object.keys(json).join(', ')}`);
}

/** Nombre de archivo seguro a partir del título que tiene el documento en Documenso. */
function fileName(title: string, index: number): string {
  const clean = title
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\.pdf$/i, '')
    .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .toLowerCase();
  return `${clean || `documento-${index + 1}`}-firmado.pdf`;
}

export async function archiveSignedContract(envelopeId: string, leadId: string): Promise<ArchiveResult> {
  const token = process.env.DOCUMENSO_API_TOKEN;
  if (!token) return { ok: false, detail: 'Falta DOCUMENSO_API_TOKEN: el contrato no se archivó.' };

  try {
    const base = apiBase();
    const envelopeResponse = await fetch(`${base}/envelope/${encodeURIComponent(envelopeId)}`, {
      headers: { Authorization: token },
    });
    if (!envelopeResponse.ok) throw new Error(`Documenso respondió ${envelopeResponse.status} al pedir el sobre`);

    const envelope = await envelopeResponse.json() as {
      envelopeItems?: { id: string; title?: string; order?: number }[];
    };
    const items = [...(envelope.envelopeItems ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    if (items.length === 0) throw new Error('El sobre no trae documentos');

    const storage = getSupabaseAdmin().storage.from(BUCKET);
    const folder = `${leadId}/${envelopeId}`;
    const paths: string[] = [];

    const save = async (name: string, bytes: Uint8Array) => {
      const path = `${folder}/${name}`;
      const { error } = await storage.upload(path, bytes, { contentType: 'application/pdf', upsert: true });
      if (error) throw new Error(`Storage: ${error.message}`);
      paths.push(path);
    };

    for (const [index, item] of items.entries()) {
      const pdf = await fetchPdf(
        `${base}/envelope/item/${encodeURIComponent(item.id)}/download?version=signed`, token,
      );
      await save(fileName(item.title ?? '', index), pdf);
    }

    // El registro de auditoría es el que prueba quién firmó, cuándo y desde
    // dónde. Si falla solo esto, el contrato firmado ya quedó guardado.
    try {
      const audit = await fetchPdf(`${base}/envelope/${encodeURIComponent(envelopeId)}/audit-log/download`, token);
      await save('registro-de-auditoria.pdf', audit);
    } catch (reason) {
      console.warn('[contract-archive] El registro de auditoría no se guardó:', reason instanceof Error ? reason.message : reason);
    }

    return { ok: true, paths };
  } catch (reason) {
    const detail = reason instanceof Error ? reason.message : String(reason);
    console.warn('[contract-archive] El contrato no se archivó:', detail);
    return { ok: false, detail };
  }
}

/** Un link temporal para ver un contrato archivado desde el panel. */
export async function signedContractUrl(path: string, seconds = 300): Promise<string | null> {
  const { data, error } = await getSupabaseAdmin().storage.from(BUCKET).createSignedUrl(path, seconds);
  return error || !data ? null : data.signedUrl;
}
