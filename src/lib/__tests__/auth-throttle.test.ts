import { describe, expect, it } from 'vitest';
import { BASE_BLOCK_MS, FREE_ATTEMPTS, MAX_BLOCK_MS } from '@/lib/auth-throttle';

const MINUTE = 60_000;

/**
 * La curva del bloqueo la calcula Postgres (`record_login_failure`, migración
 * 014) para que el incremento sea atómico. Estos constantes son los únicos
 * números que le pasa la aplicación, así que fijarlos acá es lo que evita que
 * la política cambie sin que nadie se entere.
 */
describe('política del freno de login', () => {
  it('deja margen para tipear mal sin frenar a nadie', () => {
    expect(FREE_ATTEMPTS).toBe(15);
  });

  it('el primer bloqueo es de un minuto', () => {
    expect(BASE_BLOCK_MS).toBe(MINUTE);
  });

  it('tiene techo, para que un atacante no deje al dueño afuera de su admin', () => {
    expect(MAX_BLOCK_MS).toBe(15 * MINUTE);
    expect(MAX_BLOCK_MS).toBeLessThanOrEqual(30 * MINUTE);
  });

  it('la curva duplicando desde 1 min hace impracticable la fuerza bruta', () => {
    // Réplica de la fórmula que corre en SQL, solo para dejar asentado el
    // costo acumulado que implica esta configuración.
    const cost = (failures: number) => {
      const over = failures - FREE_ATTEMPTS;
      if (over <= 0) return 0;
      return Math.min(BASE_BLOCK_MS * 2 ** (over - 1), MAX_BLOCK_MS);
    };

    expect(cost(15)).toBe(0);
    expect(cost(16)).toBe(MINUTE);
    expect(cost(20)).toBe(MAX_BLOCK_MS);

    let total = 0;
    for (let i = 1; i <= 100; i++) total += cost(i);
    expect(total).toBeGreaterThan(60 * MINUTE);
  });
});
