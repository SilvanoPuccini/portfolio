import { describe, expect, it } from 'vitest';
import { LEAD_SECTIONS, opensAt, sectionsFor } from './sections';

describe('opensAt', () => {
  it('abre «el cliente» mientras se lo está captando', () => {
    expect(opensAt('cliente', 'nuevo')).toBe(true);
    expect(opensAt('cliente', 'llamada_agendada')).toBe(true);
  });

  it('cierra «el cliente» una vez que ya hablaron', () => {
    expect(opensAt('cliente', 'presupuestado')).toBe(false);
  });

  it('abre la guía desde que hay llamada agendada y hasta que terminó', () => {
    expect(opensAt('llamada', 'llamada_agendada')).toBe(true);
    expect(opensAt('llamada', 'en conversación')).toBe(true);
  });

  it('abre el diagnóstico justo después de la llamada', () => {
    expect(opensAt('diagnostico', 'en conversación')).toBe(true);
    expect(opensAt('diagnostico', 'nuevo')).toBe(false);
  });

  it('abre la venta cuando ya hay propuesta o contrato', () => {
    expect(opensAt('venta', 'presupuestado')).toBe(true);
    expect(opensAt('venta', 'contrato_firmado')).toBe(true);
  });

  it('un lead perdido no abre nada: no hay nada que hacer ahí', () => {
    for (const section of LEAD_SECTIONS) {
      expect(opensAt(section.id, 'descartado')).toBe(false);
    }
  });

  it('un estado desconocido se trata como arranque', () => {
    // La columna es text libre y hay filas viejas: mejor mostrar el principio
    // que dejar la ficha entera cerrada.
    expect(opensAt('cliente', 'lo-que-sea')).toBe(true);
  });
});

describe('sectionsFor', () => {
  it('devuelve los cuatro momentos, marcando cuál arranca abierto', () => {
    const list = sectionsFor('en conversación');

    expect(list).toHaveLength(LEAD_SECTIONS.length);
    expect(list.find((section) => section.id === 'diagnostico')?.open).toBe(true);
    expect(list.find((section) => section.id === 'cliente')?.open).toBe(false);
  });

  it('sigue el recorrido de la venta, en orden', () => {
    expect(LEAD_SECTIONS.map((section) => section.id))
      .toEqual(['cliente', 'llamada', 'diagnostico', 'venta']);
  });

  it('nunca deja la ficha entera cerrada', () => {
    for (const estado of ['nuevo', 'llamada_agendada', 'en conversación', 'presupuestado', 'contrato_enviado']) {
      expect(sectionsFor(estado).some((section) => section.open)).toBe(true);
    }
  });
});
