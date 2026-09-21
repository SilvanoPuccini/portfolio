import { parseSelectedModules } from './selected-modules';
import { suggestDeposit } from './deposit';

/**
 * El diagnóstico que ve el cliente.
 *
 * Es lo que hasta ahora se mandaba como un .docx adjunto y un correo que
 * decía «mirá el adjunto»: un documento que el cliente abre, hojea y pierde.
 * Acá el mismo contenido vive en una página con su link, que se lee en el
 * teléfono, no se rompe en ningún cliente de correo y se puede corregir sin
 * reenviar nada.
 *
 * Se arma UNA vez, al mandar la propuesta, y se guarda como foto. Si después
 * se toca el presupuesto en el panel, lo que el cliente ya recibió no cambia
 * bajo sus pies: lo que se le mandó es lo que dice el documento.
 *
 * Lo que NO entra: las objeciones previstas y el motivo por el que algo no se
 * ofrece. Eso está escrito para Silvano, no para el cliente, y mandárselo
 * sería como adjuntar las notas internas de la reunión.
 */

export interface DiagnosisDoc {
  cliente: string;
  problema: string;
  solucion: string;
  /** Qué se lleva, módulo por módulo. */
  incluye: { titulo: string; detalle?: string; horas?: number; precioUsd?: number }[];
  /** Lo que queda para una segunda etapa. Sin el motivo interno. */
  masAdelante: string[];
  inversion: {
    total: number;
    /** Lo que se paga para arrancar. */
    sena: number;
    saldo: number;
    pct: number;
  };
  /** Mantenimiento mensual, si se acordó. */
  mantenimiento: number | null;
  horas: number;
  emitidoEl: string;
}

interface LeadForDoc {
  nombre?: string | null;
  monto_presupuestado?: number | null;
  horas_calculadas?: number | null;
  modulos_seleccionados?: unknown;
  mantenimiento_mensual?: number | null;
  sena_pct?: number | null;
  pago_unico?: boolean | null;
  recomendacion?: unknown;
  diagnostico_dolor?: string | null;
  diagnostico_situacion?: string | null;
  diagnostico_requerimiento?: string | null;
}

interface StoredRecommendation {
  problema?: string;
  solucion?: string;
  modulos?: { slug?: string; porque?: string }[];
  no_ofrecer?: { que?: string }[];
}

const firstLine = (text: string | null | undefined): string => {
  const clean = (text ?? '').trim();
  if (!clean) return '';
  // Los campos del diagnóstico guardan «pregunta\nrespuesta»: al cliente le
  // sirve la respuesta, no el interrogatorio.
  const lines = clean.split('\n').map((line) => line.trim()).filter(Boolean);
  return lines.length > 1 ? lines[1] : lines[0];
};

export function buildDiagnosisDoc(lead: LeadForDoc, now = new Date()): DiagnosisDoc | null {
  const total = lead.monto_presupuestado;
  if (total == null || total <= 0) return null;

  const recommendation = (lead.recomendacion ?? {}) as StoredRecommendation;
  const modules = parseSelectedModules(lead.modulos_seleccionados);
  const reasons = new Map(
    (recommendation.modulos ?? [])
      .filter((mod): mod is { slug: string; porque?: string } => Boolean(mod?.slug))
      .map((mod) => [mod.slug, mod.porque?.trim() ?? '']),
  );

  const single = lead.pago_unico === true;
  const suggested = suggestDeposit(total);
  const pct = single ? 100 : (lead.sena_pct ?? suggested.pct);
  const sena = Math.round((total * pct) / 100);

  return {
    cliente: lead.nombre?.trim() || 'Hola',
    // Sin recomendación de IA se cae a lo anotado en la llamada: el documento
    // sale igual, con las palabras del cliente en vez de las del modelo.
    problema: recommendation.problema?.trim()
      || firstLine(lead.diagnostico_dolor)
      || firstLine(lead.diagnostico_situacion),
    solucion: recommendation.solucion?.trim() || firstLine(lead.diagnostico_requerimiento),
    incluye: modules.map((mod) => ({
      titulo: mod.label,
      detalle: reasons.get(mod.slug) || undefined,
      horas: mod.horas,
      precioUsd: mod.precioUsd,
    })),
    masAdelante: (recommendation.no_ofrecer ?? [])
      .map((item) => item?.que?.trim() ?? '')
      .filter(Boolean),
    inversion: { total: Math.round(total), sena, saldo: Math.round(total) - sena, pct },
    mantenimiento: lead.mantenimiento_mensual ?? null,
    horas: Math.round(lead.horas_calculadas ?? 0),
    emitidoEl: now.toISOString(),
  };
}
