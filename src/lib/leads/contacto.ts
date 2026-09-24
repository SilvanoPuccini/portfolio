import { siteContent } from '@/content/site';
import type { Locale } from '@/content/servicios';

/**
 * El chat de WhatsApp desde el pedido, con el mensaje ya escrito.
 *
 * «Escribirme» era un mailto: sin un programa de correo configurado no hace
 * nada, y casi nadie lo tiene. El canal de todos los días es WhatsApp, y el
 * mensaje llega diciendo quién es y qué compró: no hay que preguntarlo.
 */
export function whatsappDelPedido({ paquete, cliente, locale }: {
  paquete: string;
  cliente: string;
  locale: Locale;
}): string {
  const numero = siteContent.metadata.phone.replace(/\D/g, '');
  const texto = locale === 'es'
    ? `Hola Silvano, soy ${cliente}. Te escribo por mi pedido de ${paquete}.`
    : `Hi Silvano, this is ${cliente}. I am writing about my ${paquete} order.`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}
