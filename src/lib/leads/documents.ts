import { getSupabaseAdmin } from '@/lib/supabase';
import { parseSelectedModules } from './selected-modules';
import { buildContract, Packer, type ContractData } from '@/lib/contract-template';

/**
 * El contrato que firma el cliente.
 *
 * Acá vivía también la propuesta en .docx. Se fue: la propuesta es una página
 * con su link, y mantener dos versiones del mismo documento garantiza que un
 * día digan cosas distintas. El contrato sigue siendo un archivo porque es lo
 * que se firma.
 *
 * Descargarlo y enviarlo producen exactamente el mismo archivo, porque es el
 * mismo código.
 */

/** «estefania ortigosa» → «Estefania Ortigosa». Sin tocar las preposiciones. */
function titleCase(text: string | null | undefined): string {
  const MINOR = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'e', 'en']);
  return (text ?? '').trim().split(/\s+/).filter(Boolean)
    .map((word, i) => (i > 0 && MINOR.has(word.toLowerCase())
      ? word.toLowerCase()
      : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ');
}

export interface GeneratedDoc {
  buffer: Buffer;
  filename: string;
}

/** Nombre de archivo legible y sin sorpresas en cualquier sistema. */
function slug(name: string): string {
  return name
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'cliente';
}

/** Una línea con lo que se cotizó: es el objeto real del contrato. */
function contractScope(lead: Record<string, unknown>): string {
  const solucion = firstAnswer(lead.diagnostico_requerimiento as string | null);
  const modules = parseSelectedModules(lead.modulos_seleccionados);

  if (modules.length > 0) {
    const lista = modules.map((mod) => mod.label).join(', ');
    return solucion ? `${solucion}. Incluye: ${lista}.` : `Desarrollo web que incluye: ${lista}.`;
  }
  return solucion;
}

/** Los entregables, uno por línea: es lo que después se reclama o se entrega. */
function contractDeliverables(lead: Record<string, unknown>): string {
  const modules = parseSelectedModules(lead.modulos_seleccionados);
  if (modules.length === 0) return firstAnswer(lead.diagnostico_requerimiento as string | null);

  return modules.map((mod) => `· ${mod.label} (${mod.horas} h estimadas)`).join('\n');
}

/**
 * La respuesta, sin la pregunta.
 *
 * Los campos del diagnóstico guardan «pregunta\nrespuesta» desde que la guía
 * los completa sola. En un contrato no puede entrar el interrogatorio.
 */
function firstAnswer(text: string | null): string {
  const lines = (text ?? '').split('\n').map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) return '';
  return lines.length > 1 ? lines[1] : lines[0];
}

export async function buildContractDoc(leadId: string, legalClause: string): Promise<GeneratedDoc | null> {
  const db = getSupabaseAdmin();

  const [leadResult, configResult] = await Promise.all([
    db.from('leads').select('*').eq('id', leadId).single(),
    db.from('rate_config').select('tarifa_hora, buffer_pct').eq('id', 1).single(),
  ]);

  if (leadResult.error || !leadResult.data) return null;

  const lead = leadResult.data as Record<string, unknown>;
  const config = (configResult.data ?? { tarifa_hora: 35, buffer_pct: 20 }) as { tarifa_hora: number };

  const country = (lead.pais as string | null) ?? '';
  const hourlyRate = config.tarifa_hora;
  const totalHours = (lead.horas_calculadas as number | null) ?? 0;
  const totalPrice = (lead.monto_presupuestado as number | null) ?? totalHours * hourlyRate;

  // La seña acordada manda sobre el default: si se negoció 30 %, el contrato
  // tiene que decir 30 % y no el 50 % de la plantilla.
  const senaPct = lead.sena_pct as number | null;
  const pagoUnico = lead.pago_unico as boolean | null;
  const paymentTerms = pagoUnico
    ? 'Pago único al inicio del proyecto'
    : senaPct != null
      ? `${senaPct}% al inicio, ${100 - senaPct}% contra entrega`
      : '50% al inicio, 50% contra entrega';

  const contractData: ContractData = {
    // Se escribe con mayúscula inicial: el cliente carga su nombre apurado y
    // un contrato que dice «estefania ortigosa, con domicilio en pucon» se lee
    // como un borrador, no como un documento.
    clientName: titleCase((lead.titular as string | null) || (lead.nombre as string) || 'Cliente'),
    clientLocation: titleCase((lead.localidad as string | null) ?? country) || 'Sin especificar',
    clientCountry: titleCase(country) || 'Sin especificar',
    // El objeto y el alcance salen de lo COTIZADO, no del formulario web. Un
    // contrato cuyo objeto dice «soy vendedora de ropa» —lo que el cliente
    // escribió apurado en la web— no describe ningún trabajo: describe a una
    // persona. Lo que se firma son los módulos que se presupuestaron.
    projectDescription: contractScope(lead) || 'Desarrollo web a medida según especificaciones acordadas.',
    deliverables: contractDeliverables(lead) || 'Entregables según especificaciones acordadas entre las partes.',
    totalHours,
    totalPrice,
    hourlyRate,
    paymentTerms,
    startDate: new Date().toISOString().split('T')[0],
    estimatedWeeks: Math.ceil(totalHours / 40) || 4,
    legalClause,
  };

  const doc = buildContract(contractData);
  return {
    buffer: await Packer.toBuffer(doc),
    filename: `contrato-${slug(contractData.clientName)}.docx`,
  };
}
