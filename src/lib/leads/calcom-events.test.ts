import { describe, expect, it } from 'vitest';
import { calcomEventOutcome, isSalesCallStage } from './calcom-events';

const AT = { startTime: '2026-09-25T14:00:00.000Z' };

describe('isSalesCallStage', () => {
  it.each(['nuevo', 'llamada_agendada', 'no_show', 'en conversación'])('«%s» es todavía la llamada de venta', (estado) => {
    expect(isSalesCallStage(estado)).toBe(true);
  });

  it.each(['presupuestado', 'contrato_enviado', 'contrato_firmado', 'cerrado', 'facturado', 'entregado'])(
    'desde «%s» cualquier reunión es con un cliente', (estado) => {
      expect(isSalesCallStage(estado)).toBe(false);
    },
  );

  it('un lead perdido no revive por agendar', () => {
    expect(isSalesCallStage('descartado')).toBe(false);
  });

  it('un estado desconocido cuenta como arranque', () => {
    expect(isSalesCallStage('lo-que-sea')).toBe(true);
  });
});

describe('calcomEventOutcome — la llamada de venta sigue igual', () => {
  it('agendar desde «nuevo» pasa a «llamada agendada»', () => {
    expect(calcomEventOutcome('BOOKING_CREATED', 'nuevo', AT).updates)
      .toEqual({ estado: 'llamada_agendada', fecha_llamada: AT.startTime });
  });

  it('agendar después de un no-show vuelve a «llamada agendada»', () => {
    expect(calcomEventOutcome('BOOKING_CREATED', 'no_show', AT).updates)
      .toMatchObject({ estado: 'llamada_agendada' });
  });

  it('cancelar la llamada de venta vuelve a «nuevo»', () => {
    expect(calcomEventOutcome('BOOKING_CANCELLED', 'llamada_agendada', {}).updates)
      .toEqual({ estado: 'nuevo', fecha_llamada: null });
  });

  it('terminar la llamada pasa a «en conversación»', () => {
    expect(calcomEventOutcome('MEETING_ENDED', 'llamada_agendada', {}).updates)
      .toEqual({ estado: 'en conversación' });
  });

  it('una segunda llamada antes de la propuesta actualiza la fecha sin retroceder', () => {
    expect(calcomEventOutcome('BOOKING_CREATED', 'en conversación', AT))
      .toEqual({ updates: { fecha_llamada: AT.startTime }, action: 'segunda_llamada' });
  });
});

describe('calcomEventOutcome — una reunión con un cliente no toca la venta', () => {
  // El caso que motivó todo: un cliente firmado que agenda el kickoff.
  const FIRMADO = 'contrato_firmado';

  it('agendar el kickoff no la devuelve a «llamada agendada»', () => {
    expect(calcomEventOutcome('BOOKING_CREATED', FIRMADO, AT))
      .toEqual({ updates: null, action: 'reunion_de_cliente' });
  });

  it('cancelar el kickoff no la devuelve a «nuevo»', () => {
    expect(calcomEventOutcome('BOOKING_CANCELLED', FIRMADO, {}).updates).toBeNull();
  });

  it('faltar al kickoff no la marca como no-show', () => {
    expect(calcomEventOutcome('BOOKING_NO_SHOW', FIRMADO, {}).updates).toBeNull();
  });

  it('terminar el kickoff no la devuelve a «en conversación»', () => {
    expect(calcomEventOutcome('MEETING_ENDED', 'cerrado', {}).updates).toBeNull();
  });

  it('reprogramar una reunión de cliente no pisa la fecha de la llamada de venta', () => {
    expect(calcomEventOutcome('BOOKING_RESCHEDULED', FIRMADO, AT).updates).toBeNull();
  });

  it('la grabación de la reunión no pisa la de la llamada de venta', () => {
    expect(calcomEventOutcome('RECORDING_DOWNLOAD_LINK_READY', 'facturado', {
      downloadLink: 'https://cal.com/rec/kickoff',
    }).updates).toBeNull();
  });

  it('la transcripción de la reunión no pisa la de la llamada de venta', () => {
    // Es la que usa la IA para escribir el seguimiento.
    expect(calcomEventOutcome('TRANSCRIPTION_GENERATED', 'presupuestado', {
      transcription: [{ text: 'Charla del kickoff' }],
    }).updates).toBeNull();
  });
});

describe('calcomEventOutcome — el cobro', () => {
  it('se registra siempre y avanza la venta hacia adelante', () => {
    expect(calcomEventOutcome('BOOKING_PAID', 'contrato_firmado', {}).updates)
      .toEqual({ pago_estado: 'pagado', estado: 'cerrado' });
  });

  it('no retrocede una venta ya facturada', () => {
    expect(calcomEventOutcome('BOOKING_PAID', 'facturado', {}).updates)
      .toEqual({ pago_estado: 'pagado' });
  });
});
