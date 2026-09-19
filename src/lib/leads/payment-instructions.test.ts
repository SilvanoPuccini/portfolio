import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { countryOf, FALLBACK_INSTRUCTIONS, paymentInstructionsFor } from './payment-instructions';

const KEYS = ['PAYMENT_INSTRUCTIONS', 'PAYMENT_INSTRUCTIONS_AR', 'PAYMENT_INSTRUCTIONS_CL'] as const;
const saved: Record<string, string | undefined> = {};

describe('countryOf', () => {
  it.each(['Argentina', 'argentina', 'AR', ' ARGENTINA '])('reconoce Argentina escrita como «%s»', (pais) => {
    expect(countryOf(pais)).toBe('AR');
  });

  it.each(['Chile', 'chile', 'CL', 'Chile '])('reconoce Chile escrito como «%s»', (pais) => {
    expect(countryOf(pais)).toBe('CL');
  });

  it('todo lo demás, incluido el país vacío, es otro', () => {
    expect(countryOf('Uruguay')).toBe('OTRO');
    expect(countryOf(null)).toBe('OTRO');
    expect(countryOf('')).toBe('OTRO');
  });
});

describe('paymentInstructionsFor', () => {
  beforeEach(() => {
    for (const key of KEYS) { saved[key] = process.env[key]; delete process.env[key]; }
    process.env.PAYMENT_INSTRUCTIONS_AR = 'Alias: silvano.dev';
    process.env.PAYMENT_INSTRUCTIONS_CL = 'Banco Estado · Cuenta RUT 12.345.678-9';
    process.env.PAYMENT_INSTRUCTIONS = 'Wise: silvano@ejemplo.com';
  });

  afterEach(() => {
    for (const key of KEYS) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  });

  it('a un cliente argentino le da el alias', () => {
    expect(paymentInstructionsFor('Argentina')).toBe('Alias: silvano.dev');
  });

  it('a un cliente chileno le da la cuenta chilena, nunca el alias', () => {
    // El caso que motivó todo esto: un alias argentino no le sirve en Chile.
    expect(paymentInstructionsFor('Chile')).toBe('Banco Estado · Cuenta RUT 12.345.678-9');
  });

  it('a cualquier otro país le da los datos generales', () => {
    expect(paymentInstructionsFor('México')).toBe('Wise: silvano@ejemplo.com');
  });

  it('si falta la del país, usa la general', () => {
    delete process.env.PAYMENT_INSTRUCTIONS_CL;
    expect(paymentInstructionsFor('Chile')).toBe('Wise: silvano@ejemplo.com');
  });

  it('sin ninguna configurada, no inventa datos', () => {
    for (const key of KEYS) delete process.env[key];
    expect(paymentInstructionsFor('Argentina')).toBe(FALLBACK_INSTRUCTIONS);
  });

  it('convierte un «\\n» pegado a mano en salto de línea real', () => {
    process.env.PAYMENT_INSTRUCTIONS_CL = 'Banco Estado\\nCuenta RUT';
    expect(paymentInstructionsFor('Chile')).toBe('Banco Estado\nCuenta RUT');
  });
});
