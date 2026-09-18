import { getSupabaseAdmin } from '@/lib/supabase';
import { buildProposal, Packer } from '@/lib/proposal-template';
import { buildContract, Packer as ContractPacker, type ContractData } from '@/lib/contract-template';

/**
 * Los documentos que recibe el cliente: la propuesta y el contrato.
 *
 * Vive acá porque lo necesitan dos caminos y antes solo lo tenía uno. El
 * documento se armaba dentro de la ruta de descarga, así que el correo —que
 * anunciaba «adjunto»— no tenía forma de conseguirlo. El cliente recibía un
 * aviso que prometía un archivo que nunca viajaba.
 *
 * Ahora descargar y enviar producen exactamente el mismo archivo, porque es el
 * mismo código. Si fueran dos, un día dirían cosas distintas.
 */

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

/**
 * La propuesta. Devuelve `null` si todavía no hay presupuesto guardado: sin
 * monto ni horas el documento saldría vacío, y es mejor no mandar nada que
 * mandar una propuesta en blanco.
 */
export async function buildProposalDoc(leadId: string): Promise<GeneratedDoc | null> {
  const db = getSupabaseAdmin();

  const { data: lead, error } = await db
    .from('leads')
    .select('nombre, email, tipo_proyecto, monto_presupuestado, horas_calculadas, plazo')
    .eq('id', leadId).single();

  if (error || !lead) return null;
  if (lead.monto_presupuestado == null || lead.horas_calculadas == null) return null;

  const [{ data: modules }, { data: config }] = await Promise.all([
    db.from('modulos_presupuesto').select('slug, label, horas_min, horas_max').order('label'),
    db.from('config_presupuesto').select('tarifa_hora').single(),
  ]);

  const hourlyRate: number = config?.tarifa_hora ?? 35;
  const totalHours: number = lead.horas_calculadas;
  const totalPrice: number = lead.monto_presupuestado;

  const moduleList = (modules ?? []).map((m: { label: string; horas_min: number; horas_max: number }) => ({
    label: m.label,
    hours: Math.round((m.horas_min + m.horas_max) / 2),
  }));

  const doc = buildProposal({
    clientName: lead.nombre,
    projectName: `${lead.nombre} — ${lead.tipo_proyecto ?? 'Project'}`,
    problemSummary: 'Based on our discovery call, we identified your key challenges and goals.',
    solutionSummary: 'We propose a tailored development solution addressing your specific needs.',
    modules: moduleList,
    totalHours,
    totalPrice,
    hourlyRate,
    estimatedWeeks: lead.plazo
      ? Math.ceil(totalHours / (hourlyRate * 0.8))
      : Math.ceil(totalHours / 40),
    paymentTerms: '50% at project start, 50% on final delivery',
  });

  return { buffer: await Packer.toBuffer(doc), filename: `propuesta-${slug(lead.nombre)}.docx` };
}

/**
 * El contrato. `legalClause` viene de afuera porque la ruta de descarga la
 * pide a un modelo según el país del cliente, y generar eso dos veces para el
 * mismo contrato costaría una llamada de más.
 */
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
    clientName: (lead.titular as string | null) || (lead.nombre as string) || 'Cliente',
    clientLocation: (lead.localidad as string | null) ?? (country || 'Sin especificar'),
    clientCountry: country || 'Sin especificar',
    projectDescription:
      (lead.que_construir as string | null) ??
      (lead.diagnostico_requerimiento as string | null) ??
      'Desarrollo web a medida según especificaciones acordadas.',
    deliverables:
      (lead.diagnostico_requerimiento as string | null) ??
      (lead.que_construir as string | null) ??
      'Entregables según especificaciones acordadas entre las partes.',
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
    buffer: await ContractPacker.toBuffer(doc),
    filename: `contrato-${slug(contractData.clientName)}.docx`,
  };
}
