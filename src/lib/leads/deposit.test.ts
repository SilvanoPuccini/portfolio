import { describe, expect, it } from 'vitest';
import { suggestDeposit, DEPOSIT_FLOOR_PCT } from './deposit';

describe('suggestDeposit', () => {
  it('arranca siempre proponiendo la mitad', () => {
    // La regla de Silvano: se empieza en 50 % y se baja solo si el margen
    // no da. El panel sugiere, nunca decide.
    expect(suggestDeposit(300).pct).toBe(50);
    expect(suggestDeposit(5000).pct).toBe(50);
  });

  it('en un trabajo chico habilita el pago único', () => {
    const chico = suggestDeposit(300);
    expect(chico.allowsSinglePayment).toBe(true);
    expect(chico.amount).toBe(150);
  });

  it('en un trabajo grande deja de ofrecer pago único', () => {
    // Pedir $5.000 por adelantado no es una opción razonable de cobro.
    expect(suggestDeposit(5000).allowsSinglePayment).toBe(false);
  });

  it('calcula el monto de la seña sobre el total', () => {
    expect(suggestDeposit(5000).amount).toBe(2500);
  });

  it('ofrece bajar hasta 30 % y 25 % cuando el monto es grande', () => {
    const { fallbackPcts } = suggestDeposit(5000);
    expect(fallbackPcts).toEqual([30, 25]);
  });

  it('no ofrece bajar en un trabajo chico: la seña dejaría de ser capital', () => {
    // $75 sobre $300 no compromete a nadie. Media el criterio de fondo: la
    // seña tiene que ser capital, no un gesto.
    expect(suggestDeposit(300).fallbackPcts).toEqual([]);
  });

  it('nunca sugiere por debajo del piso', () => {
    const { pct, fallbackPcts } = suggestDeposit(20000);
    expect(Math.min(pct, ...fallbackPcts)).toBeGreaterThanOrEqual(DEPOSIT_FLOOR_PCT);
  });

  it('redondea a centavos en montos que no parten justo', () => {
    expect(suggestDeposit(333.33).amount).toBe(166.67);
  });

  it('devuelve cero y sin opciones cuando todavía no hay monto', () => {
    const vacio = suggestDeposit(null);
    expect(vacio.amount).toBe(0);
    expect(vacio.allowsSinglePayment).toBe(false);
    expect(vacio.fallbackPcts).toEqual([]);
  });

  it('ignora montos inválidos en vez de romper', () => {
    expect(suggestDeposit(-100).amount).toBe(0);
    expect(suggestDeposit(Number.NaN).amount).toBe(0);
  });
});

describe('depositAt', () => {
  it('calcula cualquier porcentaje elegido a mano', async () => {
    const { depositAt } = await import('./deposit');
    // El panel sugiere, vos elegís: si bajás al 30 %, el monto acompaña.
    expect(depositAt(5000, 30)).toBe(1500);
    expect(depositAt(5000, 25)).toBe(1250);
  });
});
