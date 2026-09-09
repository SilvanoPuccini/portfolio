import type { PostPublicationStatus } from '@/lib/post-publications/types';

/**
 * Capa semántica sobre la paleta que el admin ya usaba. No se suman colores
 * nuevos: se le da UN rol a cada uno de los que ya estaban, para que el color
 * informe en vez de decorar.
 *
 * Contraste medido sobre la tarjeta (#111827) y el fondo (#0a0a14):
 *   text     #e2e8f0 → 14.39 / 15.97   OK
 *   textSoft #94a3b8 →  6.92 /  7.68   OK
 *   textDim  #8b9bb4 →  6.29 /  6.98   OK
 *   cyan     #00d4d4 →  9.60 / 10.66   OK
 *   green    #4ade80 → 10.18 / 11.30   OK
 *   amber    #fbbf24 → 10.63 / 11.80   OK
 *   red      #f87171 →  6.41 /  7.12   OK
 *
 * Los grises que traía el admin para texto chico no pasaban: #475569 daba
 * 2.34 y #64748b 3.73, ambos por debajo del 4.5 de WCAG. Quedan reservados
 * para bordes y puntos, que no son texto.
 */
export const c = {
  page: '#0a0a14',
  surface: '#111827',
  /** Elevación para la semana en curso: se distingue sin pedir otro color. */
  surfaceWeek: 'rgba(255,255,255,0.028)',
  border: '#1e293b',
  borderSoft: 'rgba(255,255,255,0.07)',

  text: '#e2e8f0',
  textSoft: '#94a3b8',
  textDim: '#8b9bb4',
  /** Solo bordes, puntos y separadores: no alcanza para texto. */
  hairline: '#64748b',

  planned: '#64748b',
  ready: '#00d4d4',
  published: '#4ade80',
  /** Le falta algo para poder preaprobarse. */
  incomplete: '#fbbf24',
  /** Se pasó la fecha y sigue sin publicar. */
  late: '#f87171',
} as const;

/** El color de un estado es el estado. Nunca se usa para decorar. */
export const STATUS_TONE: Record<PostPublicationStatus, string> = {
  planificado: c.planned,
  preaprobado: c.ready,
  publicado: c.published,
};

/**
 * Qué color le toca a una pieza en el calendario. El orden importa: publicado
 * gana siempre (ya está hecho, nada que reclamar), después lo atrasado, y solo
 * al final la falta de material.
 */
export function itemTone(item: { status: PostPublicationStatus; is_ready: boolean; scheduled_at: string }): string {
  if (item.status === 'publicado') return c.published;
  if (new Date(item.scheduled_at).getTime() < Date.now()) return c.late;
  if (!item.is_ready) return c.incomplete;
  return STATUS_TONE[item.status];
}

/** Fondo translúcido a partir de un tono, para chips sobre superficie oscura. */
export function tint(tone: string, alpha = '1f') {
  return `${tone}${alpha}`;
}

export const CHANNEL_LABEL = { blog: 'Blog', linkedin: 'LinkedIn' } as const;
export const CHANNEL_SHORT = { blog: 'BL', linkedin: 'IN' } as const;

/** Lunes como día 1: la semana editorial arranca el lunes, no el domingo. */
export function isoWeek(date: Date): number {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return Math.ceil(((target.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

export function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
