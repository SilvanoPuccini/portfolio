import { c } from '@/components/admin/tokens';
import type { DistributionStatus } from '@/lib/distribution/types';

/**
 * Una distribución tiene cinco estados y una pieza editorial tres, así que no
 * se pueden colapsar sin perder información: `archived` y `error` son estados
 * operativos reales que el blog y LinkedIn no tienen.
 *
 * Lo que sí se unifica es el VOCABULARIO VISUAL: cada estado toma uno de los
 * roles de color que ya usa el resto del admin, para que un borrador se lea
 * igual que un planificado y un error igual que un atrasado.
 */
export const DISTRIBUTION_TONE: Record<DistributionStatus, string> = {
  draft: c.planned,
  approved: c.ready,
  published: c.published,
  archived: c.hairline,
  error: c.late,
};

export const DISTRIBUTION_LABELS: Record<DistributionStatus, string> = {
  draft: 'Borrador',
  approved: 'Aprobado',
  published: 'Publicado',
  archived: 'Archivado',
  error: 'Error',
};

/** Qué equivale a qué en el circuito editorial, para leer las dos listas igual. */
export const DISTRIBUTION_EQUIVALENT: Record<DistributionStatus, string | null> = {
  draft: 'planificado',
  approved: 'preaprobado',
  published: 'publicado',
  archived: null,
  error: null,
};
