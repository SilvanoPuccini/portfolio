import { NextRequest, NextResponse } from 'next/server';

import { isAuthorized } from '@/lib/admin-auth';
import { CAMPOS_ESPERADOS, signerOf } from '@/lib/leads/documenso-contract';

/**
 * ¿Está el contrato listo para firmarse de verdad?
 *
 * Tres cosas pueden fallar sin dar ningún error visible: que el id de la
 * plantilla no sea el que la API espera, que la ruta de la API sea otra, o
 * que algún campo esté mal nombrado. En los tres casos el contrato no se crea
 * y el sistema cae al correo con el adjunto, en silencio.
 *
 * Esto lo comprueba desde el servidor, que es donde vive el token: la clave
 * no sale de acá ni aparece en la respuesta.
 */

export const dynamic = 'force-dynamic';

const BASES = ['https://app.documenso.com/api/v2', 'https://app.documenso.com/api/v2-beta'];
const RECURSOS = ['template', 'envelope'];

interface Plantilla {
  fields?: { fieldMeta?: { label?: string } | null }[];
  recipients?: { id: number; role?: string; signingOrder?: number }[];
}

/** Prueba las rutas posibles hasta que una conteste. */
async function leerPlantilla(id: string, token: string) {
  const base = process.env.DOCUMENSO_API_URL;
  const bases = base ? [base] : BASES;
  const intentos: { url: string; status: number }[] = [];

  for (const raiz of bases) {
    for (const recurso of RECURSOS) {
      const url = `${raiz}/${recurso}/${id}`;
      try {
        const res = await fetch(url, {
          headers: { Authorization: token, 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(15_000),
        });
        intentos.push({ url, status: res.status });
        if (res.ok) return { url, plantilla: (await res.json()) as Plantilla, intentos };
      } catch {
        intentos.push({ url, status: 0 });
      }
    }
  }

  return { url: null, plantilla: null, intentos };
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = (process.env.DOCUMENSO_API_TOKEN ?? '').trim();
  const templateId = (process.env.DOCUMENSO_TEMPLATE_ID ?? '').trim();

  // Solo si están, nunca su contenido.
  const variables = {
    DOCUMENSO_API_TOKEN: Boolean(token),
    DOCUMENSO_TEMPLATE_ID: Boolean(templateId),
    DOCUMENSO_SECRET: Boolean((process.env.DOCUMENSO_SECRET ?? '').trim()),
  };

  const base = {
    variables,
    esperados: [...CAMPOS_ESPERADOS],
    ruta: null as string | null,
    encontrados: [] as string[],
    faltan: [...CAMPOS_ESPERADOS] as string[],
    firmantes: 0,
    listo: false,
  };

  if (!token || !templateId) {
    const cual = [
      !token ? 'DOCUMENSO_API_TOKEN' : null,
      !templateId ? 'DOCUMENSO_TEMPLATE_ID' : null,
    ].filter(Boolean).join(' y ');

    return NextResponse.json({
      ...base,
      problema: `Falta cargar ${cual} en Vercel. Acordate de hacer redeploy después de agregarla.`,
    });
  }

  const { url, plantilla, intentos } = await leerPlantilla(templateId, token);

  if (!plantilla) {
    return NextResponse.json({
      ...base,
      intentos,
      problema:
        'No se pudo leer la plantilla con ese id. Revisá que el id sea el que devuelve la API y que el token siga vigente.',
    });
  }

  const encontrados = (plantilla.fields ?? [])
    .map((campo) => campo.fieldMeta?.label?.trim().toLowerCase() ?? '')
    .filter(Boolean);

  const faltan = CAMPOS_ESPERADOS.filter((campo) => !encontrados.includes(campo));
  const firmante = signerOf(plantilla.recipients ?? []);
  const firmantes = (plantilla.recipients ?? []).filter((r) => (r.role ?? 'SIGNER') === 'SIGNER').length;

  const problema = !firmante
    ? 'La plantilla no tiene ningún firmante. Sin eso, Documenso no puede cerrar el documento.'
    : faltan.length > 0
      ? `Le faltan campos a la plantilla: ${faltan.join(', ')}. Ese dato va a salir en blanco en el contrato.`
      : null;

  return NextResponse.json({
    variables,
    esperados: [...CAMPOS_ESPERADOS],
    ruta: url,
    encontrados,
    faltan,
    firmantes,
    listo: Boolean(firmante) && faltan.length === 0,
    ...(problema ? { problema } : {}),
  });
}
