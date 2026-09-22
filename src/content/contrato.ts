/**
 * El contrato, como datos.
 *
 * Una sola fuente para las tres formas en que existe: lo que el cliente lee
 * en pantalla antes de firmar, el PDF que se archiva, y el texto sobre el que
 * se calcula la huella digital de la firma.
 *
 * Que sean lo mismo no es una comodidad: es lo que hace que la firma valga.
 * Si el cliente pudiera firmar una cosa y archivarse otra, no habría nada que
 * probar.
 */

export interface DatosDelContrato {
  clientName: string;
  clientLocation: string;
  clientCountry: string;
  projectDescription: string;
  /** Un entregable por línea. */
  deliverables: string;
  /**
   * Lo que el paquete NO incluye, un renglón por línea.
   *
   * Es la mitad que casi nadie escribe y la que evita la discusión de los
   * tres meses. Decir qué entra es vender; decir qué no entra es entregar.
   */
  excluded?: string;
  totalHours: number;
  totalPrice: number;
  hourlyRate: number;
  paymentTerms: string;
  estimatedWeeks: number;
  legalClause: string;
}

export interface Clausula {
  numero: string;
  titulo: string;
  parrafos: string[];
  /** Se muestra en bloque aparte: el alcance y el objeto son del cliente. */
  destacado?: string;
  /** Lo que queda expresamente fuera del alcance. */
  excluido?: string;
  /** Lo que va después del bloque destacado. */
  parrafosFinales?: string[];
}

const money = (valor: number) =>
  valor.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Las trece cláusulas, con los datos de esta venta adentro. */
export function clausulasDelContrato(data: DatosDelContrato): Clausula[] {
  const semanas = `${data.estimatedWeeks} semana${data.estimatedWeeks !== 1 ? 's' : ''}`;

  return [
    {
      numero: 'I',
      titulo: 'PARTES',
      parrafos: [
      'El presente contrato se celebra entre las siguientes partes:',
      'PROVEEDOR: Silvano Puccini, desarrollador web freelance, con domicilio en la Ciudad Autónoma de Buenos Aires, República Argentina. En adelante denominado "el Proveedor".',
        `CLIENTE: ${data.clientName}, con domicilio en ${data.clientLocation}, ${data.clientCountry}. En adelante denominado "el Cliente".`,
      ],
    },
    {
      numero: 'II',
      titulo: 'OBJETO',
      parrafos: [
      'El Proveedor se compromete a prestar servicios de desarrollo web al Cliente, consistentes en:',
      ],
      destacado: data.projectDescription,
    },
    {
      numero: 'III',
      titulo: 'ALCANCE Y ENTREGABLES',
      parrafos: [
      'Los entregables acordados en el marco del presente contrato son:',
      ],
      destacado: data.deliverables,
      excluido: data.excluded?.trim() ? data.excluded : undefined,
      parrafosFinales: [
        'Cualquier funcionalidad o desarrollo adicional que no esté contemplado en el presente apartado deberá ser acordado por escrito entre las partes y podrá dar lugar a una modificación del precio y/o los plazos.',
      ],
    },
    {
      numero: 'IV',
      titulo: 'PLAZOS',
      parrafos: [
        `Los servicios darán comienzo una vez acreditado el primer pago y se estima una duración de ${semanas}.`,
      'Los plazos indicados son estimativos. Demoras atribuibles al Cliente, incluyendo pero no limitándose a retrasos en la entrega de materiales, contenido o feedback, podrán extender los plazos acordados sin que ello implique incumplimiento por parte del Proveedor.',
      ],
    },
    {
      numero: 'V',
      titulo: 'PRECIO Y FORMA DE PAGO',
      parrafos: [
        `El precio total acordado por los servicios descritos es de USD ${money(data.totalPrice)}.`,
        `Forma de pago: ${data.paymentTerms}`,
      'El pago deberá realizarse mediante transferencia bancaria internacional o por los medios digitales acordados entre las partes. El Proveedor no iniciará las tareas de cada etapa hasta recibir el pago correspondiente.',
      ],
    },
    {
      numero: 'VI',
      titulo: 'PROPIEDAD INTELECTUAL',
      parrafos: [
      'Una vez realizado el pago total acordado, el Cliente adquirirá la titularidad plena sobre el código fuente, diseños y demás entregables desarrollados específicamente para este proyecto.',
      'El Proveedor conserva el derecho de mencionar el proyecto en su portfolio profesional y materiales de marketing, salvo expresa instrucción en contrario del Cliente.',
      'Las herramientas, librerías de terceros, frameworks y componentes reutilizables de propiedad del Proveedor que se incorporen al proyecto quedan sujetos a sus respectivas licencias de uso.',
      ],
    },
    {
      numero: 'VII',
      titulo: 'LEGISLACIÓN APLICABLE Y JURISDICCIÓN',
      parrafos: [data.legalClause],
    },
    {
      numero: 'VIII',
      titulo: 'CONFIDENCIALIDAD',
      parrafos: [
      'Ambas partes se comprometen a mantener la más estricta confidencialidad respecto de la información técnica, comercial y estratégica que se intercambie en el marco del presente contrato.',
      'La obligación de confidencialidad se extiende por un período de dos (2) años contados desde la finalización del contrato, y subsiste aun en caso de rescisión anticipada.',
      ],
    },
    {
      numero: 'IX',
      titulo: 'GARANTÍA',
      parrafos: [
      'El Proveedor garantiza el correcto funcionamiento de los entregables según las especificaciones acordadas durante un período de treinta (30) días corridos contados desde la entrega final.',
      'Durante dicho período, el Proveedor corregirá sin cargo adicional los defectos o errores que se detecten y que sean atribuibles al desarrollo realizado. Esta garantía no cubre modificaciones realizadas por el Cliente o terceros, ni errores derivados de integraciones con servicios externos ajenos al alcance del proyecto.',
      ],
    },
    {
      numero: 'X',
      titulo: 'LIMITACIÓN DE RESPONSABILIDAD',
      parrafos: [
      'La responsabilidad total del Proveedor frente al Cliente, por cualquier causa, queda limitada al monto total efectivamente abonado en virtud del presente contrato.',
      'El Proveedor no será responsable por daños indirectos, lucro cesante, pérdida de datos o cualquier otro daño consecuencial que pudiera derivarse del uso o la imposibilidad de uso de los entregables, aun cuando hubiera sido advertido de la posibilidad de tales daños.',
      ],
    },
    {
      numero: 'XI',
      titulo: 'TERMINACIÓN',
      parrafos: [
      'Cualquiera de las partes podrá dar por terminado el presente contrato mediante notificación escrita con un preaviso mínimo de quince (15) días corridos.',
      'En caso de rescisión, el Cliente abonará los servicios efectivamente prestados hasta la fecha de terminación, calculados en proporción a las horas trabajadas. El Proveedor entregará el trabajo realizado hasta ese momento en el estado en que se encuentre.',
      ],
    },
    {
      numero: 'XII',
      titulo: 'FUERZA MAYOR',
      parrafos: [
      'Ninguna de las partes será responsable por el incumplimiento de sus obligaciones cuando dicho incumplimiento sea consecuencia de causas ajenas a su control razonable, incluyendo pero no limitándose a: catástrofes naturales, actos de autoridad gubernamental, pandemia, conflictos bélicos, fallas generalizadas de infraestructura de internet u otras causas de fuerza mayor o caso fortuito.',
      'La parte afectada deberá notificar a la otra dentro de las cuarenta y ocho (48) horas de producido el evento, indicando su naturaleza y duración estimada. Las obligaciones quedarán suspendidas por el tiempo que dure la situación de fuerza mayor.',
      ],
    },
    {
      numero: 'XIII',
      titulo: 'DISPOSICIONES GENERALES',
      parrafos: [
      'Toda modificación al presente contrato deberá constar por escrito y ser suscrita por ambas partes para tener validez.',
      'El presente instrumento constituye el acuerdo completo y exclusivo entre las partes respecto de su objeto, y reemplaza cualquier entendimiento o negociación previa, verbal o escrita.',
      'Si alguna cláusula del presente contrato fuera declarada nula o inaplicable, el resto del acuerdo continuará vigente y produciendo plenos efectos.',
      ],
    },
  ];
}

/**
 * El contrato como texto plano.
 *
 * Es lo que se le calcula la huella al firmar: si mañana cambia una coma del
 * contrato, la huella deja de coincidir y se nota.
 */
export function contratoComoTexto(data: DatosDelContrato): string {
  return clausulasDelContrato(data)
    .map((clausula) => [
      `${clausula.numero}. ${clausula.titulo}`,
      ...clausula.parrafos,
      clausula.destacado ?? '',
      clausula.excluido ? `No incluye:\n${clausula.excluido}` : '',
      ...(clausula.parrafosFinales ?? []),
    ].filter(Boolean).join('\n'))
    .join('\n\n');
}

/**
 * El contrato de una venta del catálogo.
 *
 * Lo usan las tres puntas: la pantalla donde el cliente lee antes de firmar,
 * el servidor cuando registra la firma, y el PDF que se archiva. Si cada una
 * lo armara por su cuenta, el cliente podría estar leyendo algo distinto de
 * lo que firma.
 */
export function contratoDeVenta(entrada: {
  paquete: {
    nombre: { es: string };
    resumen: { es: string };
    incluye: { es: string[] };
    noIncluye: { es: string[] };
    horas: number;
    plazoDias: number;
    pagoUnico: boolean;
  };
  extras: { label: { es: string } }[];
  cliente: { nombre: string; localidad?: string | null; pais?: string | null };
  totalUsd: number;
  jurisdiccion: string;
  tarifaHora?: number;
}): DatosDelContrato {
  const { paquete, extras, cliente, totalUsd } = entrada;

  return {
    clientName: cliente.nombre,
    clientLocation: cliente.localidad ?? cliente.pais ?? '',
    clientCountry: cliente.pais ?? '',
    projectDescription: `${paquete.nombre.es}. ${paquete.resumen.es}`,
    deliverables: [...paquete.incluye.es, ...extras.map((extra) => extra.label.es)].join('\n'),
    excluded: paquete.noIncluye.es.join('\n'),
    totalHours: paquete.horas,
    totalPrice: totalUsd,
    hourlyRate: entrada.tarifaHora ?? 30,
    paymentTerms: paquete.pagoUnico
      ? `Pago único de USD ${totalUsd.toLocaleString('es-AR')} por adelantado.`
      : 'Seña del 50% para comenzar y el saldo contra entrega.',
    estimatedWeeks: Math.max(1, Math.ceil(paquete.plazoDias / 5)),
    legalClause: entrada.jurisdiccion,
  };
}
