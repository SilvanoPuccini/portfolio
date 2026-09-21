import { describe, expect, it } from 'vitest';
import { legalClauseFor } from './legal-clause';

describe('legalClauseFor', () => {
  it('un cliente argentino se somete a los tribunales de Buenos Aires', () => {
    expect(legalClauseFor('Argentina')).toContain('Ciudad Autónoma de Buenos Aires');
    expect(legalClauseFor('Argentina')).not.toContain('consumidor');
  });

  it('un cliente chileno conserva sus derechos como consumidor', () => {
    const clause = legalClauseFor('Chile');

    expect(clause).toContain('legislación chilena');
    expect(clause).toContain('Buenos Aires');
  });

  it('cualquier otro país cae en la cláusula internacional', () => {
    expect(legalClauseFor('España')).toContain('Buenos Aires');
    expect(legalClauseFor(null)).toContain('Buenos Aires');
  });

  it('es siempre el mismo texto: un contrato no cambia entre dos descargas', () => {
    // Antes lo escribía un modelo de IA y salía distinto cada vez.
    expect(legalClauseFor('Chile')).toBe(legalClauseFor('chile'));
    expect(legalClauseFor('Argentina')).toBe(legalClauseFor('AR'));
  });

  it('nunca arrastra el prefacio de un modelo', () => {
    // El bug real: un contrato firmado decía «Aquí tienes una propuesta:».
    for (const pais of ['Argentina', 'Chile', 'Uruguay', null]) {
      const clause = legalClauseFor(pais);
      expect(clause).not.toMatch(/aquí tienes|propuesta:|^"/i);
      expect(clause.startsWith('El presente contrato')).toBe(true);
    }
  });
});
