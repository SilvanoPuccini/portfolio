import { boton, detalle, emailLayout, nota, parrafo } from './layout';

/**
 * El contrato listo para firmar, con el link a nuestra página.
 *
 * Sale de nuestro dominio y con nuestro diseño. Antes lo mandaba Documenso,
 * con su marca y su dirección de San Francisco al pie: el cliente recibía un
 * correo de un tercero justo en el momento más importante de la venta.
 *
 * Es un respaldo, no el camino principal: el cliente firma en la página, sin
 * salir de ella. Este correo existe para el que cerró la pestaña antes.
 */

export interface ContractToSign {
  name: string;
  /** Qué compró, para que el correo se entienda sin abrir nada. */
  paquete: string;
  totalUsd: number;
  /** La página del pedido, donde está el contrato. */
  url: string;
}

export function contractToSignHtml(data: ContractToSign): string {
  const total = `USD ${Math.round(data.totalUsd).toLocaleString('es-AR')}`;

  return emailLayout({
    preheader: `${data.paquete} · ${total}. Ya viene firmado de mi parte.`,
    eyebrow: 'Silvano Puccini Dev',
    titulo: `Hola, ${data.name}`,
    paso: 1,
    cuerpo: [
      parrafo('Tu contrato está listo y ya viene firmado de mi parte. Solo falta tu firma.'),

      detalle([
        { label: data.paquete, valor: total },
      ]),

      boton('Ver y firmar el contrato', data.url),

      nota('Firmar no dispara ningún cobro: los datos para pagar te llegan después, en otro correo.'),
      nota('Si algo del contrato no te cierra, respondé este correo antes de firmar y lo vemos.'),
    ].join(''),
  });
}
