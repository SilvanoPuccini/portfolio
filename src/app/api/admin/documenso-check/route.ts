import { NextRequest, NextResponse } from 'next/server';

import { isAuthorized } from '@/lib/admin-auth';
import { CAMPOS_ESPERADOS, createContract, signerOf } from '@/lib/leads/documenso-contract';
import { jurisdiccionCorta } from '@/lib/leads/legal-clause';
import { getSupabaseAdmin } from '@/lib/supabase';

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

/**
 * La tabla donde se registra el pedido antes de firmar.
 *
 * Si falta la migración, el botón de contratar devuelve 500 y el cliente ve
 * un «probá de nuevo» que no se arregla probando de nuevo. Se comprueba acá
 * para que el fallo sea visible antes de la primera venta y no durante.
 */
async function hayTablaPedidos(): Promise<boolean> {
  try {
    const { error } = await getSupabaseAdmin().from('pedidos').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = (process.env.DOCUMENSO_API_TOKEN ?? '').trim();
  const templateId = (process.env.DOCUMENSO_TEMPLATE_ID ?? '').trim();

  // Solo si están, nunca su contenido.
  const variables = {
    DOCUMENSO_API_TOKEN: Boolean(token),
    DOCUMENSO_TEMPLATE_ID: Boolean(templateId),
    DOCUMENSO_WEBHOOK_SECRET: Boolean((process.env.DOCUMENSO_WEBHOOK_SECRET ?? '').trim()),
  };

  const tablaPedidos = await hayTablaPedidos();

  const base = {
    variables,
    tablaPedidos,
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
  const firmante = signerOf(plantilla.recipients ?? [], process.env.DOCUMENSO_OWNER_EMAIL);
  const firmantes = (plantilla.recipients ?? []).filter((r) => (r.role ?? 'SIGNER') === 'SIGNER').length;

  const problema = firmantes === 0
    ? 'La plantilla no tiene ningún firmante. Sin eso, Documenso no puede cerrar el documento.'
    : firmantes < 2
      ? 'El contrato lo firman las dos partes. Falta agregar tu firma en la plantilla: hoy el cliente se llevaría una copia con una sola firma.'
      : !firmante
        ? 'La plantilla no tiene un firmante para el cliente.'
        : faltan.length > 0
        ? `Le faltan campos a la plantilla: ${faltan.join(', ')}. Ese dato va a salir en blanco en el contrato.`
        : !tablaPedidos
          ? 'Falta correr la migración 038_pedidos.sql en Supabase: sin esa tabla, el botón de contratar devuelve error.'
          : null;

  return NextResponse.json({
    variables,
    tablaPedidos,
    esperados: [...CAMPOS_ESPERADOS],
    ruta: url,
    encontrados,
    faltan,
    firmantes,
    listo: Boolean(firmante) && firmantes >= 2 && faltan.length === 0 && tablaPedidos,
    ...(problema ? { problema } : {}),
  });
}

/**
 * Una firma de prueba, de verdad.
 *
 * Crea un contrato real en Documenso con datos de prueba evidentes y devuelve
 * el error EXACTO si algo falla. Un 502 en la página del cliente no dice nada;
 * «invalid enum value» dice todo.
 *
 * El documento queda en la cuenta de Documenso y se puede borrar desde ahí.
 */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const contrato = await createContract({
      nombre: 'PRUEBA — no es un cliente',
      email: 'prueba@example.com',
      total: 1,
      alcance: 'Contrato de prueba para verificar la plantilla.',
      objeto: 'Prueba de integración.',
      plazo: '1 día hábil.',
      pago: 'Pago único de USD 1.',
      domicilio: 'Prueba',
      jurisdiccion: jurisdiccionCorta('Argentina'),
    });

    return NextResponse.json({ ok: true, signingUrl: contrato.signingUrl });
  } catch (reason) {
    const error = reason instanceof Error ? reason.message : String(reason);
    console.error('[documenso-check] La prueba falló:', error);
    return NextResponse.json({ ok: false, error });
  }
}
