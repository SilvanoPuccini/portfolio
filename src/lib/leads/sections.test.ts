import { describe, expect, it } from 'vitest';
import { LEAD_SECTIONS, opensAt, sectionsFor } from './sections';

describe('opensAt', () => {
  it('abre el cuestionario mientras se está captando', () => {
    expect(opensAt('cuestionario', 'nuevo')).toBe(true);
    expect(opensAt('cuestionario', 'llamada_agendada')).toBe(true);
  });

  it('cierra el cuestionario una vez que hablaron', () => {
    expect(opensAt('cuestionario', 'presupuestado')).toBe(false);
  });

  it('abre el diagnóstico justo después de la llamada', () => {
    expect(opensAt('diagnostico', 'en conversación')).toBe(true);
  });

  it('abre la calculadora cuando toca poner precio', () => {
    expect(opensAt('presupuesto', 'en conversación')).toBe(true);
    expect(opensAt('presupuesto', 'presupuestado')).toBe(true);
  });

  it('cierra la calculadora cuando la venta ya se cobró', () => {
    // Recalcular un precio ya cobrado no es lo que hay que hacer ahí.
    expect(opensAt('presupuesto', 'cerrado')).toBe(false);
  });

  it('abre la propuesta desde que hay presupuesto', () => {
    expect(opensAt('propuesta', 'presupuestado')).toBe(true);
    expect(opensAt('propuesta', 'contrato_enviado')).toBe(true);
  });

  it('no abre nada de venta en un lead perdido', () => {
    for (const section of LEAD_SECTIONS) {
      expect(opensAt(section.id, 'descartado')).toBe(false);
    }
  });

  it('con un estado desconocido abre el arranque en vez de quedarse mudo', () => {
    // La columna es text libre: puede haber filas viejas con cualquier cosa.
    expect(opensAt('formulario', 'lo-que-sea')).toBe(true);
  });
});

describe('sectionsFor', () => {
  it('devuelve todas las secciones, marcando cuáles arrancan abiertas', () => {
    const list = sectionsFor('en conversación');

    expect(list).toHaveLength(LEAD_SECTIONS.length);
    expect(list.find((section) => section.id === 'diagnostico')?.open).toBe(true);
    expect(list.find((section) => section.id === 'cuestionario')?.open).toBe(false);
  });

  it('nunca deja la ficha entera cerrada', () => {
    // Si ninguna sección abriera, la pantalla no mostraría nada.
    for (const estado of ['nuevo', 'llamada_agendada', 'en conversación', 'presupuestado', 'contrato_enviado', 'cerrado', 'facturado', 'entregado']) {
      expect(sectionsFor(estado).some((section) => section.open)).toBe(true);
    }
  });
});
