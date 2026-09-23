import { SchemaType, type Schema } from '@google/generative-ai';

import { callGeminiVision } from '@/lib/x/gemini.client';
import { revisarPago, type DatosComprobante, type LoEsperado, type Revision } from './comprobante-ocr';

/**
 * El comprobante, leído por el modelo y revisado por nosotros.
 *
 * El reparto es deliberado: el modelo SOLO transcribe lo que ve, y quien
 * decide si eso cuadra es código nuestro, con reglas que se pueden leer y
 * testear. Pedirle al modelo que además juzgue sería poner la decisión de
 * cobrar o no en algo que no se puede auditar.
 */

const ESQUEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    esComprobante: { type: SchemaType.BOOLEAN },
    titular: { type: SchemaType.STRING, nullable: true },
    destino: { type: SchemaType.STRING, nullable: true },
    monto: { type: SchemaType.NUMBER, nullable: true },
    moneda: { type: SchemaType.STRING, nullable: true },
    fecha: { type: SchemaType.STRING, nullable: true },
    banco: { type: SchemaType.STRING, nullable: true },
  },
  required: ['esComprobante'],
};

const SISTEMA = `Transcribís comprobantes de transferencia bancaria de Latinoamérica.

Devolvés SOLO lo que está escrito en la imagen. No completás, no deducís y no
corregís: un dato que no aparece va en null. Inventar un monto o un alias que
no se ve haría que se dé por bueno un pago que no entró.

- monto: el número solo, sin símbolos ni separadores de miles. "$ 1.200.000,50" es 1200000.5
- destino: el alias, CBU o número de cuenta de QUIEN RECIBE, nunca el de quien envía
- titular: el nombre de QUIEN ENVÍA
- fecha: AAAA-MM-DD
- esComprobante: false si la imagen no es un comprobante de transferencia

No opinás sobre si el pago es correcto: eso lo decide otro.`;

export interface LecturaDeComprobante {
  datos: DatosComprobante;
  revision: Revision;
}

/**
 * Lee el archivo y lo compara con lo que se esperaba.
 *
 * Devuelve `null` si el modelo no está disponible o falla: el comprobante
 * sigue archivado y Silvano lo mira como siempre. Una ayuda que se cae no
 * puede frenar un cobro.
 */
export async function leerComprobante(
  archivo: Buffer,
  tipo: string,
  esperado: LoEsperado,
): Promise<LecturaDeComprobante | null> {
  try {
    const { data } = await callGeminiVision<DatosComprobante>(
      SISTEMA,
      { datos: archivo.toString('base64'), tipo },
      'Transcribí este comprobante.',
      ESQUEMA,
    );

    return { datos: data, revision: revisarPago(data, esperado) };
  } catch (reason) {
    console.warn('[leer-comprobante] No se pudo leer:', reason);
    return null;
  }
}
