/**
 * Paquetes de precio fijo que se contratan sin llamada.
 *
 * Cada paquete se firma desde un link directo de Documenso: el cliente pone su
 * nombre y mail, firma, y el webhook crea la venta con el precio de acá. Por
 * eso el precio y el alcance tienen que ser cerrados, y el texto de la
 * plantilla en Documenso tiene que decir lo mismo que este archivo.
 *
 * Para publicar uno:
 *   1. En Documenso, crear la plantilla del contrato y activarle el link directo.
 *   2. Copiar el ID de la plantilla en `documensoTemplateId` y el link en `directLink`.
 *   3. Poner `active: true`.
 * Sin los tres, el paquete no aparece en /services y una firma sobre esa
 * plantilla no crea ninguna venta.
 */

type Localized<T> = { es: T; en: T };

export interface FixedPackage {
  slug: string;
  /** El servicio de /services al que pertenece. */
  service: 'full-stack-builds' | 'automation-ai' | 'product-ux-engineering';
  name: Localized<string>;
  summary: Localized<string>;
  includes: Localized<string[]>;
  priceUsd: number;
  deliveryDays: number;
  /** Paquetes chicos se cobran completos por adelantado; si no, se usa la seña estándar. */
  singlePayment: boolean;
  documensoTemplateId: number | null;
  directLink: string | null;
  active: boolean;
}

export const PACKAGES: FixedPackage[] = [
  {
    // MODELO: precio, plazo y contenido a definir. Apagado hasta entonces.
    slug: 'auditoria-express',
    service: 'product-ux-engineering',
    name: { es: 'Auditoría técnica express', en: 'Express technical audit' },
    summary: {
      es: 'Revisión completa de tu sitio o sistema con un informe de prioridades para decidir antes de invertir.',
      en: 'A full review of your site or system with a prioritized report, so you can decide before investing.',
    },
    includes: {
      es: ['Revisión de código, rendimiento y seguridad', 'Informe escrito con prioridades', 'Llamada de 30 minutos para repasarlo'],
      en: ['Code, performance and security review', 'Written report with priorities', '30-minute call to walk through it'],
    },
    priceUsd: 250,
    deliveryDays: 5,
    singlePayment: true,
    documensoTemplateId: null,
    directLink: null,
    active: false,
  },
];

/** Los que se pueden mostrar y contratar: activos y con link. */
export function activePackages(packages: FixedPackage[] = PACKAGES): FixedPackage[] {
  return packages.filter((pkg) => pkg.active && pkg.directLink);
}

/** El paquete de una plantilla de Documenso. Solo activos: uno apagado no vende. */
export function packageForTemplate(
  templateId: number | string | null | undefined,
  packages: FixedPackage[] = PACKAGES,
): FixedPackage | null {
  if (templateId === null || templateId === undefined) return null;
  return packages.find((pkg) => pkg.active && pkg.documensoTemplateId === Number(templateId)) ?? null;
}
