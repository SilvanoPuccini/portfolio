import { SchemaType, type Schema } from '@google/generative-ai';
import { callJson } from '@/lib/x/providers';

/**
 * Qué ofrecerle a este cliente, después de la llamada.
 *
 * El error caro de una venta de software no es cobrar poco: es ofrecer lo que
 * uno imaginó antes de escuchar. Este módulo existe como contrapeso de eso.
 * Recibe lo que el cliente dijo —formulario y diagnóstico— y devuelve una
 * recomendación que tiene que sostenerse con esas palabras.
 *
 * Dos reglas hacen el trabajo:
 *
 * 1. Los módulos salen del catálogo real (`modulos_precio`), con su slug.
 *    Un modelo suelto inventa «módulo de analítica avanzada» y no hay con qué
 *    cotizarlo ni construirlo.
 * 2. Si la información no alcanza, la salida tiene que decir qué falta
 *    preguntar en vez de recomendar igual. Un modelo al que le pedís una
 *    recomendación siempre te la da: esa complacencia es justo el riesgo.
 */

const RECOMMENDATION_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    problema: { type: SchemaType.STRING },
    solucion: { type: SchemaType.STRING },
    modulos: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          slug: { type: SchemaType.STRING },
          porque: { type: SchemaType.STRING },
        },
        required: ['slug', 'porque'],
      },
    },
    no_ofrecer: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          que: { type: SchemaType.STRING },
          porque: { type: SchemaType.STRING },
        },
        required: ['que', 'porque'],
      },
    },
    objeciones: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          objecion: { type: SchemaType.STRING },
          respuesta: { type: SchemaType.STRING },
        },
        required: ['objecion', 'respuesta'],
      },
    },
    falta_preguntar: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    confianza: { type: SchemaType.STRING },
  },
  required: ['problema', 'solucion', 'modulos', 'no_ofrecer', 'objeciones', 'falta_preguntar', 'confianza'],
};

export interface CatalogModule {
  slug: string;
  label: string;
  horas_min: number;
  horas_max: number;
}

export interface RecommendationContext {
  /** Lo que el cliente contestó en el formulario de la web. */
  formulario: Record<string, unknown>;
  /** Lo que se anotó durante la llamada, campo por campo. */
  diagnostico: Record<string, string | null | undefined>;
  /** Lo que falta del formulario: huecos conocidos, no supuestos. */
  huecos: string[];
  catalogo: CatalogModule[];
}

export interface Recommendation {
  problema: string;
  solucion: string;
  modulos: { slug: string; porque: string }[];
  no_ofrecer: { que: string; porque: string }[];
  objeciones: { objecion: string; respuesta: string }[];
  falta_preguntar: string[];
  /** «alta» | «media» | «baja»: qué tan sostenida está la recomendación. */
  confianza: string;
}

export function recommendationSystemPrompt(catalog: CatalogModule[]): string {
  const modules = catalog.map((m) => `- ${m.slug}: ${m.label} (${m.horas_min}–${m.horas_max} h)`).join('\n');

  return `
Ayudás a Silvano, que vende y construye software a medida, a decidir qué
ofrecerle a un cliente después de la llamada de diagnóstico.

Tu trabajo NO es entusiasmar. Es que lo que se ofrezca se sostenga con lo que
el cliente dijo, y avisar cuando no se sostiene.

CATÁLOGO DE MÓDULOS (lo único que se puede cotizar)
${modules || '- (vacío)'}

REGLAS
1. Usá SOLO lo que está en los datos. Si algo no está, no lo supongas.
2. No inventes módulos: los que recomiendes tienen que ser slugs EXACTOS del
   catálogo de arriba, sin cambiarles el nombre.
3. Recomendá lo MÍNIMO que resuelve el problema que el cliente describió. Si
   dudás entre dos alcances, proponé el más chico: lo que sobra se agrega
   después, lo que se prometió de más hay que construirlo igual.
4. «no_ofrecer» es obligatorio y tiene que tener al menos una cosa: algo que
   se podría vender pero que este cliente no necesita todavía, con el motivo.
5. Si el diagnóstico está flojo —sin problema claro, sin costo, sin quién
   decide—, poné confianza «baja», dejá «modulos» vacío y cargá
   «falta_preguntar» con las preguntas concretas que faltan. Recomendar sin
   diagnóstico es lo que hay que evitar.
6. «objeciones» son las que ESTE cliente va a poner, según lo que dijo (su
   presupuesto, sus preocupaciones, sus plazos). Nada genérico.
7. Escribí en español rioplatense, directo, sin vender. Silvano es el único
   que lo lee.

SALIDA
Solo JSON con: problema, solucion, modulos, no_ofrecer, objeciones,
falta_preguntar, confianza ("alta" | "media" | "baja").
`.trim();
}

export function recommendationInput(context: RecommendationContext): string {
  // Los vacíos se van: un campo en null invita al modelo a rellenarlo solo.
  const clean = (obj: Record<string, unknown>) => Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== null && value !== undefined && value !== ''),
  );

  return JSON.stringify({
    formulario: clean(context.formulario),
    diagnostico_de_la_llamada: clean(context.diagnostico),
    huecos_del_formulario: context.huecos.length ? context.huecos : undefined,
  }, null, 2);
}

/** Descarta los módulos que el modelo inventó: si no está en el catálogo, no existe. */
export function keepKnownModules(
  modules: { slug: string; porque: string }[], catalog: CatalogModule[],
): { slug: string; porque: string }[] {
  const known = new Set(catalog.map((m) => m.slug));
  return modules.filter((mod) => known.has(mod.slug));
}

export async function draftRecommendation(context: RecommendationContext) {
  const { data, provider, tokens } = await callJson<Recommendation>(
    recommendationSystemPrompt(context.catalogo),
    recommendationInput(context),
    RECOMMENDATION_SCHEMA,
  );

  return {
    ...data,
    modulos: keepKnownModules(data.modulos ?? [], context.catalogo),
    provider,
    tokens,
  };
}
