import {
  Document,
  Paragraph,
  TextRun,
  ImageRun,
  Packer,
} from 'docx';
import { docTitle, docSubtitle, clauseHeading, bodyParagraph, divider } from '@/lib/docx-helpers';

export type ContractData = {
  clientName: string;
  clientLocation: string;
  clientCountry: string;
  projectDescription: string;
  deliverables: string;
  totalHours: number;
  totalPrice: number;
  hourlyRate: number;
  paymentTerms: string;
  estimatedWeeks: number;
  legalClause: string;
  /**
   * La firma del Proveedor, ya impresa.
   *
   * Va como imagen en el propio contrato, no como un campo que haya que
   * firmar después: el Proveedor emite el documento ya conforme, y el cliente
   * recibe algo terminado en vez de una hoja a medio firmar.
   *
   * Vive solo en el PDF que se sube a Documenso. No entra al repositorio ni
   * al servidor: es una firma, no un recurso de la aplicación.
   */
  firmaProveedor?: Buffer;
  /**
   * El molde para Documenso: las partes que cambian por venta salen en blanco,
   * para poder apoyar encima los campos que el sistema rellena.
   *
   * Sale del MISMO texto que el contrato real: así la plantilla nunca se
   * despega de lo que firma el cliente.
   */
  plantilla?: boolean;
};

// Re-export Packer so the API route can use it without importing docx directly
export { Packer };

// ─── Helpers ────────────────────────────────────────────────────────────────
// Shared helpers imported from docx-helpers.ts; contract-specific helpers below

const title = docTitle;
const subtitle = docSubtitle;

function signatureLine(label: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: `${label}: ${'_'.repeat(50)}`,
        size: 24,
        font: 'Calibri',
        color: '2D2D2D',
      }),
    ],
    spacing: { before: 480, after: 160 },
  });
}

function signatureDetail(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        size: 22,
        font: 'Calibri',
        color: '6B6B8A',
        italics: true,
      }),
    ],
    spacing: { after: 80 },
  });
}

// ─── Builder ─────────────────────────────────────────────────────────────────

/** En el molde, lo que cambia por venta se deja en blanco para el campo. */
function hueco(largo = 34): string {
  return '_'.repeat(largo);
}

export function buildContract(data: ContractData): Document {
  /** El valor real, o el hueco cuando se está armando el molde. */
  const campo = <T>(valor: T, largo?: number): string =>
    data.plantilla ? hueco(largo) : String(valor);

  const today = new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const sections = [
    // ── Title block ──────────────────────────────────────────────────────────
    title('CONTRATO DE PRESTACIÓN DE SERVICIOS'),
    subtitle(`Buenos Aires, ${today}`),

    // ── Clause 1: PARTES ─────────────────────────────────────────────────────
    clauseHeading('I', 'PARTES'),
    bodyParagraph(
      'El presente contrato se celebra entre las siguientes partes:',
    ),
    bodyParagraph(
      'PROVEEDOR: Silvano Puccini, desarrollador web freelance, con domicilio en la Ciudad Autónoma de Buenos Aires, República Argentina. En adelante denominado "el Proveedor".',
    ),
    bodyParagraph(
      `CLIENTE: ${campo(data.clientName)}, con domicilio en ${campo(`${data.clientLocation}, ${data.clientCountry}`, 40)}. En adelante denominado "el Cliente".`,
    ),

    divider(),

    // ── Clause 2: OBJETO ─────────────────────────────────────────────────────
    clauseHeading('II', 'OBJETO'),
    bodyParagraph(
      'El Proveedor se compromete a prestar servicios de desarrollo web al Cliente, consistentes en:',
    ),
    bodyParagraph(
      data.plantilla ? `${hueco(62)}\n${hueco(62)}` : data.projectDescription,
      true,
    ),

    divider(),

    // ── Clause 3: ALCANCE Y ENTREGABLES ──────────────────────────────────────
    clauseHeading('III', 'ALCANCE Y ENTREGABLES'),
    bodyParagraph('Los entregables acordados en el marco del presente contrato son:'),
    bodyParagraph(
      data.plantilla
        ? [hueco(62), hueco(62), hueco(62), hueco(62), hueco(62)].join('\n')
        : data.deliverables,
      true,
    ),
    bodyParagraph(
      'Cualquier funcionalidad o desarrollo adicional que no esté contemplado en el presente apartado deberá ser acordado por escrito entre las partes y podrá dar lugar a una modificación del precio y/o los plazos.',
    ),

    divider(),

    // ── Clause 4: PLAZOS ─────────────────────────────────────────────────────
    clauseHeading('IV', 'PLAZOS'),
    bodyParagraph(
      `Los servicios darán comienzo una vez acreditado el primer pago y se estima una duración de ${campo(`${data.estimatedWeeks} semana${data.estimatedWeeks !== 1 ? 's' : ''}`, 26)}.`,
    ),
    bodyParagraph(
      'Los plazos indicados son estimativos. Demoras atribuibles al Cliente, incluyendo pero no limitándose a retrasos en la entrega de materiales, contenido o feedback, podrán extender los plazos acordados sin que ello implique incumplimiento por parte del Proveedor.',
    ),

    divider(),

    // ── Clause 5: PRECIO Y FORMA DE PAGO ─────────────────────────────────────
    clauseHeading('V', 'PRECIO Y FORMA DE PAGO'),
    bodyParagraph(
      `El precio total acordado por los servicios descritos es de ${campo(`USD ${data.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 26)}.`,
    ),
    bodyParagraph(`Forma de pago: ${campo(data.paymentTerms, 60)}`),
    bodyParagraph(
      'El pago deberá realizarse mediante transferencia bancaria internacional o por los medios digitales acordados entre las partes. El Proveedor no iniciará las tareas de cada etapa hasta recibir el pago correspondiente.',
    ),

    divider(),

    // ── Clause 6: PROPIEDAD INTELECTUAL ──────────────────────────────────────
    clauseHeading('VI', 'PROPIEDAD INTELECTUAL'),
    bodyParagraph(
      'Una vez realizado el pago total acordado, el Cliente adquirirá la titularidad plena sobre el código fuente, diseños y demás entregables desarrollados específicamente para este proyecto.',
    ),
    bodyParagraph(
      'El Proveedor conserva el derecho de mencionar el proyecto en su portfolio profesional y materiales de marketing, salvo expresa instrucción en contrario del Cliente.',
    ),
    bodyParagraph(
      'Las herramientas, librerías de terceros, frameworks y componentes reutilizables de propiedad del Proveedor que se incorporen al proyecto quedan sujetos a sus respectivas licencias de uso.',
    ),

    divider(),

    // ── Clause 7: LEGISLACIÓN APLICABLE ──────────────────────────────────────
    clauseHeading('VII', 'LEGISLACIÓN APLICABLE Y JURISDICCIÓN'),
    bodyParagraph(
      data.plantilla
        ? `El presente contrato se regirá e interpretará conforme a ${hueco(52)}, `
          + 'renunciando las partes a cualquier otro fuero o jurisdicción que pudiera corresponderles.'
        : data.legalClause,
    ),

    divider(),

    // ── Clause 8: CONFIDENCIALIDAD ────────────────────────────────────────────
    clauseHeading('VIII', 'CONFIDENCIALIDAD'),
    bodyParagraph(
      'Ambas partes se comprometen a mantener la más estricta confidencialidad respecto de la información técnica, comercial y estratégica que se intercambie en el marco del presente contrato.',
    ),
    bodyParagraph(
      'La obligación de confidencialidad se extiende por un período de dos (2) años contados desde la finalización del contrato, y subsiste aun en caso de rescisión anticipada.',
    ),

    divider(),

    // ── Clause 9: GARANTÍA ────────────────────────────────────────────────────
    clauseHeading('IX', 'GARANTÍA'),
    bodyParagraph(
      'El Proveedor garantiza el correcto funcionamiento de los entregables según las especificaciones acordadas durante un período de treinta (30) días corridos contados desde la entrega final.',
    ),
    bodyParagraph(
      'Durante dicho período, el Proveedor corregirá sin cargo adicional los defectos o errores que se detecten y que sean atribuibles al desarrollo realizado. Esta garantía no cubre modificaciones realizadas por el Cliente o terceros, ni errores derivados de integraciones con servicios externos ajenos al alcance del proyecto.',
    ),

    divider(),

    // ── Clause 10: LIMITACIÓN DE RESPONSABILIDAD ──────────────────────────────
    clauseHeading('X', 'LIMITACIÓN DE RESPONSABILIDAD'),
    bodyParagraph(
      'La responsabilidad total del Proveedor frente al Cliente, por cualquier causa, queda limitada al monto total efectivamente abonado en virtud del presente contrato.',
    ),
    bodyParagraph(
      'El Proveedor no será responsable por daños indirectos, lucro cesante, pérdida de datos o cualquier otro daño consecuencial que pudiera derivarse del uso o la imposibilidad de uso de los entregables, aun cuando hubiera sido advertido de la posibilidad de tales daños.',
    ),

    divider(),

    // ── Clause 11: TERMINACIÓN ────────────────────────────────────────────────
    clauseHeading('XI', 'TERMINACIÓN'),
    bodyParagraph(
      'Cualquiera de las partes podrá dar por terminado el presente contrato mediante notificación escrita con un preaviso mínimo de quince (15) días corridos.',
    ),
    bodyParagraph(
      'En caso de rescisión, el Cliente abonará los servicios efectivamente prestados hasta la fecha de terminación, calculados en proporción a las horas trabajadas. El Proveedor entregará el trabajo realizado hasta ese momento en el estado en que se encuentre.',
    ),

    divider(),

    // ── Clause 12: FUERZA MAYOR ──────────────────────────────────────────────
    clauseHeading('XII', 'FUERZA MAYOR'),
    bodyParagraph(
      'Ninguna de las partes será responsable por el incumplimiento de sus obligaciones cuando dicho incumplimiento sea consecuencia de causas ajenas a su control razonable, incluyendo pero no limitándose a: catástrofes naturales, actos de autoridad gubernamental, pandemia, conflictos bélicos, fallas generalizadas de infraestructura de internet u otras causas de fuerza mayor o caso fortuito.',
    ),
    bodyParagraph(
      'La parte afectada deberá notificar a la otra dentro de las cuarenta y ocho (48) horas de producido el evento, indicando su naturaleza y duración estimada. Las obligaciones quedarán suspendidas por el tiempo que dure la situación de fuerza mayor.',
    ),

    divider(),

    // ── Clause 13: DISPOSICIONES GENERALES ───────────────────────────────────
    clauseHeading('XIII', 'DISPOSICIONES GENERALES'),
    bodyParagraph(
      'Toda modificación al presente contrato deberá constar por escrito y ser suscrita por ambas partes para tener validez.',
    ),
    bodyParagraph(
      'El presente instrumento constituye el acuerdo completo y exclusivo entre las partes respecto de su objeto, y reemplaza cualquier entendimiento o negociación previa, verbal o escrita.',
    ),
    bodyParagraph(
      'Si alguna cláusula del presente contrato fuera declarada nula o inaplicable, el resto del acuerdo continuará vigente y produciendo plenos efectos.',
    ),

    divider(),

    // ── Signature block ──────────────────────────────────────────────────────
    new Paragraph({
      children: [
        new TextRun({
          text: 'FIRMAS',
          bold: true,
          size: 26,
          font: 'Calibri',
          color: '1A1A2E',
        }),
      ],
      // El bloque de firmas entero en una página. Partido entre dos, la firma
      // queda de un lado y el nombre del otro, y colocar los campos en
      // Documenso se vuelve un rompecabezas.
      pageBreakBefore: true,
      spacing: { before: 240, after: 240 },
    }),

    // El Proveedor no firma después: emite el contrato ya conforme. Su
    // asentimiento queda dado al emitirlo, que es cuando define el alcance y
    // el precio. Esperar su firma para habilitar el pago sería ponerle una
    // traba a la propia venta.
    ...(data.firmaProveedor
      ? [new Paragraph({
        children: [new ImageRun({
          type: 'png',
          data: data.firmaProveedor,
          transformation: { width: 170, height: 70 },
        })],
        spacing: { before: 400, after: 0 },
      })]
      : []),

    signatureLine('EL PROVEEDOR'),
    signatureDetail('Silvano Puccini'),
    signatureDetail('Desarrollador web freelance'),
    signatureDetail('Buenos Aires, Argentina'),
    signatureDetail(
      data.firmaProveedor
        ? 'Firmado al emitir el presente contrato.'
        : 'Conforme y firmado electrónicamente al emitir el presente contrato.',
    ),

    signatureLine('EL CLIENTE'),
    signatureDetail(data.plantilla ? '' : data.clientName),
    signatureDetail(data.plantilla ? '' : `${data.clientLocation}, ${data.clientCountry}`),

    // El mail del firmante, en su propio renglón: sin un lugar donde apoyarlo
    // el campo terminaba flotando sobre el texto de al lado.
    signatureLine('Email'),

    // La fecha la pone el firmante. Antes salía la fecha en que se generó el
    // documento, que en el molde queda congelada: todos los contratos
    // firmados decían el día en que se armó la plantilla.
    signatureLine('Fecha'),
  ];

  return new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 24,
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,    // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: sections,
      },
    ],
  });
}
