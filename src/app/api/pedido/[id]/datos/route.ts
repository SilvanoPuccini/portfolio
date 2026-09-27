import { NextRequest, NextResponse } from 'next/server';

import { COOKIE_ACCESO, tieneAcceso } from '@/lib/leads/acceso-cliente';
import { rateLimit } from '@/lib/rate-limit';
import { asuntoDeAviso, avisoAdmin } from '@/lib/email-templates/aviso-admin';
import { proyectoEnMarchaHtml } from '@/lib/email-templates/proyecto-en-marcha';
import { plazoDelPedido } from '@/content/servicios';
import { cargarPedidoCompleto } from '@/lib/leads/cargar-pedido';
import { lineaDeTiempo } from '@/lib/leads/linea-de-tiempo';
import { sendCrmEmail } from '@/lib/resend';
import { getSupabaseAdmin } from '@/lib/supabase';
import { frozenKickoffPlan, parseConfigurationSnapshot } from '@/lib/order-configuration-snapshot';
import type { PlanKickoff, DatoKickoff } from '@/content/kickoff';

/**
 * El material del proyecto, guardado a medida que el cliente lo carga.
 *
 * Se guarda parcial y seguido, no al final. El que junta el logo, las fotos y
 * los textos de su negocio no lo hace de una sentada: se distrae, cierra la
 * pestaña, vuelve al otro día. Perder lo que ya cargó es perder al cliente.
 *
 * `listo` es distinto de guardar: es el cliente diciendo «terminé». Recién
 * ahí Silvano recibe el aviso, porque antes lo que hay es un borrador.
 */

export const dynamic = 'force-dynamic';

const MAX_TEXTO = 5_000;
const MAX_FILAS = 300;

function getIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
}

/** Un texto del cliente: recortado y sin sorpresas. */
function texto(valor: unknown): string | null {
  return typeof valor === 'string' ? valor.slice(0, MAX_TEXTO) : null;
}

/**
 * Lo que viene del navegador, limpio.
 *
 * Se aceptan textos, listas de textos (los archivos ya subidos) y filas de
 * los bloques repetidos. Cualquier otra forma se descarta en silencio: es
 * mejor perder un campo raro que guardar algo que después rompe la pantalla
 * del panel.
 */
function limpiar(entrada: unknown): Record<string, unknown> {
  if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)) return {};

  const limpio: Record<string, unknown> = {};

  for (const [clave, valor] of Object.entries(entrada as Record<string, unknown>)) {
    const simple = texto(valor);
    if (simple !== null) {
      limpio[clave] = simple;
      continue;
    }

    if (!Array.isArray(valor)) continue;

    // Una lista puede ser de textos (los archivos ya subidos) o de filas de
    // un bloque repetido. Se acepta cualquiera de las dos, nada más.
    const filas: (string | Record<string, string>)[] = [];

    for (const fila of valor.slice(0, MAX_FILAS)) {
      const suelto = texto(fila);
      if (suelto !== null) {
        filas.push(suelto);
        continue;
      }

      if (!fila || typeof fila !== 'object' || Array.isArray(fila)) continue;

      const campos: Record<string, string> = {};
      for (const [k, v] of Object.entries(fila as Record<string, unknown>)) {
        const limpio = texto(v);
        if (limpio !== null) campos[k] = limpio;
      }
      if (Object.keys(campos).length > 0) filas.push(campos);
    }

    limpio[clave] = filas;
  }

  return limpio;
}

/** V2 accepts writes only for fields in the order's archived, visible plan. */
function validForFrozenPlan(input: Record<string, unknown>, saved: Record<string, unknown>, plan: PlanKickoff): boolean {
  const values = { ...saved, ...input };
  const visible = (condition?: { id: string; valor: string }) => {
    if (!condition) return true;
    const options = plan.datos.find((field) => field.id === condition.id)?.opciones?.es;
    return values[condition.id] === (options ? options[condition.valor === 'archivo' ? 0 : 1] : condition.valor);
  };
  const fields = new Map(plan.datos.filter((field) => visible(field.visibleSi)).map((field) => [field.id, field]));
  const groups = new Map(plan.grupos.filter((group) => visible(group.visibleSi)).map((group) => [group.id, group]));
  const validField = (field: DatoKickoff, value: unknown) => {
    if (field.tipo === 'archivo') return typeof value === 'string' || (Array.isArray(value)
      && value.every((item) => typeof item === 'string') && (field.multiple || value.length <= 1));
    if (field.tipo === 'opcion') return typeof value === 'string' && (field.opciones?.es.includes(value) ?? false);
    return typeof value === 'string';
  };
  return Object.entries(input).every(([key, value]) => {
    // Existing legacy material is kept verbatim, but cannot be changed through a V2 order.
    if (key in saved && JSON.stringify(saved[key]) === JSON.stringify(value)) return true;
    const field = fields.get(key);
    if (field) return validField(field, value);
    for (const group of groups.values()) {
      const prefix = `${group.id}_`;
      if (!key.startsWith(prefix)) continue;
      const match = /^(\d+)_(.+)$/.exec(key.slice(prefix.length));
      if (!match || (group.veces !== undefined && Number(match[1]) >= group.veces)) return false;
      const upload = group.campos.find((candidate) => candidate.id === match[2] && candidate.tipo === 'archivo');
      return Boolean(upload && validField(upload, value));
    }
    const group = groups.get(key);
    if (!group || !Array.isArray(value) || (group.veces !== undefined && value.length > group.veces)) return false;
    return value.every((row) => row && typeof row === 'object' && !Array.isArray(row)
      && Object.entries(row).every(([fieldId, fieldValue]) => {
        const groupField = group.campos.find((candidate) => candidate.id === fieldId && visible(candidate.visibleSi));
        return groupField && validField(groupField, fieldValue);
      }));
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!rateLimit(`kickoff:${getIp(req)}`, 60, 60_000)) {
      return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
    }

    const { id } = await params;

    // El material del cliente está detrás del código que le llegó al mail:
    // el link solo no alcanza, porque un link se comparte.
    if (!tieneAcceso(req.cookies.get(COOKIE_ACCESO)?.value, id)) {
      return NextResponse.json({ error: 'Verificá tu correo para continuar.' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const db = getSupabaseAdmin();

    const { data: pedido } = await db
      .from('pedidos')
      .select('id, lead_id, paquete, extras, configuracion_snapshot')
      .eq('id', id)
      .maybeSingle();

    const order = pedido as { lead_id: string | null; configuracion_snapshot?: unknown } | null;
    const leadId = order?.lead_id;
    if (!leadId) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

    const { data } = await db
      .from('leads')
      .select('id, nombre, email, contrato_firmado_at, kickoff_datos, kickoff_completado_at')
      .eq('id', leadId)
      .maybeSingle();

    const lead = data as {
      id: string; nombre: string; email: string;
      contrato_firmado_at: string | null;
      kickoff_datos: Record<string, unknown> | null;
      kickoff_completado_at: string | null;
    } | null;

    if (!lead) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

    // El link del pedido es un uuid que solo tiene quien compró, pero además
    // no se escribe nada hasta que la venta existe de verdad: sin contrato
    // firmado no hay material que cargar.
    if (!lead.contrato_firmado_at) {
      return NextResponse.json({ error: 'El contrato todavía no está firmado.' }, { status: 409 });
    }

    // Lo nuevo se suma a lo que ya había: el cliente puede estar completando
    // una sola pantalla y no por eso borra lo anterior.
    const archived = order?.configuracion_snapshot == null ? null : parseConfigurationSnapshot(order.configuracion_snapshot);
    if (order?.configuracion_snapshot != null && !archived) {
      return NextResponse.json({ error: 'Invalid archived order configuration.' }, { status: 409 });
    }
    const incoming = limpiar(body?.datos);
    const plan = frozenKickoffPlan(archived);
    if (plan && (!body?.datos || !validForFrozenPlan(incoming, lead.kickoff_datos ?? {}, plan)
      || Object.keys(incoming).length !== Object.keys(body.datos).length)) {
      return NextResponse.json({ error: 'Material is outside the archived order requirements.' }, { status: 400 });
    }
    const kickoff_datos = { ...(lead.kickoff_datos ?? {}), ...incoming };
    const yaEstaba = Boolean(lead.kickoff_completado_at);
    const termina = body?.listo === true && !yaEstaba;

    const { error } = await db
      .from('leads')
      .update({
        kickoff_datos,
        ...(termina ? { kickoff_completado_at: new Date().toISOString() } : {}),
      })
      .eq('id', lead.id);

    if (error) {
      console.error('[api/pedido/datos] No se pudo guardar:', error);
      return NextResponse.json({ error: 'Could not save.' }, { status: 500 });
    }

    // Solo cuando dice que terminó. Un aviso por cada tecla no es un aviso.
    const admin = process.env.ADMIN_EMAIL;
    if (termina && admin) {
      try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://silvanopuccini.dev';
        await sendCrmEmail(
          admin,
          asuntoDeAviso('material', lead.nombre, 'cargó el material, listo para arrancar'),
          avisoAdmin({
            tipo: 'material',
            titulo: `${lead.nombre} cargó el material`,
            resumen: 'Terminó de cargar todo lo del proyecto. Está en su ficha, listo para arrancar.',
            filas: [{ label: 'Cliente', valor: `${lead.nombre} · ${lead.email}` }],
            siguiente: 'Revisá el material y arrancá: el plazo del contrato corre desde hoy.',
            urlFicha: `${siteUrl}/admin/leads/${lead.id}`,
          }),
        );
      } catch (reason) {
        console.warn('[api/pedido/datos] El aviso no salió:', reason);
      }
    }

    // Al cliente: la confirmación con fechas y el link para volver. No le
    // llegaba nada, y si cerraba la pestaña se quedaba sin camino.
    if (termina) await confirmarAlCliente(id, lead.email);

    return NextResponse.json({ ok: true, completado: termina || yaEstaba });
  } catch (err) {
    console.error('[api/pedido/datos] POST error:', err);
    return NextResponse.json({ error: 'Could not save.' }, { status: 500 });
  }
}

/** «Tu proyecto está en marcha». Nunca tira: el material ya quedó guardado. */
async function confirmarAlCliente(pedidoId: string, email: string): Promise<void> {
  try {
    const completo = await cargarPedidoCompleto(pedidoId);
    if (!completo?.lead) return;

    const { lead, paquete, resumen, espera, pedido } = completo;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://silvanopuccini.dev';

    await sendCrmEmail(
      email,
      `Tu ${paquete.nombre.es} ya está en marcha`,
      proyectoEnMarchaHtml({
        nombre: lead.nombre,
        paquete: paquete.nombre.es,
        urlPedido: `${siteUrl}/es/pedido/${pedido.id}/listo`,
        pasos: lineaDeTiempo({
          cobradoAt: lead.cobrado_at,
          materialAt: lead.kickoff_completado_at ?? new Date().toISOString(),
          plazoMaximo: paquete.plazoDias > 0 ? plazoDelPedido(paquete, resumen.extras) + espera : 0,
          espera,
          locale: 'es',
        }),
      }),
    );
  } catch (reason) {
    console.warn('[api/pedido/datos] La confirmación al cliente no salió:', reason);
  }
}
