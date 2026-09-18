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

/** Cuánto puede esperar un lead nuevo antes de que sea un problema. */
export const LEAD_SILENCE_HOURS = 48;

/** Cuánto aguanta una propuesta enviada sin respuesta antes de reclamar. */
export const PROPOSAL_SILENCE_DAYS = 7;

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
  sentProposals: { id: string; proposal_sent_at: string }[];
  /** Hilos de X que quedaron en `error`. */
  failedThreads: number;
  /** Piezas cuya fecha ya pasó y siguen sin publicar. */
  latePieces: number;
  /** Posts publicados cuyo correo a suscriptores nunca salió. */
  unsentNewsletters: { post_slug: string; notify_error: string | null }[];
}

/** «1 lead» / «2 leads», sin el paréntesis feo de (s). */
function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
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
    (proposal) => olderThan(proposal.proposal_sent_at, input.now, PROPOSAL_SILENCE_DAYS * 86_400_000),
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
