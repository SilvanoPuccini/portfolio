import { describe, expect, it } from 'vitest';

import { clausulasDelContrato, contratoComoTexto, type DatosDelContrato } from '@/content/contrato';
import { evidenciaDeFirma, huellaDelContrato, nombreCoincide } from './firma-propia';

const DATOS: DatosDelContrato = {
  clientName: 'Estefanía Ortigosa',
  clientLocation: 'Córdoba',
  clientCountry: 'Argentina',
  projectDescription: 'Landing de captación.',
  deliverables: 'Textos escritos\nBotón de WhatsApp',
  totalHours: 15,
  totalPrice: 450,
  hourlyRate: 30,
  excluded: 'Blog\nPanel para editar los textos',
  paymentTerms: 'Pago único de USD 450 por adelantado.',
  estimatedWeeks: 1,
  legalClause: 'Se rige por las leyes de Argentina.',
};

describe('el contrato como texto', () => {
  it('trae las trece cláusulas', () => {
    expect(clausulasDelContrato(DATOS)).toHaveLength(13);
  });

  it('lleva los datos de esta venta adentro', () => {
    const texto = contratoComoTexto(DATOS);

    expect(texto).toContain('Estefanía Ortigosa');
    expect(texto).toContain('Córdoba');
    expect(texto).toContain('USD 450.00');
    expect(texto).toContain('Botón de WhatsApp');
    expect(texto).toContain('leyes de Argentina');
  });

  it('dice lo que NO incluye, que es lo que evita la discusión de después', () => {
    const texto = contratoComoTexto(DATOS);
    expect(texto).toContain('Panel para editar los textos');
    expect(texto.toLowerCase()).toContain('no incluye');
  });

  it('sin exclusiones no inventa un apartado vacío', () => {
    const texto = contratoComoTexto({ ...DATOS, excluded: '' });
    expect(texto.toLowerCase()).not.toContain('no comprende');
  });

  it('no se saltea ninguna cláusula del medio', () => {
    const texto = contratoComoTexto(DATOS);
    for (const titulo of ['PARTES', 'OBJETO', 'GARANTÍA', 'TERMINACIÓN', 'DISPOSICIONES GENERALES']) {
      expect(texto).toContain(titulo);
    }
  });
});

describe('la huella del contrato', () => {
  it('es la misma para el mismo contrato', () => {
    expect(huellaDelContrato(DATOS)).toBe(huellaDelContrato(DATOS));
  });

  it('cambia si cambia una sola palabra', () => {
    // Es lo que prueba que el contrato archivado es el que se firmó.
    const otro = { ...DATOS, totalPrice: 451 };
    expect(huellaDelContrato(otro)).not.toBe(huellaDelContrato(DATOS));
  });

  it('no deja leer el contrato desde la huella', () => {
    const huella = huellaDelContrato(DATOS);
    expect(huella).toHaveLength(64);
    expect(huella).not.toContain('Estefanía');
  });
});

describe('el nombre que escribe al firmar', () => {
  it('acepta el nombre acordado, sin importar mayúsculas ni espacios', () => {
    expect(nombreCoincide('  estefanía   ortigosa ', 'Estefanía Ortigosa')).toBe(true);
    expect(nombreCoincide('ESTEFANIA ORTIGOSA', 'Estefanía Ortigosa')).toBe(true);
  });

  it('rechaza a otro que no es', () => {
    expect(nombreCoincide('Juan Pérez', 'Estefanía Ortigosa')).toBe(false);
    expect(nombreCoincide('', 'Estefanía Ortigosa')).toBe(false);
    expect(nombreCoincide('Estefanía', 'Estefanía Ortigosa')).toBe(false);
  });
});

describe('la evidencia que se guarda', () => {
  const pedido = { ip: '190.1.2.3', navegador: 'Chrome 153 en Windows' };

  it('guarda cuándo, desde dónde y qué se firmó', () => {
    const evidencia = evidenciaDeFirma(DATOS, 'Estefanía Ortigosa', pedido);

    expect(evidencia.nombre).toBe('Estefanía Ortigosa');
    expect(evidencia.ip).toBe('190.1.2.3');
    expect(evidencia.navegador).toContain('Chrome');
    expect(evidencia.huella).toBe(huellaDelContrato(DATOS));
    expect(new Date(evidencia.firmadoAt).getTime()).toBeGreaterThan(0);
  });

  it('guarda el texto completo, no solo la huella', () => {
    // La huella prueba que no cambió; el texto es lo que se lee si hay que
    // discutirlo. Sin el texto, la huella no sirve de nada.
    const evidencia = evidenciaDeFirma(DATOS, 'Estefanía Ortigosa', pedido);
    expect(evidencia.texto).toContain('PARTES');
  });

  it('recorta un navegador absurdamente largo', () => {
    const largo = 'x'.repeat(1000);
    expect(evidenciaDeFirma(DATOS, 'E O', { ip: '1.1.1.1', navegador: largo }).navegador.length)
      .toBeLessThanOrEqual(300);
  });
});
