import { escapeHtml } from '@/lib/html-escape';
import { boton, emailLayout, nota, panelDestacado, parrafo } from './layout';

/**
 * El correo de después del pago.
 *
 * Es el momento de mayor ansiedad del cliente: acaba de soltar plata y todavía
 * no vio nada. Por eso este correo no se limita a decir «recibido» — cuenta qué
 * pasa ahora, con fechas, y cuándo va a tener noticias. Es el mail más barato
 * de escribir y el que más tranquilidad compra.
 *
 * La factura viaja adjunta cuando existe. Mientras la facturación se emita
 * afuera, el correo igual sale: es peor dejar al cliente sin respuesta que
 * mandarle el agradecimiento sin el comprobante.
 */

export interface PaymentReceivedData {
  name: string;
  amount: number;
  /** Número de factura, si ya se emitió. */
  invoiceNumber?: string | null;
  /** Qué pasa ahora, en orden. Cada línea es un paso. */
  nextSteps: string[];
  /** Cuándo tiene la primera novedad concreta. */
  firstUpdate: string;
  /**
   * Dónde cargar el material, en las ventas del catálogo. Con esto el correo
   * deja de decir «no hace falta que hagas nada»: falta justo lo que destraba
   * el trabajo, y tiene que estar a un clic.
   */
  materialUrl?: string | null;
}

/** Los pasos cuando falta el material: el primero es del cliente. */
export const PASOS_CON_MATERIAL = [
  'Cargá el material de tu proyecto: el logo, las fotos y los textos que tengas',
  'Arranco apenas lo tengo: el plazo del contrato corre desde ahí',
  'Te muestro el primer avance para que lo revises',
  'Ajustamos sobre tu devolución y te entrego',
];

const money = (value: number) => `USD ${value.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;

/** Los pasos que siguen, numerados. Cada renglón viene escrito a mano. */
function pasos(lista: string[]): string {
  const filas = lista.map((paso, i) => `<tr>
      <td valign="top" width="30" style="padding:0 0 13px;">
        <span style="display:inline-block;width:22px;height:22px;border-radius:50%;background:rgba(0,212,212,0.14);color:#00d4d4;font-family:ui-monospace,monospace;font-size:11px;font-weight:700;text-align:center;line-height:22px;">${i + 1}</span>
      </td>
      <td style="font-family:'Inter',Helvetica,Arial,sans-serif;font-size:14px;color:#94a3b8;line-height:1.65;padding:1px 0 13px;">${escapeHtml(paso)}</td>
    </tr>`).join('');

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 20px;">
    <tr><td style="font-family:ui-monospace,monospace;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#64748b;padding:0 0 14px;" colspan="2">Qué pasa ahora</td></tr>
    ${filas}
  </table>`;
}

export function paymentReceivedHtml(data: PaymentReceivedData): string {
  return emailLayout({
    preheader: `Acreditado ${money(data.amount)}. Arrancamos.`,
    eyebrow: 'Pago recibido',
    titulo: `Gracias, ${data.name}. Arrancamos.`,
    paso: 3,
    cuerpo: [
      panelDestacado({
        etiqueta: 'Acreditado',
        valor: money(data.amount),
        nota: data.invoiceNumber
          ? `Te dejo la factura ${data.invoiceNumber} adjunta.`
          : undefined,
      }),

      pasos(data.nextSteps),

      ...(data.materialUrl
        ? [
          boton('Cargar el material', data.materialUrl),
          nota('Se guarda solo mientras cargás: podés hacerlo en partes y volver con este mismo botón.'),
        ]
        : [parrafo(`Tu primera novedad: ${data.firstUpdate}. No hace falta que hagas nada hasta entonces.`)]),

      nota('Si en el medio surge cualquier cosa, respondé este correo.'),
    ].join(''),
  });
}
