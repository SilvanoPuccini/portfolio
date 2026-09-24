import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * La firma del Proveedor, para imprimirla en todos los contratos.
 *
 * El Proveedor emite el contrato ya firmado: define el alcance y el precio, y
 * su conformidad queda dada en ese momento. El generador del PDF sabía
 * dibujar la firma, pero en producción nadie se la pasaba — solo la cargaba un
 * test desde la carpeta de Descargas —, así que todos los contratos salían con
 * un renglón vacío donde tenía que estar.
 *
 * No vive en el repositorio a propósito: una firma no es un recurso público de
 * la aplicación. Se busca, en este orden:
 *   1. `FIRMA_PROVEEDOR_PNG_B64`, la imagen en base64 (sin ir a la red).
 *   2. El bucket privado `contratos`, en `_proveedor/firma.png`.
 */

const BUCKET = 'contratos';
export const RUTA_FIRMA_PROVEEDOR = '_proveedor/firma.png';

let cache: Buffer | undefined;

/** Solo para tests: que cada caso arranque sin la firma en memoria. */
export function olvidarFirmaDelProveedor(): void {
  cache = undefined;
}

/**
 * PNG o JPG por sus primeros bytes. pdfkit solo sabe dibujar esos dos, y lo
 * que no es una imagen no tiene nada que hacer al pie de un contrato.
 */
function esImagen(bytes: Buffer): boolean {
  const png = bytes.length > 8 && bytes.readUInt32BE(0) === 0x89504e47;
  const jpg = bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  return png || jpg;
}

async function buscar(): Promise<Buffer | undefined> {
  const b64 = process.env.FIRMA_PROVEEDOR_PNG_B64?.trim();
  if (b64) {
    const bytes = Buffer.from(b64, 'base64');
    if (esImagen(bytes)) return bytes;
    console.error('[firma-proveedor] FIRMA_PROVEEDOR_PNG_B64 no es un PNG ni un JPG válido');
  }

  const { data, error } = await getSupabaseAdmin().storage.from(BUCKET).download(RUTA_FIRMA_PROVEEDOR);
  if (error || !data) {
    console.error(
      `[firma-proveedor] No está la firma del Proveedor en ${BUCKET}/${RUTA_FIRMA_PROVEEDOR}: `
      + 'los contratos salen sin firma impresa.',
      error,
    );
    return undefined;
  }

  const bytes = Buffer.from(await data.arrayBuffer());
  if (!esImagen(bytes)) {
    console.error(`[firma-proveedor] ${BUCKET}/${RUTA_FIRMA_PROVEEDOR} no es un PNG ni un JPG`);
    return undefined;
  }
  return bytes;
}

/**
 * La firma, o `undefined` si no hay. Nunca tira: un contrato sin firma
 * impresa sigue valiendo por la conformidad escrita, y no puede frenar la
 * venta. Pero avisa en el log, porque es un error que se tiene que ver.
 *
 * Se guarda en memoria solo cuando se encontró: un fallo de red no puede
 * dejar a todos los contratos siguientes sin firma.
 */
export async function firmaDelProveedor(): Promise<Buffer | undefined> {
  if (cache) return cache;
  try {
    cache = await buscar();
  } catch (reason) {
    console.error('[firma-proveedor] No se pudo cargar la firma del Proveedor:', reason);
  }
  return cache;
}
