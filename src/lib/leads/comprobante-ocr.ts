/**
 * Leer el comprobante y decir si cuadra.
 *
 * Verificar un pago era entrar al banco, buscar el movimiento entre todos los
 * del día y cruzarlo de memoria con lo que el cliente había comprado. Eso es
 * lo que hace que un cobro tarde dos días en confirmarse, y con él la entrega.
 *
 * Lo que sigue NO aprueba nada. Aprueba Silvano, mirando. Esto le dice dónde
 * mirar: si el monto, el destino y la fecha cuadran, o si hay algo que no.
 * Un sistema que aprueba pagos solo es un sistema que un día aprueba mal.
 */

/** Lo que se le pide al modelo que encuentre en la imagen. */
export interface DatosComprobante {
  /** Quién transfirió, tal como figura. */
  titular: string | null;
  /** A dónde fue: alias, CBU o número de cuenta. */
  destino: string | null;
  /** El número, sin símbolos ni separadores de miles. */
  monto: number | null;
  /** ARS, USD, CLP… tal como figure. */
  moneda: string | null;
  /** ISO, si se puede leer. */
  fecha: string | null;
  banco: string | null;
  /** Si el modelo no vio un comprobante de transferencia, lo dice. */
  esComprobante: boolean;
}

export interface LoEsperado {
  montoUsd: number;
  /**
   * Lo cotizado en moneda local, cuando corresponde. `tasa` son los pesos por
   * dólar sin margen: el monto cotizado lleva margen y redondeo para arriba,
   * así que quien paga a la cotización pura paga menos y no le falta nada.
   */
  montoLocal?: { moneda: string; monto: number; tasa?: number } | null;
  /** Mis datos de cobro, tal como los ve el cliente. */
  instruccionesDePago: string;
  nombreCliente: string;
  /** Desde cuándo tiene sentido que exista esta transferencia. */
  firmadoAt?: string | null;
}

export type Senal = 'ok' | 'atencion' | 'mal';

export interface Hallazgo {
  campo: 'monto' | 'destino' | 'fecha' | 'titular' | 'documento';
  senal: Senal;
  detalle: string;
}

export type Veredicto = 'cuadra' | 'revisar' | 'no-cuadra';

export interface Revision {
  veredicto: Veredicto;
  hallazgos: Hallazgo[];
}

/**
 * Cuánto puede diferir el monto sin que sea un problema.
 *
 * Un 2%: el cliente redondea, el banco cobra una comisión, la cotización se
 * movió entre que miró la pantalla y transfirió. Exigir el centavo exacto
 * marcaría en rojo casi todos los pagos buenos, y un aviso que siempre grita
 * se aprende a ignorar.
 */
const TOLERANCIA = 0.02;

/** Un alias o CBU, sin puntos, guiones ni espacios, para poder compararlo. */
export function normalizarDestino(texto: string | null | undefined): string {
  return (texto ?? '').toLowerCase().replace(/[\s.\-/]/g, '');
}

/**
 * Si el destino del comprobante es alguno de los míos.
 *
 * Se compara contra el texto de las instrucciones de pago, que es justo lo
 * que el cliente tuvo delante: no hace falta configurar el alias en otro
 * lado, y el día que cambie, cambia en un solo lugar.
 */
export function destinoEsMio(destino: string | null, instrucciones: string): boolean {
  const limpio = normalizarDestino(destino);
  // Menos de seis caracteres no identifica una cuenta: coincidiría de casualidad.
  if (limpio.length < 6) return false;
  return normalizarDestino(instrucciones).includes(limpio);
}

/**
 * La moneda en código ISO, a partir de como la escribió el banco.
 * `null` es «no se sabe»: un «$» solo lo usan el peso argentino, el chileno y
 * el dólar, así que no dice nada por sí mismo.
 */
export function monedaISO(texto: string | null | undefined): string | null {
  const t = (texto ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/\s/g, '');
  if (!t || t === '$') return null;
  if (/USD|US\$|U\$S|U\$D|DOLAR/.test(t)) return 'USD';
  if (/CLP|CL\$|CHILEN/.test(t)) return 'CLP';
  if (/ARS|AR\$|PESO/.test(t)) return 'ARS';
  if (/^[A-Z]{3}$/.test(t)) return t;
  return null;
}

interface MontoEsperado {
  moneda: string;
  /** Lo mínimo que se acepta sin decir que falta plata. */
  minimo: number;
  /** Lo que se le pidió. Por encima, pagó de más. */
  pedido: number;
}

/** Los montos que valen para este pedido: en dólares y, si hay, en moneda local. */
function montosEsperados(esperado: LoEsperado): MontoEsperado[] {
  const lista: MontoEsperado[] = [{ moneda: 'USD', minimo: esperado.montoUsd, pedido: esperado.montoUsd }];
  const local = esperado.montoLocal;
  if (local) {
    const puro = local.tasa ? esperado.montoUsd * local.tasa : local.monto;
    lista.push({ moneda: local.moneda.toUpperCase(), minimo: Math.min(puro, local.monto), pedido: local.monto });
  }
  return lista;
}

/** Qué tan lejos está un monto de otro, sin importar la escala. */
function distancia(monto: number, esperado: MontoEsperado): number {
  return Math.abs(Math.log(monto / esperado.pedido));
}

const fmt = (n: number) => Math.round(n).toLocaleString('es-AR');

function hallazgoDeMonto(datos: DatosComprobante, esperado: LoEsperado): Hallazgo {
  if (datos.monto == null || datos.monto <= 0) {
    return { campo: 'monto', senal: 'atencion', detalle: 'No se pudo leer el monto.' };
  }

  const opciones = montosEsperados(esperado);
  const iso = monedaISO(datos.moneda);

  let elegido: MontoEsperado | undefined;
  let deducida = false;

  if (iso) {
    elegido = opciones.find((o) => o.moneda === iso);
    if (!elegido) {
      return {
        campo: 'monto',
        senal: 'mal',
        detalle: `Pagó en ${iso}, y este pedido se cobra en ${opciones.map((o) => o.moneda).join(' o ')}.`,
      };
    }
  } else {
    // Sin moneda clara, la escala la delata: 675.000 contra 450 no es «pagó
    // de más», es que pagó en pesos.
    elegido = [...opciones].sort((x, y) => distancia(datos.monto!, x) - distancia(datos.monto!, y))[0];
    deducida = true;
  }

  // Más de 5 veces de diferencia no es un error de monto: es otra moneda.
  if (distancia(datos.monto, elegido) > Math.log(5)) {
    return {
      campo: 'monto',
      senal: 'atencion',
      detalle: `El monto (${fmt(datos.monto)}) parece estar en otra moneda: se esperaban `
        + `${opciones.map((o) => `${o.moneda} ${fmt(o.pedido)}`).join(' o ')}.`,
    };
  }

  const cual = `${elegido.moneda} ${fmt(datos.monto)}${deducida ? ' (moneda deducida por el monto)' : ''}`;

  if (datos.monto < elegido.minimo * (1 - TOLERANCIA)) {
    return {
      campo: 'monto',
      senal: 'mal',
      detalle: `Falta plata: transfirió ${cual} y esperabas ${elegido.moneda} ${fmt(elegido.minimo)}.`,
    };
  }
  if (datos.monto > elegido.pedido * (1 + TOLERANCIA)) {
    return {
      campo: 'monto',
      senal: 'atencion',
      detalle: `Pagó de más: ${cual} contra ${elegido.moneda} ${fmt(elegido.pedido)} pedidos.`,
    };
  }
  return { campo: 'monto', senal: 'ok', detalle: `Coincide: ${cual}.` };
}

/**
 * El veredicto de un comprobante.
 *
 * `no-cuadra` es para lo que no se puede explicar con un redondeo: que no sea
 * un comprobante, que la plata haya ido a otra cuenta, o que falte de verdad.
 * `revisar` es todo lo demás que merece una mirada. `cuadra` no es una
 * aprobación: es «no encontré nada raro».
 */
export function revisarPago(datos: DatosComprobante, esperado: LoEsperado): Revision {
  const hallazgos: Hallazgo[] = [];

  if (!datos.esComprobante) {
    return {
      veredicto: 'no-cuadra',
      hallazgos: [{
        campo: 'documento',
        senal: 'mal',
        detalle: 'La imagen no parece un comprobante de transferencia.',
      }],
    };
  }

  // --- El destino: es lo único que no admite matices.
  if (!datos.destino) {
    hallazgos.push({ campo: 'destino', senal: 'atencion', detalle: 'No se pudo leer a qué cuenta fue.' });
  } else if (destinoEsMio(datos.destino, esperado.instruccionesDePago)) {
    hallazgos.push({ campo: 'destino', senal: 'ok', detalle: `Fue a tu cuenta (${datos.destino}).` });
  } else {
    hallazgos.push({
      campo: 'destino',
      senal: 'mal',
      detalle: `El destino no es ninguna cuenta tuya: ${datos.destino}.`,
    });
  }

  // --- El monto, en la moneda en que pagó.
  hallazgos.push(hallazgoDeMonto(datos, esperado));

  // --- La fecha: una transferencia anterior a la firma es de otra cosa.
  if (!datos.fecha) {
    hallazgos.push({ campo: 'fecha', senal: 'atencion', detalle: 'No se pudo leer la fecha.' });
  } else if (esperado.firmadoAt && new Date(datos.fecha) < new Date(esperado.firmadoAt.slice(0, 10))) {
    hallazgos.push({
      campo: 'fecha',
      senal: 'atencion',
      detalle: `Es anterior a la firma (${datos.fecha}). Puede ser de otro pago.`,
    });
  } else {
    hallazgos.push({ campo: 'fecha', senal: 'ok', detalle: datos.fecha });
  }

  // --- El titular: informativo. Que pague un tercero es común y no es un problema.
  if (datos.titular) {
    const mismo = normalizarDestino(datos.titular).includes(normalizarDestino(esperado.nombreCliente.split(' ')[0]));
    hallazgos.push({
      campo: 'titular',
      senal: mismo ? 'ok' : 'atencion',
      detalle: mismo
        ? `Transfirió ${datos.titular}.`
        : `Transfirió ${datos.titular}, que no es ${esperado.nombreCliente}. Puede ser un familiar o su empresa.`,
    });
  }

  const veredicto: Veredicto = hallazgos.some((h) => h.senal === 'mal')
    ? 'no-cuadra'
    : hallazgos.some((h) => h.senal === 'atencion')
      ? 'revisar'
      : 'cuadra';

  return { veredicto, hallazgos };
}

/** Una línea para el asunto del correo y para la fila del panel. */
export function resumenDeRevision(revision: Revision): string {
  switch (revision.veredicto) {
    case 'cuadra': return 'El comprobante cuadra';
    case 'revisar': return 'El comprobante necesita una mirada';
    case 'no-cuadra': return 'El comprobante no cuadra';
  }
}

/** Un texto del comprobante, sin marcado, sin controles y de largo razonable. */
function textoLimpio(valor: unknown, largo: number): string | null {
  if (typeof valor !== 'string') return null;
  const limpio = valor
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f<>`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, largo);
  return limpio || null;
}

/**
 * Lo que devolvió el modelo, antes de usarlo.
 *
 * La imagen la sube cualquiera, y lo que el modelo transcribe de ella es tan
 * poco confiable como la imagen misma: puede traer marcado, un párrafo de
 * instrucciones o tipos que no son los pedidos. Nada de eso llega crudo al
 * panel, al correo ni a la revisión.
 */
export function limpiarLectura(datos: DatosComprobante): DatosComprobante {
  const monto = typeof datos.monto === 'number' && Number.isFinite(datos.monto) && datos.monto > 0
    ? datos.monto
    : null;
  const fecha = textoLimpio(datos.fecha, 10);

  return {
    esComprobante: datos.esComprobante === true,
    titular: textoLimpio(datos.titular, 80),
    destino: textoLimpio(datos.destino, 80),
    monto,
    moneda: textoLimpio(datos.moneda, 12),
    fecha: fecha && /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : null,
    banco: textoLimpio(datos.banco, 60),
  };
}
