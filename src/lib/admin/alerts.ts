/**
 * Lo que el panel tiene que reclamarte hoy.
 *
 * Todo acá adentro son reglas: comparaciones de fecha y conteos. Ninguna
 * llamada a un modelo. Una alerta que a veces no llega no es una alerta, es
 * ruido — y depender de una cuota de API para avisar que un lead lleva tres
 * días esperando es exactamente la forma de perderse ese aviso el día que más
 * importa. La IA puede resumir esta lista después; construirla, no.
 *
 * La función es pura y recibe `now`: así se puede probar cada ventana de
 * silencio sin tocar el reloj del sistema.
 */

import { lastContactAt } from '@/lib/leads/last-contact';

/** Cuánto puede esperar un lead nuevo antes de que sea un problema. */
export const LEAD_SILENCE_HOURS = 48;

/**
 * Cuánto aguanta una propuesta enviada sin respuesta antes de reclamar.
 *
 * Cinco días es el número de Silvano, no una convención: al sexto día una
 * propuesta sin contestar ya se enfrió y el seguimiento llega tarde.
 */
export const PROPOSAL_SILENCE_DAYS = 5;

/**
 * Lo que pasa DESPUÉS de firmar también se enfría, y ahí la plata ya está
 * comprometida. Tres relojes distintos porque son tres problemas distintos:
 * un kickoff sin agendar frena el trabajo, una firma sin cobrar es plata que
 * no entró, y un cobro sin factura es una obligación que se acumula.
 */
export const KICKOFF_PENDING_DAYS = 3;
export const SIGNED_UNPAID_DAYS = 7;
export const PAID_UNINVOICED_DAYS = 5;

/**
 * La medianoche de hoy en la zona del negocio, como ISO UTC.
 *
 * «Suscriptores nuevos hoy» tiene que significar hoy acá, no en UTC. A las
 * 22:00 de Buenos Aires ya es el día siguiente en Londres: sin esto, el
 * contador se reseteaba a la noche y el aviso desaparecía antes de tiempo.
 */
export function startOfTodayISO(now: Date, timeZone = 'America/Argentina/Buenos_Aires'): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(now);

  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? '0');
  const elapsed = get('hour') * 3_600_000 + get('minute') * 60_000 + get('second') * 1000;

  return new Date(now.getTime() - elapsed - now.getMilliseconds()).toISOString();
}

export type AlertSeverity = 'urgent' | 'warn' | 'info';

export interface Alert {
  id: string;
  severity: AlertSeverity;
  /** La frase que se lee en el tablero, ya conjugada. */
  text: string;
  /** Adónde se va a resolver. Todo aviso lleva al lugar donde se arregla. */
  href: string;
  count: number;
}

export interface AlertInput {
  now: Date;
  unreadMessages: number;
  newSubscribersToday: number;
  /** Leads en estado `nuevo`: los que todavía no se contactaron. */
  newLeads: { id: string; created_at: string }[];
  /** Leads con propuesta mandada y sin cerrar ni descartar. */
  sentProposals: { id: string; proposal_sent_at: string; ultimo_contacto_at?: string | null }[];
  /** Hilos de X que quedaron en `error`. */
  failedThreads: number;
  /** Contratos que Documenso dio por vencidos sin firma. */
  expiredContracts: number;
  /** Contratos que el cliente rechazó en Documenso y siguen sin resolver. */
  rejectedContracts: number;
  /** Firmados que todavía no agendaron la reunión de arranque. */
  pendingKickoffs: { id: string; contrato_firmado_at: string | null }[];
  /** Firmados sin el cobro registrado. */
  unpaidSigned: { id: string; contrato_firmado_at: string | null }[];
  /** Cobrados sin factura emitida. */
  uninvoiced: { id: string; cobrado_at: string | null }[];
  /** Piezas cuya fecha ya pasó y siguen sin publicar. */
  latePieces: number;
  /** Posts publicados cuyo correo a suscriptores nunca salió. */
  unsentNewsletters: { post_slug: string; notify_error: string | null }[];
}

/** «1 lead» / «2 leads», sin el paréntesis feo de (s). */
function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

/** Como `olderThan`, pero sin fecha no reclama: un aviso a ciegas es ruido. */
function olderThanOrSkip(iso: string | null, now: Date, milliseconds: number): boolean {
  return Boolean(iso) && olderThan(iso as string, now, milliseconds);
}

function olderThan(iso: string, now: Date, milliseconds: number): boolean {
  const moment = new Date(iso).getTime();
  if (Number.isNaN(moment)) return false;
  return now.getTime() - moment > milliseconds;
}

/**
 * El orden de la lista es una decisión de negocio, no estética: primero lo que
 * cuesta plata si se enfría, después el trabajo pendiente, y al final lo que
 * solo es lindo de saber.
 */
const SEVERITY_ORDER: Record<AlertSeverity, number> = { urgent: 0, warn: 1, info: 2 };

export function buildAlerts(input: AlertInput): Alert[] {
  const alerts: Alert[] = [];

  const coldLeads = input.newLeads.filter(
    (lead) => olderThan(lead.created_at, input.now, LEAD_SILENCE_HOURS * 3_600_000),
  );
  if (coldLeads.length > 0) {
    alerts.push({
      id: 'leads-sin-contactar',
      severity: 'urgent',
      text: `${plural(coldLeads.length, 'lead', 'leads')} sin contactar hace más de ${LEAD_SILENCE_HOURS} h`,
      href: '/admin/leads',
      count: coldLeads.length,
    });
  }

  const silentProposals = input.sentProposals.filter(
    // Desde el último contacto: un seguimiento ya enviado reinicia el reloj
    // sin pisar la fecha real de la propuesta.
    (proposal) => olderThan(
      lastContactAt(proposal) ?? proposal.proposal_sent_at, input.now, PROPOSAL_SILENCE_DAYS * 86_400_000,
    ),
  );
  if (silentProposals.length > 0) {
    alerts.push({
      id: 'propuestas-sin-respuesta',
      severity: 'urgent',
      text: `${plural(silentProposals.length, 'propuesta', 'propuestas')} sin respuesta hace más de ${PROPOSAL_SILENCE_DAYS} días`,
      href: '/admin/leads',
      count: silentProposals.length,
    });
  }

  // Publicar sin avisar es peor que no publicar: el post ya existe y nadie se
  // entera. El correo sale solo cuando el post del domingo se publica desde el
  // calendario, así que un fallo acá es silencioso por naturaleza.
  if (input.unsentNewsletters.length > 0) {
    alerts.push({
      id: 'newsletter-sin-enviar',
      severity: 'urgent',
      text: `${plural(input.unsentNewsletters.length, 'post publicado', 'posts publicados')} sin correo a suscriptores`,
      href: '/admin/newsletter',
      count: input.unsentNewsletters.length,
    });
  }

  // Un contrato vencido es una venta que estaba por cerrarse y se cayó sin
  // que nadie dijera nada. Cuesta plata igual que un lead olvidado.
  if (input.expiredContracts > 0) {
    alerts.push({
      id: 'contratos-vencidos',
      severity: 'urgent',
      text: `${plural(input.expiredContracts, 'contrato vencido', 'contratos vencidos')} sin firmar`,
      href: '/admin/leads',
      count: input.expiredContracts,
    });
  }

  // Un rechazo casi siempre trae un motivo concreto: es una negociación
  // abierta, y se enfría rápido si nadie llama.
  if (input.rejectedContracts > 0) {
    alerts.push({
      id: 'contratos-rechazados',
      severity: 'urgent',
      text: `${plural(input.rejectedContracts, 'contrato rechazado', 'contratos rechazados')} — llamá para negociar`,
      href: '/admin/leads',
      count: input.rejectedContracts,
    });
  }

  // Lo que sigue pasa DESPUÉS de firmar: plata ya comprometida que se queda
  // quieta sin que nadie reclame. Antes el tablero solo miraba hasta la firma.
  const unpaid = input.unpaidSigned.filter(
    (lead) => olderThanOrSkip(lead.contrato_firmado_at, input.now, SIGNED_UNPAID_DAYS * 86_400_000),
  );
  if (unpaid.length > 0) {
    alerts.push({
      id: 'firmados-sin-cobrar',
      severity: 'urgent',
      text: `${plural(unpaid.length, 'contrato firmado', 'contratos firmados')} sin cobrar hace más de ${SIGNED_UNPAID_DAYS} días`,
      href: '/admin/leads',
      count: unpaid.length,
    });
  }

  const pendingKickoff = input.pendingKickoffs.filter(
    (lead) => olderThanOrSkip(lead.contrato_firmado_at, input.now, KICKOFF_PENDING_DAYS * 86_400_000),
  );
  if (pendingKickoff.length > 0) {
    alerts.push({
      id: 'kickoff-sin-agendar',
      severity: 'warn',
      text: `${plural(pendingKickoff.length, 'cliente firmado', 'clientes firmados')} sin agendar el kickoff`,
      href: '/admin/leads',
      count: pendingKickoff.length,
    });
  }

  const uninvoiced = input.uninvoiced.filter(
    (lead) => olderThanOrSkip(lead.cobrado_at, input.now, PAID_UNINVOICED_DAYS * 86_400_000),
  );
  if (uninvoiced.length > 0) {
    alerts.push({
      id: 'cobrados-sin-facturar',
      severity: 'warn',
      text: `${plural(uninvoiced.length, 'cobro', 'cobros')} sin facturar hace más de ${PAID_UNINVOICED_DAYS} días`,
      href: '/admin/leads',
      count: uninvoiced.length,
    });
  }

  if (input.failedThreads > 0) {
    alerts.push({
      id: 'hilos-con-problema',
      severity: 'warn',
      text: `${plural(input.failedThreads, 'hilo', 'hilos')} con problema`,
      href: '/admin/x',
      count: input.failedThreads,
    });
  }

  if (input.latePieces > 0) {
    alerts.push({
      id: 'piezas-atrasadas',
      severity: 'warn',
      text: `${plural(input.latePieces, 'pieza atrasada', 'piezas atrasadas')}`,
      href: '/admin/agenda',
      count: input.latePieces,
    });
  }

  if (input.unreadMessages > 0) {
    alerts.push({
      id: 'mensajes-sin-leer',
      severity: 'warn',
      text: `${plural(input.unreadMessages, 'mensaje', 'mensajes')} sin leer`,
      href: '/admin/messages',
      count: input.unreadMessages,
    });
  }

  if (input.newSubscribersToday > 0) {
    alerts.push({
      id: 'suscriptores-nuevos',
      severity: 'info',
      text: `${plural(input.newSubscribersToday, 'suscriptor nuevo', 'suscriptores nuevos')} hoy`,
      href: '/admin/subscribers',
      count: input.newSubscribersToday,
    });
  }

  return alerts.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}
