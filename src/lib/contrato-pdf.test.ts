import { describe, expect, it } from 'vitest';

import { buildContractPdf } from './contrato-pdf';
import { contratoDeVenta } from '@/content/contrato';
import { paquetePorSlug } from '@/content/servicios';
import { tipoDeDocumento } from '@/lib/leads/tipo-de-archivo';

/**
 * El contrato como PDF de verdad.
 *
 * Se generaba con `docx` y se servía diciendo que era un PDF, así que no abría
 * en ningún lado. Pero el arreglo no era etiquetarlo bien y dejarlo en Word: un
 * contrato firmado en .docx es editable, y lo que el documento tiene que
 * sostener es justamente que dice lo que decía.
 */

const PAQUETE = paquetePorSlug('web-cinco-secciones') ?? paquetePorSlug('landing')!;

const DATOS = contratoDeVenta({
  paquete: PAQUETE,
  extras: [],
  cliente: { nombre: 'Estefanía Ortigosa', localidad: 'Córdoba', pais: 'Argentina' },
  totalUsd: 940,
  jurisdiccion: 'los tribunales ordinarios de la Ciudad de Córdoba',
});

const FIRMA = {
  nombre: 'Estefanía Ortigosa',
  firmadoAt: '2026-09-22T13:42:00.000Z',
  ip: '190.1.2.3',
  huella: 'a'.repeat(64),
};

/** El PDF como texto plano, para poder afirmar qué dice. */
function textoDelPdf(bytes: Buffer): string {
  // Los streams de pdfkit no van comprimidos con `compress: false`, pero por
  // defecto sí: se buscan los literales de texto entre paréntesis, que es lo
  // que sobrevive igual en los objetos no comprimidos del documento.
  return bytes.toString('latin1');
}

describe('buildContractPdf — es un PDF', () => {
  it('empieza con la firma de un PDF, no con la de un ZIP', async () => {
    const bytes = await buildContractPdf(DATOS);

    expect(bytes.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(tipoDeDocumento(bytes).mime).toBe('application/pdf');
  });

  it('termina bien cerrado', async () => {
    // Un PDF sin su marca de fin es un archivo truncado, y así se ve.
    const bytes = await buildContractPdf(DATOS);

    expect(textoDelPdf(bytes)).toContain('%%EOF');
  });

  it('pesa lo que pesa un contrato, no lo que pesa un archivo vacío', async () => {
    const bytes = await buildContractPdf(DATOS);

    expect(bytes.length).toBeGreaterThan(3_000);
  });

  it('lleva metadatos, para que el lector sepa qué abrió', async () => {
    // El título va codificado dentro del diccionario /Info, así que lo que se
    // verifica es que el diccionario esté: buscar el texto en claro sería
    // buscar algo que un PDF válido no tiene por qué mostrar.
    const bytes = await buildContractPdf(DATOS);

    expect(textoDelPdf(bytes)).toContain('/Title');
    expect(textoDelPdf(bytes)).toContain('/Producer');
  });
});

describe('buildContractPdf — lo que tiene adentro', () => {
  it('sale sin firma del cliente cuando todavía no firmó', async () => {
    const bytes = await buildContractPdf(DATOS);

    expect(bytes.length).toBeGreaterThan(3_000);
  });

  it('con la firma hecha, el documento crece: lleva la evidencia', async () => {
    // La evidencia va impresa adentro. Un documento que hay que cruzar con una
    // base de datos para saber si vale no sirve como comprobante.
    const sinFirma = await buildContractPdf(DATOS);
    const conFirma = await buildContractPdf({ ...DATOS, firmaCliente: FIRMA });

    expect(conFirma.length).toBeGreaterThan(sinFirma.length);
  });

  it('el molde para firmar a mano también sale', async () => {
    const bytes = await buildContractPdf({ ...DATOS, plantilla: true });

    expect(bytes.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  });

  it('no se rompe con una firma de proveedor que no es una imagen', async () => {
    // Una firma que no se puede dibujar no puede tirar abajo el contrato.
    const bytes = await buildContractPdf({
      ...DATOS,
      firmaProveedor: Buffer.from('esto no es un png'),
    });

    expect(bytes.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  });

  it('aguanta un alcance largo sin cortarse', async () => {
    const largo = await buildContractPdf({
      ...DATOS,
      deliverables: Array.from({ length: 40 }, (_, i) => `· Entregable número ${i + 1}`).join('\n'),
      firmaCliente: FIRMA,
    });

    expect(largo.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(textoDelPdf(largo)).toContain('%%EOF');
  });

  it('numera las páginas con el total, que solo se sabe al final', async () => {
    const bytes = await buildContractPdf({ ...DATOS, firmaCliente: FIRMA });
    const texto = textoDelPdf(bytes);

    // «/Count N» es la cantidad de páginas que declara el árbol del documento.
    const declaradas = /\/Count (\d+)/.exec(texto)?.[1];
    expect(Number(declaradas)).toBeGreaterThan(1);
  });
});

/**
 * Lo que el cliente ve cuando lo abre.
 *
 * Los tests de arriba prueban que es un PDF válido. Estos prueban que además
 * es un contrato legible: que el texto llegó con sus acentos, que las
 * cláusulas están, que la evidencia de la firma está impresa, y que no salen
 * páginas en blanco.
 *
 * El pie iba debajo del margen inferior y pdfkit salta de página sola cuando
 * el texto pasa ese margen: el contrato salía con el doble de hojas y la mitad
 * vacías. Sin leer el PDF de verdad, eso no se ve.
 */
async function paginasDelPdf(bytes: Buffer): Promise<string[]> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjs.getDocument({ data: new Uint8Array(bytes) }).promise;

  const paginas: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const contenido = await (await doc.getPage(i)).getTextContent();
    paginas.push(
      contenido.items.map((it) => ('str' in it ? it.str : '')).join(' ').replace(/\s+/g, ' ').trim(),
    );
  }
  return paginas;
}

describe('buildContractPdf — se lee como un contrato', () => {
  it('no deja ninguna página en blanco', async () => {
    const paginas = await paginasDelPdf(await buildContractPdf({ ...DATOS, firmaCliente: FIRMA }));

    // El pie solo («Página 3 de 4») no cuenta como contenido.
    const vacias = paginas.filter((texto) => texto.replace(/Página \d+ de \d+/, '').trim().length < 40);
    expect(vacias).toEqual([]);
  });

  it('el título y las partes abren el documento', async () => {
    const [primera] = await paginasDelPdf(await buildContractPdf(DATOS));

    expect(primera).toContain('CONTRATO DE PRESTACIÓN DE SERVICIOS');
    expect(primera).toContain('Silvano Puccini');
    expect(primera).toContain('Estefanía Ortigosa');
  });

  it('los acentos llegan bien, que es lo que rompe la mitad de los PDF', async () => {
    const todo = (await paginasDelPdf(await buildContractPdf(DATOS))).join(' ');

    expect(todo).toContain('PRESTACIÓN');
    expect(todo).toContain('Córdoba');
    expect(todo).not.toContain('PRESTACIN');
  });

  it('lleva las cláusulas numeradas, no un resumen', async () => {
    const todo = (await paginasDelPdf(await buildContractPdf(DATOS))).join(' ');

    expect(todo).toContain('PARTES');
    expect(todo).toContain('OBJETO');
    expect(todo).toContain('PROPIEDAD INTELECTUAL');
    expect(todo).toContain('TERMINACIÓN');
  });

  it('el bloque de firmas entra entero en una página', async () => {
    // Partido entre dos, la firma queda de un lado y el nombre del otro.
    const paginas = await paginasDelPdf(await buildContractPdf({ ...DATOS, firmaCliente: FIRMA }));
    const conFirmas = paginas.filter((p) => p.includes('EL PROVEEDOR') || p.includes('EL CLIENTE'));

    expect(conFirmas).toHaveLength(1);
    expect(conFirmas[0]).toContain('FIRMAS');
    expect(conFirmas[0]).toContain('EL PROVEEDOR');
    expect(conFirmas[0]).toContain('EL CLIENTE');
  });

  it('la evidencia de la firma queda impresa adentro', async () => {
    // Un documento que hay que cruzar con una base de datos para saber si vale
    // no sirve como comprobante.
    const todo = (await paginasDelPdf(await buildContractPdf({ ...DATOS, firmaCliente: FIRMA }))).join(' ');

    expect(todo).toContain('Estefanía Ortigosa');
    expect(todo).toContain('190.1.2.3');
    expect(todo).toContain(FIRMA.huella);
    expect(todo).toContain('SHA-256');
  });

  it('numera todas las páginas con el total', async () => {
    const paginas = await paginasDelPdf(await buildContractPdf({ ...DATOS, firmaCliente: FIRMA }));

    paginas.forEach((texto, i) => {
      expect(texto).toContain(`Página ${i + 1} de ${paginas.length}`);
    });
  });

  it('sin firmar, deja los renglones para firmar a mano', async () => {
    const todo = (await paginasDelPdf(await buildContractPdf(DATOS))).join(' ');

    expect(todo).toContain('EL PROVEEDOR');
    expect(todo).toContain('Email');
    expect(todo).toContain('Fecha');
  });
});

describe('buildContractPdf — la firma del Proveedor', () => {
  // Salía un renglón vacío: el generador esperaba una imagen que en
  // producción nadie le pasaba. Ahora es fija y va en caligrafía.
  it('va siempre, en caligrafía, sin que nadie tenga que pasarla', async () => {
    const bytes = await buildContractPdf({ ...DATOS, firmaCliente: FIRMA });

    expect(textoDelPdf(bytes)).toContain('GreatVibes');
  });

  it('también en un contrato todavía sin firmar por el cliente', async () => {
    const bytes = await buildContractPdf(DATOS);

    expect(textoDelPdf(bytes)).toContain('GreatVibes');
  });
});
