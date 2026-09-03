import { describe, expect, it } from 'vitest';
import { blockDuration } from '@/lib/auth-throttle';

const MINUTE = 60_000;

describe('blockDuration — freno de fuerza bruta del login', () => {
  it('no frena mientras los fallos entren en el margen de tipeo', () => {
    for (const failures of [1, 5, 14, 15]) {
      expect(blockDuration(failures)).toBe(0);
    }
  });

  it('empieza a frenar recién pasado el margen', () => {
    expect(blockDuration(16)).toBe(MINUTE);
  });

  it('duplica el bloqueo con cada fallo siguiente', () => {
    expect(blockDuration(17)).toBe(2 * MINUTE);
    expect(blockDuration(18)).toBe(4 * MINUTE);
    expect(blockDuration(19)).toBe(8 * MINUTE);
  });

  it('tiene techo, para que un atacante no te deje afuera de tu propio admin', () => {
    expect(blockDuration(20)).toBe(15 * MINUTE);
    expect(blockDuration(500)).toBe(15 * MINUTE);
  });

  it('hace impracticable la fuerza bruta: 100 intentos cuestan más de una hora', () => {
    let total = 0;
    for (let i = 1; i <= 100; i++) total += blockDuration(i);
    expect(total).toBeGreaterThan(60 * MINUTE);
  });
});
