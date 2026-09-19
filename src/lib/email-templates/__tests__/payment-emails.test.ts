import { describe, expect, it } from 'vitest';
import { paymentRequestHtml } from '../payment-request';
import { paymentReceivedHtml } from '../payment-received';

describe('paymentRequestHtml', () => {
  const base = {
    name: 'Ferrelon',
    amount: 2400,
    total: 4800,
    pct: 50,
    singlePayment: false,
    paymentInstructions: 'Alias: silvano.dev\nCBU: 0000003100000000000000',
  };

  it('pone el monto a pagar en primer plano', () => {
    expect(paymentRequestHtml(base)).toContain('USD 2.400');
  });

  it('explica de dónde sale ese número', () => {
    const html = paymentRequestHtml(base);
    expect(html).toContain('Seña del 50%');
    expect(html).toContain('USD 4.800');
    expect(html).toContain('50% restante');
  });

  describe('con monto en pesos', () => {
    const localQuote = {
      currency: 'ARS' as const, amount: 3_810_000, rate: 1540.1,
      source: 'Dólar MEP', updatedAt: null, validUntil: '2026-09-22T15:00:00.000Z',
    };

    it('muestra el equivalente en pesos debajo del monto en USD', () => {
      const html = paymentRequestHtml({ ...base, localQuote });
      expect(html).toContain('USD 2.400');
      expect(html).toContain('ARS 3.810.000');
    });

    it('explica la cotización y hasta cuándo vale, en hora argentina', () => {
      const html = paymentRequestHtml({ ...base, localQuote });
      expect(html).toContain('Dólar MEP');
      expect(html).toContain('22/09');
      expect(html).toContain('12:00');
    });

    it('sin cotización queda solo en USD', () => {
      expect(paymentRequestHtml(base)).not.toContain('ARS');
    });
  });

  it('en un pago único no habla de saldo restante', () => {
    const html = paymentRequestHtml({ ...base, singlePayment: true, pct: 100, amount: 300, total: 300 });
    expect(html).toContain('Pago único');
    expect(html).not.toContain('restante');
  });

  it('respeta la seña negociada, no la de la plantilla', () => {
    const html = paymentRequestHtml({ ...base, pct: 30, amount: 1440 });
    expect(html).toContain('Seña del 30%');
    expect(html).toContain('70% restante');
  });

  it('muestra cómo pagar', () => {
    expect(paymentRequestHtml(base)).toContain('Alias: silvano.dev');
  });

  it('escapa el nombre del cliente', () => {
    // El nombre lo escribe quien llena el formulario: es entrada ajena.
    const html = paymentRequestHtml({ ...base, name: '<script>alert(1)</script>' });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });
});

describe('paymentReceivedHtml', () => {
  const base = {
    name: 'Ferrelon',
    amount: 2400,
    invoiceNumber: 'A-0001-00000123',
    nextSteps: ['Arranco con el diseño', 'Te muestro el primer avance', 'Ajustamos y seguimos'],
    firstUpdate: 'el viernes 26 de septiembre',
  };

  it('agradece y confirma el monto acreditado', () => {
    const html = paymentReceivedHtml(base);
    expect(html).toContain('Gracias, Ferrelon');
    expect(html).toContain('USD 2.400');
  });

  it('nombra la factura cuando ya existe', () => {
    expect(paymentReceivedHtml(base)).toContain('A-0001-00000123');
  });

  it('sale igual sin factura: es peor dejar al cliente sin respuesta', () => {
    const html = paymentReceivedHtml({ ...base, invoiceNumber: null });
    expect(html).toContain('Gracias, Ferrelon');
    expect(html).not.toContain('factura');
  });

  it('numera los pasos que siguen', () => {
    const html = paymentReceivedHtml(base);
    expect(html).toContain('Arranco con el diseño');
    expect(html).toContain('Te muestro el primer avance');
    expect(html).toContain('>1<');
    expect(html).toContain('>3<');
  });

  it('dice cuándo tiene la primera novedad', () => {
    // Es lo que baja la ansiedad de alguien que acaba de pagar.
    const html = paymentReceivedHtml(base);
    expect(html).toContain('el viernes 26 de septiembre');
    expect(html).toContain('No hace falta que hagas nada');
  });

  it('escapa los pasos, que pueden venir escritos a mano', () => {
    const html = paymentReceivedHtml({ ...base, nextSteps: ['<img src=x onerror=alert(1)>'] });
    expect(html).not.toContain('<img src=x');
  });
});
