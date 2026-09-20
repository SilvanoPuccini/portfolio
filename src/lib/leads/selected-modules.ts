/**
 * El alcance cotizado, tal como quedó guardado.
 *
 * Viene de una columna `jsonb`, así que puede traer cualquier cosa: filas
 * viejas con otra forma, un null, o el resultado de un guardado a medias. Se
 * valida fila por fila y lo que no sirve se descarta — una propuesta con un
 * módulo «undefined — NaN h» es peor que una sin ese módulo.
 */

export interface SelectedModule {
  slug: string;
  label: string;
  horas: number;
}

export function parseSelectedModules(value: unknown): SelectedModule[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((row) => {
    if (!row || typeof row !== 'object') return [];
    const { slug, label, horas } = row as Record<string, unknown>;

    if (typeof slug !== 'string' || !slug.trim()) return [];
    if (typeof label !== 'string' || !label.trim()) return [];
    if (typeof horas !== 'number' || !Number.isFinite(horas) || horas <= 0) return [];

    return [{ slug, label: label.trim(), horas: Math.round(horas) }];
  });
}

/** Lo que la propuesta necesita de cada módulo: qué es y cuántas horas lleva. */
export function proposalModules(value: unknown): { label: string; hours: number }[] {
  return parseSelectedModules(value).map((mod) => ({ label: mod.label, hours: mod.horas }));
}
