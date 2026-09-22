import {
  Document,
  Paragraph,
  TextRun,
  ImageRun,
  AlignmentType,
  Footer,
  PageNumber,
  Packer,
} from 'docx';
import {
  docTitle, docSubtitle, clauseHeading, bodyParagraph, bulletParagraph, divider,
} from '@/lib/docx-helpers';
import { clausulasDelContrato } from '@/content/contrato';

export type ContractData = {
  clientName: string;
  clientLocation: string;
  clientCountry: string;
  projectDescription: string;
  deliverables: string;
  /** Lo que el paquete NO incluye, un renglón por línea. */
  excluded?: string;
  totalHours: number;
  totalPrice: number;
  hourlyRate: number;
  paymentTerms: string;
  estimatedWeeks: number;
  legalClause: string;
  /**
   * La firma del cliente, cuando ya firmó en nuestro sitio.
   *
   * Va impresa en el documento con su evidencia: sin eso, el PDF archivado no
   * prueba nada por sí solo y hay que ir a buscar la base de datos.
   */
  firmaCliente?: {
    nombre: string;
    firmadoAt: string;
    ip: string;
    huella: string;
  };
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

/** «22 de septiembre de 2026, 15:42 h» — legible y sin ambigüedad de zona. */
function fechaLegible(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).replace(',', ' a las ') + ' h (hora de Argentina)';
}

/** El encabezado del bloque cuando la firma ya está: sin renglón que llenar. */
function signatureTitle(label: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}:`, size: 24, font: 'Calibri', color: '2D2D2D' }),
    ],
    spacing: { before: 420, after: 120 },
    keepNext: true,
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

  const today = new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const sections = [
    title('CONTRATO DE PRESTACIÓN DE SERVICIOS'),
    subtitle(`Buenos Aires, ${today}`),

    // Las cláusulas salen del mismo lugar que la pantalla donde el cliente
    // las lee y que el texto sobre el que se calcula la huella de la firma.
    // Si divergieran, la firma dejaría de probar nada.
    ...clausulasDelContrato({
      clientName: data.plantilla ? hueco(34) : data.clientName,
      clientLocation: data.plantilla ? hueco(20) : data.clientLocation,
      clientCountry: data.plantilla ? '' : data.clientCountry,
      projectDescription: data.plantilla ? `${hueco(62)}\n${hueco(62)}` : data.projectDescription,
      deliverables: data.plantilla
        ? [hueco(62), hueco(62), hueco(62), hueco(62), hueco(62)].join('\n')
        : data.deliverables,
      excluded: data.plantilla ? undefined : data.excluded,
      totalHours: data.totalHours,
      totalPrice: data.totalPrice,
      hourlyRate: data.hourlyRate,
      paymentTerms: data.plantilla ? hueco(60) : data.paymentTerms,
      estimatedWeeks: data.estimatedWeeks,
      legalClause: data.plantilla
        ? `El presente contrato se regirá e interpretará conforme a ${hueco(52)}, renunciando las partes a cualquier otro fuero o jurisdicción que pudiera corresponderles.`
        : data.legalClause,
    }).flatMap((clausula) => [
      clauseHeading(clausula.numero, clausula.titulo),
      ...clausula.parrafos.map((parrafo) => bodyParagraph(parrafo)),
      // Un entregable por renglón: todos pegados en un párrafo, el alcance
      // se vuelve ilegible justo donde más claro tiene que estar.
      ...(clausula.destacado
        ? clausula.destacado.split('\n').filter(Boolean).map((linea) => bulletParagraph(linea))
        : []),
      // Lo que queda expresamente afuera: es la mitad que evita la discusión.
      ...(clausula.excluido
        ? [
          bodyParagraph('No incluye:'),
          ...clausula.excluido.split('\n').filter(Boolean).map((linea) => bulletParagraph(linea)),
        ]
        : []),
      ...(clausula.parrafosFinales ?? []).map((parrafo) => bodyParagraph(parrafo)),
      divider(),
    ]),

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

    data.firmaProveedor ? signatureTitle('EL PROVEEDOR') : signatureLine('EL PROVEEDOR'),
    signatureDetail('Silvano Puccini'),
    signatureDetail('Desarrollador web freelance'),
    signatureDetail('Buenos Aires, Argentina'),
    signatureDetail(
      data.firmaProveedor
        ? 'Firmado al emitir el presente contrato.'
        : 'Conforme y firmado electrónicamente al emitir el presente contrato.',
    ),

    data.firmaCliente ? signatureTitle('EL CLIENTE') : signatureLine('EL CLIENTE'),

    // Con la firma hecha, el bloque del cliente lleva su evidencia: quién,
    // cuándo, desde dónde y sobre qué texto. Un PDF que hay que cruzar con
    // una base de datos para saber si vale no sirve como comprobante.
    ...(data.firmaCliente
      ? [
        signatureDetail(data.firmaCliente.nombre),
        signatureDetail(`${data.clientLocation}, ${data.clientCountry}`),
        signatureDetail(
          `Firmado electrónicamente el ${fechaLegible(data.firmaCliente.firmadoAt)} `
          + `desde la dirección ${data.firmaCliente.ip}.`,
        ),
        signatureDetail(`Huella del documento firmado: ${data.firmaCliente.huella}`),
      ]
      : [
        signatureDetail(data.plantilla ? '' : data.clientName),
        signatureDetail(data.plantilla ? '' : `${data.clientLocation}, ${data.clientCountry}`),
        signatureLine('Email'),
        signatureLine('Fecha'),
      ]),

    ...(data.firmaCliente
      ? [new Paragraph({
        children: [
          new TextRun({
            text: 'Este documento fue aceptado de forma electrónica. La huella es el resultado de '
              + 'aplicar SHA-256 al texto completo del contrato en el momento de la firma: '
              + 'cualquier modificación posterior daría un resultado distinto.',
            size: 18,
            font: 'Calibri',
            color: '6B6B8A',
            italics: true,
          }),
        ],
        spacing: { before: 600, after: 0, line: 280 },
        alignment: AlignmentType.JUSTIFIED,
      })]
      : []),

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
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'Página ', size: 18, font: 'Calibri', color: '9999AA' }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 18, font: 'Calibri', color: '9999AA' }),
                  new TextRun({ text: ' de ', size: 18, font: 'Calibri', color: '9999AA' }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, font: 'Calibri', color: '9999AA' }),
                ],
              }),
            ],
          }),
        },
        children: sections,
      },
    ],
  });
}
