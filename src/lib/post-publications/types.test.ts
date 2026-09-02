import { describe, expect, it } from 'vitest';
import { isValidTransition, slugifyTitle } from './types';

describe('isValidTransition', () => {
  it('permite el camino normal hacia adelante', () => {
    expect(isValidTransition('planificado', 'preaprobado')).toBe(true);
    expect(isValidTransition('preaprobado', 'publicado')).toBe(true);
  });

  it('permite volver atrás', () => {
    expect(isValidTransition('preaprobado', 'planificado')).toBe(true);
    expect(isValidTransition('publicado', 'preaprobado')).toBe(true);
  });

  it('no deja saltear la preaprobación', () => {
    expect(isValidTransition('planificado', 'publicado')).toBe(false);
  });

  it('no deja saltar de publicado directo a planificado', () => {
    expect(isValidTransition('publicado', 'planificado')).toBe(false);
  });

  it('acepta quedarse en el mismo estado', () => {
    expect(isValidTransition('publicado', 'publicado')).toBe(true);
  });
});

describe('slugifyTitle', () => {
  it('saca acentos y arma kebab-case', () => {
    expect(slugifyTitle('Docker como contrato de ejecución')).toBe(
      'docker-como-contrato-de-ejecucion',
    );
  });

  it('limpia signos y guiones sobrantes', () => {
    expect(slugifyTitle('¿Next.js, React o Angular?')).toBe('next-js-react-o-angular');
  });

  it('respeta el formato que exige la constraint de la tabla', () => {
    expect(slugifyTitle('Mi Stack — 2026!!')).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });
});
