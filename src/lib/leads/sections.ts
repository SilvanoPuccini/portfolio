/**
 * Los cuatro momentos de la ficha.
 *
 * Antes eran ocho secciones sueltas y varias decían lo mismo: «Formulario»,
 * «Detalles del servicio» y «Datos del cliente» eran tres cajas para la misma
 * pregunta —quién es y qué pidió—, y el diagnóstico estaba duplicado entre la
 * guía y una sección aparte. Ocho cajones no ordenan: obligan a buscar.
 *
 * Ahora la ficha sigue el recorrido de la venta: quién es, la llamada, qué le
 * cotizamos y cómo viene el cierre. Se abre sola la que corresponde al estado,
 * y cada una se presenta con un renglón de resumen, así el detalle se lee solo
 * cuando hace falta.
 */

export type SectionId = 'cliente' | 'llamada' | 'diagnostico' | 'venta';

export interface LeadSection {
  id: SectionId;
  title: string;
  /** En qué estados esta sección es lo que toca mirar. */
  activeIn: string[];
}

const CAPTACION = ['nuevo', 'llamada_agendada', 'no_show'];
const LLAMADA = ['en conversación'];
const VENTA = ['presupuestado', 'contrato_enviado', 'contrato_firmado'];

export const LEAD_SECTIONS: LeadSection[] = [
  { id: 'cliente', title: 'El cliente', activeIn: CAPTACION },
  { id: 'llamada', title: 'La llamada', activeIn: [...CAPTACION, ...LLAMADA] },
  { id: 'diagnostico', title: 'El diagnóstico', activeIn: [...LLAMADA, 'presupuestado'] },
  { id: 'venta', title: 'La venta', activeIn: VENTA },
];

/** Los estados donde la venta ya no se trabaja: nada tiene que abrirse solo. */
const CLOSED_STATES = ['cerrado', 'facturado', 'entregado', 'descartado'];

export function opensAt(id: SectionId, estado: string): boolean {
  if (estado === 'descartado') return false;

  const section = LEAD_SECTIONS.find((candidate) => candidate.id === id);
  if (!section) return false;

  // Un estado que no reconocemos (la columna es `text` libre y hay filas
  // viejas) se trata como arranque: mejor mostrar el principio que nada.
  const known = LEAD_SECTIONS.some((candidate) => candidate.activeIn.includes(estado))
    || CLOSED_STATES.includes(estado);

  return known ? section.activeIn.includes(estado) : section.activeIn.includes('nuevo');
}

/** Las cuatro secciones con su estado de apertura, en orden. */
export function sectionsFor(estado: string): (LeadSection & { open: boolean })[] {
  return LEAD_SECTIONS.map((section) => ({ ...section, open: opensAt(section.id, estado) }));
}
