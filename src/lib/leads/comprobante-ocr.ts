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
  /** Lo cotizado en moneda local, cuando corresponde. */
  montoLocal?: { moneda: string; monto: number } | null;
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

/** El monto esperado en la moneda en que se pagó. */
function esperadoEn(moneda: string | null, esperado: LoEsperado): number | null {
  const m = (moneda ?? '').toUpperCase();
  if (!m || m.includes('USD') || m.includes('DOLAR')) return esperado.montoUsd;
  if (esperado.montoLocal && m.includes(esperado.montoLocal.moneda.toUpperCase())) {
    return esperado.montoLocal.monto;
  }
  return esperado.montoLocal?.monto ?? null;
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

  // --- El monto.
  const esperadoMonto = esperadoEn(datos.moneda, esperado);
  if (datos.monto == null || esperadoMonto == null) {
    hallazgos.push({ campo: 'monto', senal: 'atencion', detalle: 'No se pudo comparar el monto.' });
  } else {
    const diferencia = (datos.monto - esperadoMonto) / esperadoMonto;

    if (Math.abs(diferencia) <= TOLERANCIA) {
      hallazgos.push({ campo: 'monto', senal: 'ok', detalle: `Coincide: ${datos.monto} ${datos.moneda ?? ''}`.trim() });
    } else if (diferencia < 0) {
      hallazgos.push({
        campo: 'monto',
        senal: 'mal',
        detalle: `Falta plata: transfirió ${datos.monto} y esperabas ${Math.round(esperadoMonto)}.`,
      });
    } else {
      hallazgos.push({
        campo: 'monto',
        senal: 'atencion',
        detalle: `Pagó de más: ${datos.monto} contra ${Math.round(esperadoMonto)} esperados.`,
      });
    }
  }

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
