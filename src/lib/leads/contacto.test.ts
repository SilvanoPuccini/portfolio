import { describe, expect, it } from 'vitest';

import { whatsappDelPedido } from './contacto';

/**
 * «Escribirme» era un mailto: sin un programa de correo configurado no hace
 * nada, y casi nadie lo tiene. El canal de todos los días es WhatsApp.
 */

describe('whatsappDelPedido', () => {
  it('abre el chat con el número en formato internacional', () => {
    expect(whatsappDelPedido({ paquete: 'Landing', cliente: 'Ana', locale: 'es' }))
      .toMatch(/^https:\/\/wa\.me\/5492494309584\?text=/);
  });

  it('llega con el mensaje escrito: quién es y qué compró', () => {
    const texto = decodeURIComponent(
      whatsappDelPedido({ paquete: 'Landing', cliente: 'Ana', locale: 'es' }).split('text=')[1],
    );

    expect(texto).toContain('Ana');
    expect(texto).toContain('Landing');
  });
});
