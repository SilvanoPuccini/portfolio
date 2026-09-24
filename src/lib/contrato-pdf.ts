import PDFDocument from 'pdfkit';

import { clausulasDelContrato } from '@/content/contrato';
import type { ContractData } from '@/lib/contract-template';

/**
 * El contrato como PDF.
 *
 * Antes se generaba con `docx` y se servía diciendo que era un PDF, así que no
 * abría en ningún lado. Pero el arreglo no era etiquetarlo bien y dejarlo en
 * Word: un contrato firmado en .docx es un documento editable, y lo que el
 * documento tiene que sostener es justamente que dice lo que decía.
 *
 * Un PDF no se edita de casualidad, se abre en cualquier teléfono sin instalar
 * nada, y es lo que espera cualquiera que lo reciba.
 *
 * El contenido sale de `clausulasDelContrato`, el MISMO lugar del que sale la
 * pantalla donde el cliente lo lee y el texto sobre el que se calcula la huella
 * de la firma. Si divergieran, la firma dejaría de probar algo.
 */

const MARGEN = 72;

const COLOR = {
  titulo: '#1A1A2E',
  texto: '#2D2D2D',
  tenue: '#6B6B8A',
  pie: '#9999AA',
  linea: '#D8D8E4',
} as const;

const FUENTE = 'Helvetica';
const FUENTE_NEGRITA = 'Helvetica-Bold';
const FUENTE_ITALICA = 'Helvetica-Oblique';

/** «22 de septiembre de 2026 a las 15:42 h» — legible y sin ambigüedad de zona. */
function fechaLegible(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).replace(',', ' a las ') + ' h (hora de Argentina)';
}

type Doc = PDFKit.PDFDocument;

/**
 * Si lo que viene entra en lo que queda de página.
 *
 * Sin esto un título de cláusula puede quedar solo al pie y su texto arrancar
 * en la página siguiente, que es la forma más rápida de que un contrato se lea
 * como un borrador.
 */
function necesitaEspacio(doc: Doc, alto: number): void {
  const disponible = doc.page.height - doc.page.margins.bottom - doc.y;
  if (disponible < alto) doc.addPage();
}

function titulo(doc: Doc, texto: string): void {
  doc.font(FUENTE_NEGRITA).fontSize(17).fillColor(COLOR.titulo);
  doc.text(texto, { align: 'center', characterSpacing: 0.4 });
  doc.moveDown(0.4);
}

function subtitulo(doc: Doc, texto: string): void {
  doc.font(FUENTE).fontSize(10.5).fillColor(COLOR.tenue);
  doc.text(texto, { align: 'center' });
  doc.moveDown(1.6);
}

function tituloDeClausula(doc: Doc, numero: string, texto: string): void {
  // El título y su primer párrafo no se separan: 64 puntos alcanzan para el
  // encabezado más dos renglones, que es lo mínimo que se lee como una unidad.
  necesitaEspacio(doc, 64);

  doc.font(FUENTE_NEGRITA).fontSize(11).fillColor(COLOR.titulo);
  doc.text(`${numero}. ${texto.toUpperCase()}`, { characterSpacing: 0.3 });
  doc.moveDown(0.45);
}

function parrafo(doc: Doc, texto: string): void {
  doc.font(FUENTE).fontSize(10.5).fillColor(COLOR.texto);
  doc.text(texto, { align: 'justify', lineGap: 2.5 });
  doc.moveDown(0.45);
}

function renglonConVinieta(doc: Doc, texto: string): void {
  necesitaEspacio(doc, 28);

  const sangria = 14;
  doc.font(FUENTE).fontSize(10.5).fillColor(COLOR.texto);

  const y = doc.y;
  doc.text('•', doc.page.margins.left, y, { continued: false });
  doc.text(texto, doc.page.margins.left + sangria, y, {
    width: doc.page.width - doc.page.margins.left - doc.page.margins.right - sangria,
    lineGap: 2,
  });
  doc.moveDown(0.3);
  // pdfkit se queda con la x de la sangría: sin esto, todo lo que sigue a
  // una lista sale corrido a la derecha.
  doc.x = doc.page.margins.left;
}

function separador(doc: Doc): void {
  doc.moveDown(0.5);
  const y = doc.y;
  doc.moveTo(doc.page.margins.left, y)
    .lineTo(doc.page.width - doc.page.margins.right, y)
    .lineWidth(0.6)
    .strokeColor(COLOR.linea)
    .stroke();
  doc.moveDown(0.9);
}

function encabezadoDeFirma(doc: Doc, etiqueta: string): void {
  doc.moveDown(1.1);
  doc.font(FUENTE_NEGRITA).fontSize(10.5).fillColor(COLOR.texto);
  doc.text(`${etiqueta}:`);
  doc.moveDown(0.35);
}

function detalleDeFirma(doc: Doc, texto: string): void {
  if (!texto.trim()) return;
  doc.font(FUENTE_ITALICA).fontSize(9.5).fillColor(COLOR.tenue);
  doc.text(texto, { lineGap: 1.5 });
  doc.moveDown(0.2);
}

/** El renglón para firmar a mano, cuando todavía no hay firma electrónica. */
function renglonParaFirmar(doc: Doc, etiqueta: string): void {
  doc.moveDown(1.2);
  doc.font(FUENTE).fontSize(10.5).fillColor(COLOR.texto);
  doc.text(`${etiqueta}: ${'_'.repeat(46)}`);
  doc.moveDown(0.3);
}

/**
 * «Página 2 de 5» al pie de todas. Se escribe al final, con el total sabido.
 *
 * El pie va DEBAJO del margen inferior, y ahí está la trampa: pdfkit salta de
 * página sola cuando el texto pasa ese margen. Escribirlo así agregaba una
 * página en blanco por cada página numerada — el contrato salía con el doble
 * de hojas y la mitad vacías.
 *
 * Se baja el margen a cero mientras se escribe el pie y se repone después, que
 * es la forma de decirle «acá abajo sé lo que estoy haciendo».
 */
function pieDeTodasLasPaginas(doc: Doc): void {
  const rango = doc.bufferedPageRange();

  for (let i = 0; i < rango.count; i++) {
    doc.switchToPage(rango.start + i);

    const margenOriginal = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    const y = doc.page.height - margenOriginal + 24;
    doc.font(FUENTE).fontSize(8.5).fillColor(COLOR.pie);
    doc.text(`Página ${i + 1} de ${rango.count}`, doc.page.margins.left, y, {
      width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
      align: 'center',
      lineBreak: false,
    });

    doc.page.margins.bottom = margenOriginal;
  }
}

/** «Córdoba, Argentina», o solo «Argentina»: sin comas colgando ni repetidos. */
function domicilioDe(data: ContractData): string {
  return [data.clientLocation, data.clientCountry]
    .map((parte) => parte?.trim() ?? '')
    .filter((parte, i, partes) => parte && partes.indexOf(parte) === i)
    .join(', ');
}

/** En el molde, lo que cambia por venta se deja en blanco para el campo. */
function hueco(largo = 34): string {
  return '_'.repeat(largo);
}

export function buildContractPdf(data: ContractData): Promise<Buffer> {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: MARGEN, right: MARGEN, bottom: MARGEN, left: MARGEN },
    // Necesario para poder numerar las páginas cuando ya se sabe cuántas hay.
    bufferPages: true,
    info: {
      Title: 'Contrato de prestación de servicios',
      Author: 'Silvano Puccini',
      Subject: data.projectDescription.slice(0, 120),
    },
  });

  const pedazos: Buffer[] = [];
  doc.on('data', (pedazo: Buffer) => pedazos.push(pedazo));

  const listo = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(pedazos)));
    doc.on('error', reject);
  });

  const hoy = new Date().toLocaleDateString('es-AR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  titulo(doc, 'CONTRATO DE PRESTACIÓN DE SERVICIOS');
  subtitulo(doc, `Buenos Aires, ${hoy}`);

  const clausulas = clausulasDelContrato({
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
    // Estos tres se perdían acá: la pantalla decía «7 días hábiles» y el PDF
    // «2 semanas». El PDF tiene que ser exactamente lo que el cliente leyó.
    plazoDiasHabiles: data.plantilla ? undefined : data.plazoDiasHabiles,
    detallePrecio: data.plantilla ? undefined : data.detallePrecio,
    cargoMensual: data.plantilla ? undefined : data.cargoMensual,
    legalClause: data.plantilla
      ? `El presente contrato se regirá e interpretará conforme a ${hueco(52)}, renunciando las partes a cualquier otro fuero o jurisdicción que pudiera corresponderles.`
      : data.legalClause,
  });

  clausulas.forEach((clausula, i) => {
    tituloDeClausula(doc, clausula.numero, clausula.titulo);
    clausula.parrafos.forEach((texto) => parrafo(doc, texto));

    // Un entregable por renglón: todos pegados en un párrafo, el alcance se
    // vuelve ilegible justo donde más claro tiene que estar.
    clausula.destacado?.split('\n').filter(Boolean).forEach((linea) => renglonConVinieta(doc, linea));

    // Lo que queda expresamente afuera: es la mitad que evita la discusión.
    if (clausula.excluido) {
      parrafo(doc, 'No incluye:');
      clausula.excluido.split('\n').filter(Boolean).forEach((linea) => renglonConVinieta(doc, linea));
    }

    clausula.parrafosFinales?.forEach((texto) => parrafo(doc, texto));

    if (i < clausulas.length - 1) separador(doc);
  });

  // El bloque de firmas entero en una página. Partido entre dos, la firma queda
  // de un lado y el nombre del otro.
  doc.addPage();
  doc.font(FUENTE_NEGRITA).fontSize(13).fillColor(COLOR.titulo);
  doc.text('FIRMAS', { characterSpacing: 0.4 });
  doc.moveDown(0.6);

  // El Proveedor no firma después: emite el contrato ya conforme. Su
  // asentimiento queda dado al emitirlo, que es cuando define el alcance y el
  // precio. Esperar su firma para habilitar el pago sería ponerle una traba a
  // la propia venta.
  if (data.firmaProveedor) {
    // Etiqueta, firma, línea, nombre: el orden en que se lee un bloque de
    // firma impreso. La imagen arriba de la etiqueta quedaba flotando.
    encabezadoDeFirma(doc, 'EL PROVEEDOR');
    try {
      doc.image(data.firmaProveedor, doc.page.margins.left, doc.y, { fit: [190, 56] });
      doc.y += 58;
    } catch {
      // Una firma que no se puede dibujar no puede tirar abajo el contrato:
      // el bloque sigue con el nombre y la conformidad escritos.
    }
    const y = doc.y;
    doc.moveTo(doc.page.margins.left, y).lineTo(doc.page.margins.left + 220, y)
      .lineWidth(0.6).strokeColor(COLOR.linea).stroke();
    doc.moveDown(0.4);
  } else {
    renglonParaFirmar(doc, 'EL PROVEEDOR');
  }

  detalleDeFirma(doc, 'Silvano Puccini');
  detalleDeFirma(doc, 'Desarrollador web freelance');
  detalleDeFirma(doc, 'Buenos Aires, Argentina');
  detalleDeFirma(doc, data.firmaProveedor
    ? 'Firmado al emitir el presente contrato.'
    : 'Conforme y firmado electrónicamente al emitir el presente contrato.');

  if (data.firmaCliente) {
    encabezadoDeFirma(doc, 'EL CLIENTE');

    // Con la firma hecha, el bloque del cliente lleva su evidencia: quién,
    // cuándo, desde dónde y sobre qué texto. Un documento que hay que cruzar
    // con una base de datos para saber si vale no sirve como comprobante.
    detalleDeFirma(doc, data.firmaCliente.nombre);
    detalleDeFirma(doc, domicilioDe(data));
    detalleDeFirma(
      doc,
      `Firmado electrónicamente el ${fechaLegible(data.firmaCliente.firmadoAt)} `
      + `desde la dirección ${data.firmaCliente.ip}.`,
    );
    detalleDeFirma(doc, `Huella del documento firmado: ${data.firmaCliente.huella}`);

    doc.moveDown(1.4);
    doc.font(FUENTE_ITALICA).fontSize(8.5).fillColor(COLOR.tenue);
    doc.text(
      'Este documento fue aceptado de forma electrónica. La huella es el resultado de aplicar '
      + 'SHA-256 al texto completo del contrato en el momento de la firma: cualquier '
      + 'modificación posterior daría un resultado distinto.',
      { align: 'justify', lineGap: 2 },
    );
  } else {
    encabezadoDeFirma(doc, 'EL CLIENTE');
    detalleDeFirma(doc, data.plantilla ? '' : data.clientName);
    detalleDeFirma(doc, data.plantilla ? '' : domicilioDe(data));
    renglonParaFirmar(doc, 'Email');
    renglonParaFirmar(doc, 'Fecha');
  }

  pieDeTodasLasPaginas(doc);
  doc.end();

  return listo;
}
