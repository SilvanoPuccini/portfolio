import { describe, expect, it } from 'vitest';
import {
  buildAlerts, startOfTodayISO, LEAD_SILENCE_HOURS, PROPOSAL_SILENCE_DAYS,
  KICKOFF_PENDING_DAYS, SIGNED_UNPAID_DAYS, PAID_UNINVOICED_DAYS, type AlertInput,
} from './alerts';

const NOW = new Date('2026-09-18T15:00:00.000Z');

const hoursAgo = (hours: number) => new Date(NOW.getTime() - hours * 3_600_000).toISOString();
const daysAgo = (days: number) => hoursAgo(days * 24);

/** Un tablero sin nada que reclamar: todos los contadores en cero. */
function quiet(overrides: Partial<AlertInput> = {}): AlertInput {
  return {
    now: NOW,
    unreadMessages: 0,
    newSubscribersToday: 0,
    newLeads: [],
    sentProposals: [],
    failedThreads: 0,
    expiredContracts: 0,
    rejectedContracts: 0,
    latePieces: 0,
    unsentNewsletters: [],
    pendingKickoffs: [],
    thinking: [],
    unpaidSigned: [],
    uninvoiced: [],
    ...overrides,
  };
}

const idsOf = (input: AlertInput) => buildAlerts(input).map((alert) => alert.id);

describe('buildAlerts', () => {
  it('returns nothing when there is nothing to do', () => {
    expect(buildAlerts(quiet())).toEqual([]);
  });

  describe('leads sin contactar', () => {
    it('flags a lead that has been waiting longer than the silence window', () => {
      const [alert] = buildAlerts(quiet({
        newLeads: [{ id: 'l1', created_at: hoursAgo(LEAD_SILENCE_HOURS + 1) }],
      }));

      expect(alert.id).toBe('leads-sin-contactar');
      expect(alert.severity).toBe('urgent');
      expect(alert.count).toBe(1);
      expect(alert.href).toBe('/admin/leads');
    });

    it('leaves a fresh lead alone', () => {
      expect(idsOf(quiet({
        newLeads: [{ id: 'l1', created_at: hoursAgo(LEAD_SILENCE_HOURS - 1) }],
      }))).toEqual([]);
    });

    it('counts only the ones past the window and says so in singular', () => {
      const [alert] = buildAlerts(quiet({
        newLeads: [
          { id: 'l1', created_at: hoursAgo(72) },
          { id: 'l2', created_at: hoursAgo(2) },
        ],
      }));

      expect(alert.count).toBe(1);
      expect(alert.text).toContain('1 lead');
      expect(alert.text).not.toContain('leads');
    });

    it('uses the plural form for more than one', () => {
      const [alert] = buildAlerts(quiet({
        newLeads: [
          { id: 'l1', created_at: hoursAgo(72) },
          { id: 'l2', created_at: hoursAgo(96) },
        ],
      }));

      expect(alert.text).toContain('2 leads');
    });
  });

  describe('propuestas sin respuesta', () => {
    it('flags a proposal that went silent past the window', () => {
      const [alert] = buildAlerts(quiet({
        sentProposals: [{ id: 'p1', proposal_sent_at: daysAgo(PROPOSAL_SILENCE_DAYS + 2) }],
      }));

      expect(alert.id).toBe('propuestas-sin-respuesta');
      expect(alert.severity).toBe('urgent');
    });

    it('leaves a recent proposal alone', () => {
      expect(idsOf(quiet({
        sentProposals: [{ id: 'p1', proposal_sent_at: daysAgo(PROPOSAL_SILENCE_DAYS - 1) }],
      }))).toEqual([]);
    });
  });

  describe('el correo que no salió', () => {
    it('is urgent: the post went out and the newsletter did not', () => {
      const [alert] = buildAlerts(quiet({
        unsentNewsletters: [{ post_slug: 'mi-post', notify_error: 'SMTP timeout' }],
      }));

      // Publicar sin avisar es peor que no publicar: el post existe y nadie
      // se entera. Por eso comparte severidad con los leads olvidados.
      expect(alert.id).toBe('newsletter-sin-enviar');
      expect(alert.severity).toBe('urgent');
      expect(alert.href).toBe('/admin/newsletter');
    });
  });

  describe('el contrato que venció', () => {
    it('es urgente: la venta estaba por cerrarse y se cayó', () => {
      const [alert] = buildAlerts(quiet({ expiredContracts: 1 }));
      expect(alert.id).toBe('contratos-vencidos');
      expect(alert.severity).toBe('urgent');
      expect(alert.text).toBe('1 contrato vencido sin firmar');
    });
  });

  describe('el contrato rechazado', () => {
    it('es urgente y pide llamar, no dar la venta por perdida', () => {
      const [alert] = buildAlerts(quiet({ rejectedContracts: 1 }));
      expect(alert.id).toBe('contratos-rechazados');
      expect(alert.severity).toBe('urgent');
      expect(alert.text).toContain('llamá');
    });
  });

  describe('avisos de trabajo pendiente', () => {
    it('warns about threads the AI could not write', () => {
      const [alert] = buildAlerts(quiet({ failedThreads: 2 }));
      expect(alert.id).toBe('hilos-con-problema');
      expect(alert.severity).toBe('warn');
      expect(alert.href).toBe('/admin/x');
    });

    it('warns about pieces that missed their date', () => {
      const [alert] = buildAlerts(quiet({ latePieces: 3 }));
      expect(alert.id).toBe('piezas-atrasadas');
      expect(alert.severity).toBe('warn');
      expect(alert.href).toBe('/admin/agenda');
    });

    it('warns about unread messages', () => {
      const [alert] = buildAlerts(quiet({ unreadMessages: 4 }));
      expect(alert.id).toBe('mensajes-sin-leer');
      expect(alert.severity).toBe('warn');
    });

    it('reports new subscribers as good news, not as a task', () => {
      const [alert] = buildAlerts(quiet({ newSubscribersToday: 3 }));
      expect(alert.id).toBe('suscriptores-nuevos');
      expect(alert.severity).toBe('info');
    });
  });

  describe('orden', () => {
    it('puts what costs money first and good news last', () => {
      const ids = idsOf(quiet({
        newSubscribersToday: 5,
        unreadMessages: 2,
        failedThreads: 1,
        newLeads: [{ id: 'l1', created_at: hoursAgo(72) }],
        unsentNewsletters: [{ post_slug: 'p', notify_error: null }],
      }));

      expect(ids[0]).toBe('leads-sin-contactar');
      expect(ids.at(-1)).toBe('suscriptores-nuevos');
      // Todo lo urgente va antes que lo que solo avisa.
      const severities = buildAlerts(quiet({
        newSubscribersToday: 5,
        unreadMessages: 2,
        newLeads: [{ id: 'l1', created_at: hoursAgo(72) }],
      })).map((alert) => alert.severity);
      expect(severities).toEqual(['urgent', 'warn', 'info']);
    });
  });
});

describe('startOfTodayISO', () => {
  it('cuts the day at midnight in Buenos Aires, not in UTC', () => {
    // 01:30 UTC del 19 es todavía el 18 a las 22:30 en Buenos Aires: el día
    // arranca el 18 a las 00:00 locales, o sea 03:00 UTC del 18.
    const lateNight = new Date('2026-09-19T01:30:00.000Z');
    expect(startOfTodayISO(lateNight)).toBe('2026-09-18T03:00:00.000Z');
  });

  it('keeps the same calendar day during business hours', () => {
    expect(startOfTodayISO(new Date('2026-09-18T15:00:00.000Z'))).toBe('2026-09-18T03:00:00.000Z');
  });

  it('honours another time zone when asked', () => {
    expect(startOfTodayISO(new Date('2026-09-18T15:00:00.000Z'), 'UTC'))
      .toBe('2026-09-18T00:00:00.000Z');
  });
});

/**
 * La plata parada después de la firma.
 *
 * Hasta acá el tablero reclamaba todo lo que pasa ANTES de firmar y nada de
 * lo que pasa después. Un cliente que firmó y no agendó, una firma sin cobrar
 * y un cobro sin factura son las tres formas de perder plata en silencio.
 */
describe('buildAlerts — lo que queda después de la firma', () => {
  it('reclama el kickoff que nadie agendó', () => {
    const [alert] = buildAlerts(quiet({
      pendingKickoffs: [{ id: 'l1', contrato_firmado_at: daysAgo(KICKOFF_PENDING_DAYS + 1) }],
    }));

    expect(alert.id).toBe('kickoff-sin-agendar');
    expect(alert.severity).toBe('warn');
    expect(alert.count).toBe(1);
    expect(alert.href).toBe('/admin/leads');
  });

  it('le da tiempo al cliente recién firmado', () => {
    expect(idsOf(quiet({
      pendingKickoffs: [{ id: 'l1', contrato_firmado_at: daysAgo(KICKOFF_PENDING_DAYS - 1) }],
    }))).toEqual([]);
  });

  it('reclama una firma que no se cobró', () => {
    const [alert] = buildAlerts(quiet({
      unpaidSigned: [{ id: 'l1', contrato_firmado_at: daysAgo(SIGNED_UNPAID_DAYS + 1) }],
    }));

    expect(alert.id).toBe('firmados-sin-cobrar');
    expect(alert.severity).toBe('urgent');
  });

  it('no reclama un cobro que todavía está en plazo', () => {
    expect(idsOf(quiet({
      unpaidSigned: [{ id: 'l1', contrato_firmado_at: daysAgo(SIGNED_UNPAID_DAYS - 1) }],
    }))).toEqual([]);
  });

  it('reclama un cobro sin factura', () => {
    const [alert] = buildAlerts(quiet({
      uninvoiced: [{ id: 'l1', cobrado_at: daysAgo(PAID_UNINVOICED_DAYS + 1) }],
    }));

    expect(alert.id).toBe('cobrados-sin-facturar');
    expect(alert.severity).toBe('warn');
  });

  it('una venta sin fecha de cobro no se reclama a ciegas', () => {
    // Sin fecha no hay forma de saber si está atrasada: reclamarla igual sería
    // ruido, y el ruido es lo que hace que se dejen de mirar los avisos.
    expect(idsOf(quiet({ uninvoiced: [{ id: 'l1', cobrado_at: null }] }))).toEqual([]);
  });

  it('reclama al cliente que pidió tiempo cuando se cumple el plazo', async () => {
    const [alert] = buildAlerts(quiet({
      thinking: [{ id: 'l1', propuesta_recordar_at: daysAgo(1) }],
    }));

    expect(alert.id).toBe('pidieron-tiempo');
    expect(alert.severity).toBe('urgent');
  });

  it('no lo apura antes de la fecha que eligió', async () => {
    // Escribirle antes de tiempo es apurarlo; después, perderlo.
    const enTresDias = new Date(NOW.getTime() + 3 * 86_400_000).toISOString();

    expect(idsOf(quiet({ thinking: [{ id: 'l1', propuesta_recordar_at: enTresDias }] }))).toEqual([]);
  });
});
