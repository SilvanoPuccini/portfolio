import { paquetePorSlug } from '@/content/servicios';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * La agenda que no se prende fuego.
 *
 * Los plazos del catálogo valen para un proyecto a la vez. Si entran cinco
 * catálogos con cobro el mismo día, el quinto no se entrega en 25 días
 * hábiles por más que el contrato lo diga. Lo que llena la agenda no es la
 * cantidad de pedidos sino el trabajo que suman: seis landings no complican,
 * seis automatizaciones sí. Por eso se cuentan HORAS, que ya pesan la
 * complejidad de cada paquete.
 *
 * Deliberadamente simple: no es un planificador, es un fusible. Con poca
 * demanda no toca nada y se entrega rápido; cuando la demanda explota, el
 * que llega último sabe antes de firmar que arranca más tarde, y el contrato
 * dice un plazo que se puede cumplir.
 */

/** De las 10 horas del día, las que se planifican. Las otras 3 son colchón: imprevistos, ventas, soporte. */
export const HORAS_UTILES_POR_DIA = 7;

/** El trabajo en curso que entra sin sumarle espera a nadie: una semana hábil. */
export const LIBRE_SIN_ESPERA = HORAS_UTILES_POR_DIA * 5;

/** Los estados en que un proyecto está comprometido y todavía no se entregó. */
const EN_CURSO = ['contrato_firmado', 'cerrado', 'facturado'];

/** Días hábiles que se suman al plazo por el trabajo que ya hay adelante. */
export function diasDeEspera(horasEnCurso: number): number {
  if (!Number.isFinite(horasEnCurso) || horasEnCurso <= LIBRE_SIN_ESPERA) return 0;
  return Math.ceil((horasEnCurso - LIBRE_SIN_ESPERA) / HORAS_UTILES_POR_DIA);
}

/** Una fecha más `dias` días hábiles, salteando sábados y domingos. */
export function sumarDiasHabiles(desde: Date, dias: number): Date {
  const fecha = new Date(desde);
  let quedan = Math.max(0, Math.round(dias));
  while (quedan > 0) {
    fecha.setDate(fecha.getDate() + 1);
    const dia = fecha.getDay();
    if (dia !== 0 && dia !== 6) quedan -= 1;
  }
  return fecha;
}

/**
 * Las horas de los proyectos firmados que todavía no se entregaron.
 *
 * Nunca tira: si no se puede medir, devuelve 0 y la venta sigue como si la
 * agenda estuviera libre. Un fusible que corta la venta por un error propio
 * es peor que no tenerlo.
 */
export async function horasEnCurso(): Promise<number> {
  try {
    const db = getSupabaseAdmin();
    const { data: leads, error } = await db.from('leads').select('id').in('estado', EN_CURSO);
    if (error || !leads?.length) return 0;

    const { data: pedidos } = await db
      .from('pedidos')
      .select('paquete')
      .in('lead_id', (leads as { id: string }[]).map((l) => l.id))
      .not('firmado_at', 'is', null);

    return ((pedidos ?? []) as { paquete: string }[])
      .reduce((total, p) => total + (paquetePorSlug(p.paquete)?.horas ?? 0), 0);
  } catch (reason) {
    console.warn('[capacidad] No se pudo medir la carga:', reason);
    return 0;
  }
}

/**
 * La espera que quedó fijada en el pedido al crearlo.
 *
 * Se congela en ese momento y no se recalcula: si cambiara entre que el
 * cliente lee el contrato y lo firma, firmaría un plazo distinto del que
 * leyó. Si la columna todavía no existe (migración 045 sin aplicar), es 0 y
 * todo funciona como antes.
 */
export async function esperaDelPedido(pedidoId: string): Promise<number> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from('pedidos')
      .select('espera_dias')
      .eq('id', pedidoId)
      .maybeSingle();
    if (error) return 0;
    const dias = (data as { espera_dias: number | null } | null)?.espera_dias;
    return typeof dias === 'number' && dias > 0 ? dias : 0;
  } catch {
    return 0;
  }
}
