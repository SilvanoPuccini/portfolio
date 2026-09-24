import { describe, expect, it } from 'vitest';

import {
  destinoEsMio, limpiarLectura, normalizarDestino, resumenDeRevision, revisarPago,
  type DatosComprobante, type LoEsperado,
} from './comprobante-ocr';

/**
 * La revisión del comprobante.
 *
 * NO aprueba pagos: aprueba Silvano, mirando. Esto le dice dónde mirar. Por
 * eso lo que más importa de estos tests es lo que NO deja pasar.
 */

const ESPERADO: LoEsperado = {
  montoUsd: 940,
  montoLocal: { moneda: 'ARS', monto: 1_200_000 },
  instruccionesDePago: 'Alias: silvano.dev.mp\nCBU: 0000003100010000000001\nTitular: Silvano Puccini',
  nombreCliente: 'Estefanía Ortigosa',
  firmadoAt: '2026-09-20T10:00:00Z',
};

const comprobante = (over: Partial<DatosComprobante> = {}): DatosComprobante => ({
  titular: 'Estefanía Ortigosa',
  destino: 'silvano.dev.mp',
  monto: 1_200_000,
  moneda: 'ARS',
  fecha: '2026-09-22',
  banco: 'Galicia',
  esComprobante: true,
  ...over,
});

const senalDe = (datos: DatosComprobante, campo: string) =>
  revisarPago(datos, ESPERADO).hallazgos.find((h) => h.campo === campo)?.senal;

describe('revisarPago — lo que no puede pasar', () => {
  it('marca mal si la plata fue a otra cuenta', () => {
    // Es lo único que no admite matices: si no entró a una cuenta tuya, no
    // hay redondeo que lo explique.
    const revision = revisarPago(comprobante({ destino: 'otro.alias.cualquiera' }), ESPERADO);

    expect(revision.veredicto).toBe('no-cuadra');
    expect(revision.hallazgos.find((h) => h.campo === 'destino')?.senal).toBe('mal');
  });

  it('marca mal si falta plata', () => {
    const revision = revisarPago(comprobante({ monto: 600_000 }), ESPERADO);

    expect(revision.veredicto).toBe('no-cuadra');
    expect(revision.hallazgos.find((h) => h.campo === 'monto')?.detalle).toContain('Falta plata');
  });

  it('rechaza lo que ni siquiera es un comprobante', () => {
    const revision = revisarPago(comprobante({ esComprobante: false }), ESPERADO);

    expect(revision.veredicto).toBe('no-cuadra');
    expect(revision.hallazgos).toHaveLength(1);
  });

  it('un comprobante perfecto no tapa uno que no lo es', () => {
    // Si algo está mal, manda lo que está mal: no se promedia.
    const revision = revisarPago(comprobante({ destino: 'ajeno.total.x' }), ESPERADO);

    expect(revision.hallazgos.some((h) => h.senal === 'ok')).toBe(true);
    expect(revision.veredicto).toBe('no-cuadra');
  });
});

describe('revisarPago — el monto', () => {
  it('acepta el redondeo del cliente y la comisión del banco', () => {
    // Exigir el centavo exacto marcaría en rojo casi todos los pagos buenos.
    expect(senalDe(comprobante({ monto: 1_190_000 }), 'monto')).toBe('ok');
  });

  it('lo que pagó de más se mira, pero no es un fraude', () => {
    expect(senalDe(comprobante({ monto: 1_500_000 }), 'monto')).toBe('atencion');
  });

  it('compara en dólares cuando transfirió en dólares', () => {
    expect(senalDe(comprobante({ monto: 940, moneda: 'USD' }), 'monto')).toBe('ok');
  });

  it('sin monto legible lo dice, no lo da por bueno', () => {
    expect(senalDe(comprobante({ monto: null }), 'monto')).toBe('atencion');
  });
});

describe('revisarPago — lo que solo merece una mirada', () => {
  it('que pague un tercero es común: se avisa sin alarmar', () => {
    const revision = revisarPago(comprobante({ titular: 'Roberto Ortigosa' }), ESPERADO);

    expect(revision.veredicto).toBe('revisar');
    expect(revision.hallazgos.find((h) => h.campo === 'titular')?.detalle).toContain('familiar');
  });

  it('una transferencia anterior a la firma puede ser de otra cosa', () => {
    expect(senalDe(comprobante({ fecha: '2026-09-01' }), 'fecha')).toBe('atencion');
  });

  it('lo que no se pudo leer se avisa en vez de asumirse', () => {
    expect(senalDe(comprobante({ destino: null }), 'destino')).toBe('atencion');
    expect(senalDe(comprobante({ fecha: null }), 'fecha')).toBe('atencion');
  });
});

describe('revisarPago — cuando está todo bien', () => {
  it('lo dice sin adornos', () => {
    const revision = revisarPago(comprobante(), ESPERADO);

    expect(revision.veredicto).toBe('cuadra');
    expect(revision.hallazgos.every((h) => h.senal === 'ok')).toBe(true);
  });

  it('«cuadra» no es una aprobación: es que no se encontró nada raro', () => {
    // Quien aprueba es una persona. El resumen no puede sonar a autorización.
    expect(resumenDeRevision({ veredicto: 'cuadra', hallazgos: [] })).not.toMatch(/aprob|confirm/i);
  });
});

describe('destinoEsMio', () => {
  it('reconoce el alias aunque el banco lo escriba distinto', () => {
    expect(destinoEsMio('SILVANO.DEV.MP', ESPERADO.instruccionesDePago)).toBe(true);
    expect(destinoEsMio('silvano-dev-mp', ESPERADO.instruccionesDePago)).toBe(true);
  });

  it('reconoce el CBU con separadores', () => {
    expect(destinoEsMio('0000003100-010000000001', ESPERADO.instruccionesDePago)).toBe(true);
  });

  it('no acepta una coincidencia de casualidad', () => {
    // Menos de seis caracteres coincide con cualquier cosa.
    expect(destinoEsMio('000', ESPERADO.instruccionesDePago)).toBe(false);
    expect(destinoEsMio('', ESPERADO.instruccionesDePago)).toBe(false);
    expect(destinoEsMio(null, ESPERADO.instruccionesDePago)).toBe(false);
  });

  it('una cuenta ajena no pasa por parecerse', () => {
    expect(destinoEsMio('silvana.dev.mx', ESPERADO.instruccionesDePago)).toBe(false);
  });

  it('normaliza sin perder lo que identifica', () => {
    expect(normalizarDestino(' CBU: 000-111.222 ')).toBe('cbu:000111222');
  });
});

describe('revisarPago — la moneda en que pagó', () => {
  // Caso real: el comprobante decía «$ 180.000» y la revisión dijo «Pagó de
  // más: 180000 contra 450 esperados». Comparaba pesos contra dólares.
  const AR: LoEsperado = {
    ...ESPERADO,
    montoUsd: 450,
    montoLocal: { moneda: 'ARS', monto: 700_000, tasa: 1_500 },
  };

  it('un «$» solo se resuelve por el monto: 675.000 son pesos, no dólares', () => {
    const revision = revisarPago(comprobante({ monto: 675_000, moneda: '$' }), AR);
    const monto = revision.hallazgos.find((h) => h.campo === 'monto')!;

    expect(monto.senal).toBe('ok');
    expect(monto.detalle).toContain('ARS');
  });

  it('pagar a la cotización sin el margen no es «falta plata»', () => {
    // 450 × 1.500 = 675.000. El monto cotizado lleva margen y redondeo.
    expect(revisarPago(comprobante({ monto: 675_000, moneda: 'ARS' }), AR)
      .hallazgos.find((h) => h.campo === 'monto')?.senal).toBe('ok');
  });

  it('en pesos, lo que está por debajo de la cotización sí falta', () => {
    const monto = revisarPago(comprobante({ monto: 400_000, moneda: 'ARS' }), AR)
      .hallazgos.find((h) => h.campo === 'monto')!;

    expect(monto.senal).toBe('mal');
    expect(monto.detalle).toContain('Falta plata');
  });

  it('reconoce la moneda escrita de muchas formas', () => {
    for (const moneda of ['U$S', 'US$', 'USD', 'Dólares']) {
      expect(revisarPago(comprobante({ monto: 450, moneda }), AR)
        .hallazgos.find((h) => h.campo === 'monto')?.senal, moneda).toBe('ok');
    }
    for (const moneda of ['ARS', '$ARS', 'Pesos', 'AR$']) {
      expect(revisarPago(comprobante({ monto: 690_000, moneda }), AR)
        .hallazgos.find((h) => h.campo === 'monto')?.senal, moneda).toBe('ok');
    }
  });

  it('pesos chilenos a un pedido que se cobra en dólares o pesos argentinos: mal', () => {
    const monto = revisarPago(comprobante({ monto: 420_000, moneda: 'CLP' }), AR)
      .hallazgos.find((h) => h.campo === 'monto')!;

    expect(monto.senal).toBe('mal');
    expect(monto.detalle).toContain('CLP');
  });

  it('sin cotización local, un monto de otra escala se señala como otra moneda', () => {
    const soloUsd: LoEsperado = { ...ESPERADO, montoUsd: 450, montoLocal: null };
    const monto = revisarPago(comprobante({ monto: 180_000, moneda: '$' }), soloUsd)
      .hallazgos.find((h) => h.campo === 'monto')!;

    expect(monto.senal).toBe('atencion');
    expect(monto.detalle).toContain('otra moneda');
    expect(monto.detalle).not.toContain('Pagó de más');
  });
});

describe('limpiarLectura — lo que devuelve el modelo no se usa crudo', () => {
  // La imagen la sube cualquiera. Si trae escrito «<script>» o un párrafo de
  // instrucciones, eso no puede llegar entero al panel ni al correo.
  it('saca marcado y caracteres de control, y corta lo largo', () => {
    const limpio = limpiarLectura({
      ...comprobante(),
      titular: '<img src=x onerror=alert(1)>Juan\u0000',
      destino: 'x'.repeat(500),
    });

    expect(limpio.titular).not.toMatch(/[<>]/);
    expect(limpio.titular).not.toContain(String.fromCharCode(0));
    expect(limpio.destino!.length).toBeLessThanOrEqual(80);
  });

  it('un monto que no es un número finito y positivo no se usa', () => {
    expect(limpiarLectura({ ...comprobante(), monto: Number.NaN }).monto).toBeNull();
    expect(limpiarLectura({ ...comprobante(), monto: -5 }).monto).toBeNull();
    expect(limpiarLectura({ ...comprobante(), monto: '450' as unknown as number }).monto).toBeNull();
  });

  it('esComprobante tiene que ser true de verdad, no algo que se parezca', () => {
    expect(limpiarLectura({ ...comprobante(), esComprobante: 'true' as unknown as boolean }).esComprobante).toBe(false);
  });
});
