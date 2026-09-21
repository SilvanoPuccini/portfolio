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
  /** Lo estimado con PERT. Las líneas de catálogo no tienen horas: tienen precio cerrado. */
  horas?: number;
  /** El precio de lista de un paquete o un extra. */
  precioUsd?: number;
}

/** Un número positivo y finito, redondeado. Cualquier otra cosa es basura. */
function positivo(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return undefined;
  return Math.round(value);
}

export function parseSelectedModules(value: unknown): SelectedModule[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((row) => {
    if (!row || typeof row !== 'object') return [];
    const { slug, label, horas, precioUsd } = row as Record<string, unknown>;

    if (typeof slug !== 'string' || !slug.trim()) return [];
    if (typeof label !== 'string' || !label.trim()) return [];

    const h = positivo(horas);
    const precio = positivo(precioUsd);
    // Una línea sin horas y sin precio no dice nada: no entra en la propuesta.
    if (h === undefined && precio === undefined) return [];

    return [{ slug, label: label.trim(), horas: h, precioUsd: precio }];
  });
}

/** Lo que la propuesta necesita de cada línea: qué es, y sus horas o su precio. */
export function proposalModules(
  value: unknown,
): { label: string; hours?: number; priceUsd?: number }[] {
  return parseSelectedModules(value).map((mod) => ({
    label: mod.label,
    hours: mod.horas,
    priceUsd: mod.precioUsd,
  }));
}
