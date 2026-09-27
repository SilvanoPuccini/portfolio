import { paquetePorSlug, servicioPorSlug, totalPedido, type Locale, type Paquete, type Pedido } from '@/content/servicios';
import { esperaDelPedido } from './capacidad';
import { etapaDelPedido, type EtapaPedido } from './etapa-pedido';
import { getSupabaseAdmin } from '@/lib/supabase';
import { parseConfigurationSnapshot } from '@/lib/order-configuration-snapshot';
import { readRevision } from './contract-revision';

/**
 * Todo lo que un paso de la compra necesita saber, en una sola consulta.
 *
 * Los cuatro pasos —los datos, el contrato, el pago y el cierre— necesitan
 * exactamente lo mismo: qué compró, a quién, y en qué punto está. Cuando cada
 * página lo resolvía por su cuenta, alcanzaba con que una se olvidara de una
 * columna para que mostrara algo distinto de la de al lado.
 */

export interface PedidoRow {
  id: string;
  paquete: string;
  extras: string[] | null;
  total_usd: number;
  mensual_usd: number;
  firmado_at: string | null;
  lead_id: string | null;
  configuracion_snapshot?: unknown;
  contrato_snapshot?: unknown;
}

export interface LeadRow {
  nombre: string;
  email: string;
  localidad: string | null;
  estado: string | null;
  pais: string | null;
  pago_estado: string | null;
  factura_numero: string | null;
  contrato_firma_token: string | null;
  contrato_signing_url: string | null;
  contrato_firmado_at: string | null;
  cobrado_at: string | null;
  kickoff_completado_at: string | null;
}

export interface PedidoCompleto {
  pedido: PedidoRow;
  lead: LeadRow | null;
  paquete: Paquete;
  resumen: Pedido;
  etapa: EtapaPedido;
  /** Días hábiles de espera por la agenda, congelados al pedir. */
  espera: number;
}

const COLUMNAS_LEAD = 'nombre, email, localidad, estado, pais, pago_estado, factura_numero, '
  + 'contrato_firma_token, contrato_signing_url, contrato_firmado_at, cobrado_at, kickoff_completado_at';

/**
 * El pedido con su venta y su etapa. `null` si no existe o si el paquete que
 * compró ya no está en el catálogo: sin eso no hay nada que mostrarle.
 */
export async function cargarPedidoCompleto(id: string): Promise<PedidoCompleto | null> {
  const db = getSupabaseAdmin();

  const { data } = await db
    .from('pedidos')
    .select('id, paquete, extras, total_usd, mensual_usd, firmado_at, lead_id, configuracion_snapshot, contrato_snapshot')
    .eq('id', id)
    .maybeSingle();

  const pedido = data as PedidoRow | null;
  if (!pedido) return null;

  const catalogPackage = paquetePorSlug(pedido.paquete);
  const archived = pedido.configuracion_snapshot == null
    ? null
    : parseConfigurationSnapshot(pedido.configuracion_snapshot);
  let frozenContract: ReturnType<typeof readRevision> | null = null;
  if (pedido.contrato_snapshot != null) {
    try { frozenContract = readRevision(pedido.contrato_snapshot); } catch { frozenContract = null; }
  }
  if (pedido.configuracion_snapshot != null && !archived && !frozenContract) return null;
  // A valid archive is sufficient to render the order shell and contract even
  // if the package has since been removed from the live catalog.
  if (!catalogPackage && !archived && !frozenContract) return null;
  const paquete: Paquete = !archived && catalogPackage ? catalogPackage : {
    slug: archived?.package.id ?? pedido.paquete,
    servicio: 'archived',
    nombre: { es: archived?.package.label ?? frozenContract!.datos.projectDescription, en: archived?.package.label ?? frozenContract!.datos.projectDescription },
    resumen: { es: archived?.package.description ?? frozenContract!.datos.projectDescription, en: archived?.package.description ?? frozenContract!.datos.projectDescription },
    precioUsd: archived ? archived.package.oneTimeUsd + archived.package.recurringUsd : frozenContract!.datos.totalPrice,
    recurrente: archived?.package.recurringUsd ? 'mes' : undefined,
    horas: 0,
    plazoDias: archived?.package.deliveryDays ?? frozenContract!.datos.plazoDiasHabiles ?? 0,
    incluye: { es: archived ? [...archived.package.included] : frozenContract!.datos.deliverables.split('\n'), en: archived ? [...archived.package.included] : frozenContract!.datos.deliverables.split('\n') },
    noIncluye: { es: archived ? [...archived.package.excluded] : (frozenContract!.datos.excluded ?? '').split('\n').filter(Boolean), en: archived ? [...archived.package.excluded] : (frozenContract!.datos.excluded ?? '').split('\n').filter(Boolean) },
    calificacion: [], modulos: [], pagoUnico: (archived?.package.recurringUsd ?? 0) === 0,
    documensoTemplateId: null, directLink: null, activo: false,
  };

  let lead: LeadRow | null = null;
  if (pedido.lead_id) {
    const { data: venta } = await db
      .from('leads')
      .select(COLUMNAS_LEAD)
      .eq('id', pedido.lead_id)
      .maybeSingle();

    lead = (venta as LeadRow | null) ?? null;
  }

  const servicio = servicioPorSlug(paquete.servicio);
  const resumen = archived
    ? {
      paquete,
      extras: archived.extras.map((extra) => ({
        id: extra.id,
        label: { es: extra.label, en: extra.label },
        detalle: { es: extra.description, en: extra.description },
        precioUsd: extra.amountUsd,
        recurrente: extra.cadence === 'month' ? 'mes' as const : undefined,
      })),
      totalUsd: archived.charges.oneTimeUsd,
      recurrenteUsd: archived.charges.recurringUsd,
    }
    : !catalogPackage && frozenContract
      ? { paquete, extras: [], totalUsd: frozenContract.datos.totalPrice, recurrenteUsd: 0 }
      : pedido.configuracion_snapshot != null && !archived && !frozenContract
        ? null
        : totalPedido(paquete, pedido.extras ?? [], servicio?.extras ?? []);
  if (!resumen) return null;

  const etapa = etapaDelPedido(pedido, lead
    ? {
      estado: lead.estado,
      contrato_firmado_at: lead.contrato_firmado_at,
      pago_estado: lead.pago_estado,
    }
    : null);

  return { pedido, lead, paquete, resumen, etapa, espera: await esperaDelPedido(pedido.id) };
}

/** El precio como lo lee el cliente, en el idioma en que compró. */
export function money(valor: number, locale: Locale): string {
  return `USD ${valor.toLocaleString(locale === 'es' ? 'es-AR' : 'en-US')}`;
}
