import { describe, expect, it } from 'vitest';

import { clienteUrl, etapaDelCliente } from './client-stage';

const base = {
  cuestionarioToken: null,
  cuestionarioCompleto: false,
  propuestaToken: null,
  propuestaEnviada: false,
  propuestaRespuesta: null,
  contratoFirmadoAt: null,
};

describe('etapaDelCliente', () => {
  it('con el cuestionario sin contestar, manda a contestarlo', () => {
    const etapa = etapaDelCliente({ ...base, cuestionarioToken: 'tok-q' });
    expect(etapa.etapa).toBe('cuestionario');
    expect(etapa.href).toBe('/questionnaire/tok-q');
  });

  it('contestado el cuestionario y sin propuesta, el cliente espera', () => {
    const etapa = etapaDelCliente({ ...base, cuestionarioToken: 'tok-q', cuestionarioCompleto: true });
    expect(etapa.etapa).toBe('espera');
    expect(etapa.href).toBeNull();
  });

  it('con la propuesta mandada, la muestra', () => {
    const etapa = etapaDelCliente({
      ...base,
      cuestionarioToken: 'tok-q',
      cuestionarioCompleto: true,
      propuestaToken: 'tok-p',
      propuestaEnviada: true,
    });
    expect(etapa.etapa).toBe('propuesta');
    expect(etapa.href).toBe('/propuesta/tok-p');
  });

  it('la propuesta gana sobre el cuestionario a medio contestar', () => {
    // Si ya hay propuesta, volver a las preguntas sería ir para atrás.
    const etapa = etapaDelCliente({
      ...base,
      cuestionarioToken: 'tok-q',
      propuestaToken: 'tok-p',
      propuestaEnviada: true,
    });
    expect(etapa.etapa).toBe('propuesta');
  });

  it('aceptada la propuesta, sigue siendo la misma pantalla: ahí se firma', () => {
    const etapa = etapaDelCliente({
      ...base,
      propuestaToken: 'tok-p',
      propuestaEnviada: true,
      propuestaRespuesta: 'aceptada',
    });
    expect(etapa.etapa).toBe('firma');
    expect(etapa.href).toBe('/propuesta/tok-p');
  });

  it('firmado el contrato, el circuito terminó', () => {
    const etapa = etapaDelCliente({
      ...base,
      propuestaToken: 'tok-p',
      propuestaEnviada: true,
      propuestaRespuesta: 'aceptada',
      contratoFirmadoAt: '2026-09-21T10:00:00.000Z',
    });
    expect(etapa.etapa).toBe('listo');
    expect(etapa.href).toBeNull();
  });

  it('una propuesta rechazada no sigue mostrándose como si esperara respuesta', () => {
    const etapa = etapaDelCliente({
      ...base,
      propuestaToken: 'tok-p',
      propuestaEnviada: true,
      propuestaRespuesta: 'rechazada',
    });
    expect(etapa.etapa).toBe('cerrada');
    expect(etapa.href).toBeNull();
  });

  it('sin nada todavía, el cliente espera', () => {
    expect(etapaDelCliente(base).etapa).toBe('espera');
  });

  it('una propuesta sin token no se puede mostrar', () => {
    const etapa = etapaDelCliente({ ...base, propuestaEnviada: true });
    expect(etapa.etapa).toBe('espera');
  });
});

describe('clienteUrl', () => {
  it('es siempre la misma dirección, con el token del lead', () => {
    expect(clienteUrl('https://x.dev', 'tok-lead', '/otro')).toBe('https://x.dev/cliente/tok-lead');
  });

  it('sin token del lead usa el link puntual de ese paso', () => {
    expect(clienteUrl('https://x.dev', null, 'https://x.dev/propuesta/tok-p'))
      .toBe('https://x.dev/propuesta/tok-p');
  });
});
