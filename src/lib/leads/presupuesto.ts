import {
  paquetePorSlug,
  servicioPorSlug,
  type Extra,
  type Paquete,
} from '@/content/servicios';
import { pertHours, type PertRow } from './types';

/**
 * El presupuesto de un lead, armado desde el catálogo.
 *
 * Antes se cotizaba módulo por módulo con PERT, incluso cuando el cliente
 * había elegido un paquete con precio cerrado. Eso es una herramienta para
 * estimar lo que no conocemos, y para el caso normal es de más.
 *
 * Ahora hay tres capas, y solo la última estima:
 *   1. El paquete del catálogo, con su precio de lista.
 *   2. Los extras del servicio, tildados.
 *   3. Lo que queda fuera del catálogo, que sí se estima con PERT.
 *
 * Lo que el paquete o un extra ya cubren no vuelve a aparecer en la tercera
 * capa: cobrarlo dos veces es el error que esta función existe para evitar.
 */

export type TipoLinea = 'paquete' | 'extra' | 'medida';

export interface LineaPresupuesto {
  tipo: TipoLinea;
  slug: string;
  label: string;
  precioUsd: number;
  /** Solo las líneas a medida tienen horas: las del catálogo tienen precio cerrado. */
  horas: number | null;
}

export interface Presupuesto {
  lineas: LineaPresupuesto[];
  /** Lo que sale del catálogo: paquete más extras de pago único. */
  catalogoUsd: number;
  /** Lo que se estimó con PERT. */
  medidaUsd: number;
  /** Horas a medida, con el buffer ya aplicado. */
  horasMedida: number;
  totalUsd: number;
  /** Lo que se cobra todos los meses: planes y extras mensuales. */
  mensualUsd: number;
  /** Cuando no hay paquete de catálogo y todo el número sale de la estimación. */
  esAMedida: boolean;
}

export interface EntradaPresupuesto {
  paqueteSlug?: string | null;
  extrasIds?: string[];
  pertRows?: PertRow[];
  tarifaHora: number;
  bufferPct: number;
}

/** Los módulos que el paquete y los extras elegidos ya cubren. */
function cubiertos(paquete: Paquete | null, extras: Extra[]): Set<string> {
  const slugs = new Set<string>(paquete?.modulos ?? []);
  for (const extra of extras) for (const slug of extra.modulos ?? []) slugs.add(slug);
  return slugs;
}

export function armarPresupuesto(entrada: EntradaPresupuesto): Presupuesto {
  const { paqueteSlug, extrasIds = [], pertRows = [], tarifaHora, bufferPct } = entrada;

  const paquete = paquetePorSlug(paqueteSlug);
  const servicio = paquete ? servicioPorSlug(paquete.servicio) : null;
  const extras = extrasIds
    .map((id) => servicio?.extras.find((e) => e.id === id))
    .filter((e): e is Extra => Boolean(e));

  const lineas: LineaPresupuesto[] = [];
  let catalogoUsd = 0;
  let mensualUsd = 0;

  if (paquete) {
    const precio = paquete.precioUsd ?? 0;
    if (paquete.recurrente) {
      mensualUsd += precio;
    } else {
      catalogoUsd += precio;
    }
    lineas.push({
      tipo: 'paquete',
      slug: paquete.slug,
      label: paquete.nombre.es,
      precioUsd: precio,
      horas: null,
    });
  }

  for (const extra of extras) {
    if (extra.recurrente) {
      mensualUsd += extra.precioUsd;
    } else {
      catalogoUsd += extra.precioUsd;
    }
    lineas.push({
      tipo: 'extra',
      slug: extra.id,
      label: extra.label.es,
      precioUsd: extra.precioUsd,
      horas: null,
    });
  }

  const yaCubiertos = cubiertos(paquete, extras);
  const aMedida = pertRows.filter((row) => row.selected && !yaCubiertos.has(row.slug));

  const horasCrudas = aMedida.reduce((total, row) => total + pertHours(row.o, row.m, row.p), 0);
  const horasMedida = horasCrudas * (1 + bufferPct / 100);
  const medidaUsd = horasMedida * tarifaHora;

  for (const row of aMedida) {
    const horas = pertHours(row.o, row.m, row.p) * (1 + bufferPct / 100);
    lineas.push({
      tipo: 'medida',
      slug: row.slug,
      label: row.label,
      precioUsd: horas * tarifaHora,
      horas,
    });
  }

  return {
    lineas,
    catalogoUsd,
    medidaUsd,
    horasMedida,
    totalUsd: catalogoUsd + medidaUsd,
    mensualUsd,
    esAMedida: paquete === null || paquete.precioUsd === null,
  };
}
