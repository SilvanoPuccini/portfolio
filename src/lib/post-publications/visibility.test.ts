import { describe, expect, it } from 'vitest';
import { isPostVisible, type VisibilityIndex } from './visibility';

function index(
  entries: Array<[string, { status: 'planificado' | 'preaprobado' | 'publicado'; scheduledAt: string }]>,
  degraded = false,
): VisibilityIndex {
  return { states: new Map(entries), degraded };
}

const PAST = '2020-01-01';
const FUTURE = '2999-01-01';

describe('isPostVisible', () => {
  it('muestra un post publicado', () => {
    const i = index([['x', { status: 'publicado', scheduledAt: `${FUTURE}T10:00:00-03:00` }]]);
    expect(isPostVisible({ slug: 'x', date: FUTURE }, i)).toBe(true);
  });

  it('oculta un preaprobado aunque su fecha ya haya pasado', () => {
    const i = index([['x', { status: 'preaprobado', scheduledAt: `${PAST}T10:00:00-03:00` }]]);
    expect(isPostVisible({ slug: 'x', date: PAST }, i)).toBe(false);
  });

  it('oculta un planificado', () => {
    const i = index([['x', { status: 'planificado', scheduledAt: `${FUTURE}T10:00:00-03:00` }]]);
    expect(isPostVisible({ slug: 'x', date: FUTURE }, i)).toBe(false);
  });

  it('muestra un post legado: sin fila y con fecha pasada', () => {
    expect(isPostVisible({ slug: 'legado', date: PAST }, index([]))).toBe(true);
  });

  it('oculta un .mdx pusheado sin cargar en la agenda si su fecha es futura', () => {
    // Este es el error humano más probable: commitear el post y olvidarse
    // de crear la fila. No puede publicarse solo.
    expect(isPostVisible({ slug: 'huerfano', date: FUTURE }, index([]))).toBe(false);
  });

  describe('con Supabase caído (índice degradado)', () => {
    const down = index([], true);

    it('NO filtra un post futuro — falla cerrado, no abierto', () => {
      expect(isPostVisible({ slug: 'futuro', date: FUTURE }, down)).toBe(false);
    });

    it('sigue mostrando los posts viejos, no tumba el blog entero', () => {
      expect(isPostVisible({ slug: 'legado', date: PAST }, down)).toBe(true);
    });

    it('mantiene oculto un post retenido con fecha pasada si conserva el último estado bueno', () => {
      // El piso por fecha no alcanza acá: la fecha ya pasó pero el post sigue
      // sin aprobar. Por eso el índice degradado reutiliza la última lectura.
      const withCache = index(
        [['retenido', { status: 'preaprobado', scheduledAt: `${PAST}T10:00:00-03:00` }]],
        true,
      );
      expect(isPostVisible({ slug: 'retenido', date: PAST }, withCache)).toBe(false);
    });
  });

  it('trata una fecha inválida como no publicable', () => {
    expect(isPostVisible({ slug: 'roto', date: 'no-es-fecha' }, index([]))).toBe(false);
  });
});
