import { describe, expect, it } from 'vitest';

import {
  DURACION_SESION_DIAS,
  MAX_INTENTOS,
  codigoNuevo,
  firmarSesion,
  hashDeCodigo,
  sesionValida,
  vencimientoDelCodigo,
} from './acceso-cliente';

describe('el código que se manda por mail', () => {
  it('son seis dígitos', () => {
    for (let i = 0; i < 50; i += 1) expect(codigoNuevo()).toMatch(/^\d{6}$/);
  });

  it('no sale siempre el mismo', () => {
    const muchos = new Set(Array.from({ length: 40 }, () => codigoNuevo()));
    expect(muchos.size).toBeGreaterThan(30);
  });

  it('se guarda el hash, nunca el código', () => {
    const codigo = '123456';
    const hash = hashDeCodigo(codigo, 'lead-1');

    expect(hash).not.toContain(codigo);
    expect(hash).toHaveLength(64);
    // El mismo código para otra venta da otro hash: no se puede comparar entre filas.
    expect(hashDeCodigo(codigo, 'lead-2')).not.toBe(hash);
  });

  it('vence en minutos, no en días', () => {
    const ahora = new Date('2026-09-22T10:00:00Z');
    const vence = new Date(vencimientoDelCodigo(ahora));
    const minutos = (vence.getTime() - ahora.getTime()) / 60_000;

    expect(minutos).toBeGreaterThan(0);
    expect(minutos).toBeLessThanOrEqual(15);
  });

  it('tiene un tope de intentos: si no, se prueban los diez mil', () => {
    expect(MAX_INTENTOS).toBeLessThanOrEqual(5);
  });
});

describe('la sesión que queda después', () => {
  const secreto = 'un-secreto-largo-de-prueba';

  it('vale para ese pedido y no para otro', () => {
    const firma = firmarSesion('pedido-1', secreto);

    expect(sesionValida(firma, 'pedido-1', secreto)).toBe(true);
    expect(sesionValida(firma, 'pedido-2', secreto)).toBe(false);
  });

  it('una firma inventada no entra', () => {
    expect(sesionValida('cualquier-cosa', 'pedido-1', secreto)).toBe(false);
    expect(sesionValida('', 'pedido-1', secreto)).toBe(false);
  });

  it('con otro secreto deja de valer: rotar el secreto cierra todas las sesiones', () => {
    const firma = firmarSesion('pedido-1', secreto);
    expect(sesionValida(firma, 'pedido-1', 'otro-secreto')).toBe(false);
  });

  it('vence sola', () => {
    const viejo = new Date('2026-01-01T00:00:00Z');
    const firma = firmarSesion('pedido-1', secreto, viejo);

    expect(sesionValida(firma, 'pedido-1', secreto, new Date('2026-09-22T00:00:00Z'))).toBe(false);
  });

  it('dura lo que tiene que durar: el proyecto, no una tarde', () => {
    expect(DURACION_SESION_DIAS).toBeGreaterThanOrEqual(15);
  });
});
