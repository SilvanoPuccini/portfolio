/**
 * Qué parte de la ficha corresponde mirar en cada fase.
 *
 * La ficha del lead tiene ocho secciones y las mostraba todas a la vez. Una
 * pantalla que muestra todo no te dice qué hacer ahora: para cargar el
 * diagnóstico de una llamada recién terminada hay que pasar por el formulario
 * de hace un mes, el cuestionario ya respondido y la calculadora todavía vacía.
 *
 * Nada se esconde: todas las secciones siguen ahí y se abren con un clic. Lo
 * único que cambia es cuál viene abierta.
 */

export type SectionId =
  | 'formulario'
  | 'servicio'
  | 'cuestionario'
  | 'transcripcion'
  | 'cliente'
  | 'diagnostico'
  | 'presupuesto'
  | 'propuesta';

export interface LeadSection {
  id: SectionId;
  title: string;
  /** En qué estados esta sección es lo que toca mirar. */
  activeIn: string[];
}

const CAPTACION = ['nuevo', 'llamada_agendada', 'no_show'];
const POST_LLAMADA = ['en conversación'];
const VENTA = ['presupuestado', 'contrato_enviado', 'contrato_firmado'];

export const LEAD_SECTIONS: LeadSection[] = [
  { id: 'formulario', title: 'Formulario', activeIn: CAPTACION },
  { id: 'servicio', title: 'Detalles del servicio', activeIn: CAPTACION },
  { id: 'cuestionario', title: 'Cuestionario', activeIn: CAPTACION },
  { id: 'cliente', title: 'Datos del cliente', activeIn: [...CAPTACION, ...POST_LLAMADA] },
  { id: 'transcripcion', title: 'Transcripción de la llamada', activeIn: POST_LLAMADA },
  { id: 'diagnostico', title: 'Diagnóstico de la llamada', activeIn: POST_LLAMADA },
  { id: 'presupuesto', title: 'Calculadora de presupuesto', activeIn: [...POST_LLAMADA, 'presupuestado'] },
  { id: 'propuesta', title: 'Prompt para propuesta', activeIn: VENTA },
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

/**
 * Todas las secciones, cada una sabiendo si arranca abierta.
 *
 * En las fases de cierre —cobrado, facturado, entregado— no hay nada de la
 * ficha que "toque": el trabajo está en la barra de arriba. Igual se abre el
 * resumen del formulario, porque una pantalla entera plegada parece rota.
 */
export function sectionsFor(estado: string): (LeadSection & { open: boolean })[] {
  const sections = LEAD_SECTIONS.map((section) => ({
    ...section,
    open: opensAt(section.id, estado),
  }));

  if (sections.some((section) => section.open)) return sections;

  return sections.map((section) => (
    section.id === 'formulario' ? { ...section, open: true } : section
  ));
}
