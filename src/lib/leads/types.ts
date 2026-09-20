/**
 * La forma de un lead y de lo que la calculadora necesita para estimar.
 *
 * Vive acá y no dentro de la pantalla porque ahora la comparten la ficha y sus
 * secciones. Mientras estuvo declarado dentro del componente, cualquier pedazo
 * que quisiera salir tenía que llevarse una copia del tipo.
 */

export interface Lead {
  id: string;
  created_at: string;
  nombre: string;
  email: string;
  telefono: string | null;
  tipo_proyecto: string | null;
  que_construir: string | null;
  secciones: string | null;
  tiene_login: boolean | null;
  tiene_pagos: boolean | null;
  tiene_admin: string | null;
  integraciones: string[] | null;
  idiomas: number | null;
  tiene_marca: boolean | null;
  tiene_contenido: boolean | null;
  problema: string | null;
  presupuesto_rango: string | null;
  plazo: string | null;
  canal_llamada: string | null;
  estado: string;
  titular: string | null;
  localidad: string | null;
  pais: string | null;
  notas_llamada: string | null;
  diagnostico_objetivo: string | null;
  diagnostico_situacion: string | null;
  diagnostico_requerimiento: string | null;
  diagnostico_dolor: string | null;
  diagnostico_deseo: string | null;
  diagnostico_preocupaciones: string | null;
  monto_presupuestado: number | null;
  horas_calculadas: number | null;
  fecha_llamada: string | null;
  grabacion_url: string | null;
  transcripcion: string | null;
  pago_estado: string | null;
  service: string | null;
  service_data: Record<string, unknown> | null;
  proposal_sent_at: string | null;
  ultimo_contacto_at: string | null;
  propuesta_respuesta: string | null;
  modulos_seleccionados: unknown;
  guia_respuestas: unknown;
  mantenimiento_mensual: number | null;
  propuesta_snapshot: unknown;
  propuesta_token: string | null;
  /** Los hitos de la venta, para el historial de la ficha. */
  propuesta_respondida_at: string | null;
  contrato_firmado_at: string | null;
  kickoff_at: string | null;
  cobrado_at: string | null;
  factura_at: string | null;
  factura_numero: string | null;
  entregado_at: string | null;
  propuesta_rechazo_motivo: string | null;
  contract_sent_at: string | null;
  /** Documenso lo dio por vencido sin firma. */
  contrato_vencido_at?: string | null;
  /** Dónde quedó archivado el PDF firmado en Storage. */
  contrato_pdf_path?: string | null;
  contrato_abierto_at?: string | null;
  contrato_rechazado_at?: string | null;
  contrato_rechazo_motivo?: string | null;
}

export interface LeadModule {
  slug: string;
  label: string;
  horas_min: number;
  horas_max: number;
  categoria: string;
}

export interface RateConfig {
  tarifa_hora: number;
  buffer_pct: number;
}

/** Una fila de la estimación: optimista, más probable y pesimista. */
export interface PertRow {
  slug: string;
  label: string;
  o: number;
  m: number;
  p: number;
  selected: boolean;
}

/** PERT: pondera el caso más probable cuatro veces contra los extremos. */
export function pertHours(o: number, m: number, p: number): number {
  return (o + 4 * m + p) / 6;
}

export function buildPertRows(modules: LeadModule[], selectedSlugs: Set<string>): PertRow[] {
  return modules.map((mod) => ({
    slug: mod.slug,
    label: mod.label,
    o: mod.horas_min,
    m: Math.round((mod.horas_min + mod.horas_max) / 2),
    p: mod.horas_max,
    selected: selectedSlugs.has(mod.slug),
  }));
}
