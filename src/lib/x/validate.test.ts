import { describe, expect, it } from 'vitest';
import { validateThread, weightedLength } from './validate';

const OK_URL = 'https://www.silvanopuccini.dev/es/';
const ALLOWED = [OK_URL];
const REPLY = `Lo escribí completo acá: ${OK_URL}`;

/** Hilo mínimo válido: gancho corto, cuatro posts, sin links ni tics. */
function goodThread(): string[] {
  return [
    'Migré 40 componentes.\n\n31 no hacían falta.',
    'Le pasa a cualquiera que arranca un proyecto con una librería de UI ya elegida.',
    'El costo no se ve al principio. Se ve cuando querés cambiar una cosa y tocás nueve archivos.',
    'La regla que uso ahora: si no lo reusé tres veces, no es un componente.\n\n¿Cuál fue tu peor abstracción prematura?',
  ];
}

describe('weightedLength', () => {
  it('counts every URL as 23 characters, whatever its real length', () => {
    // La URL de abajo tiene muchos más de 23 caracteres, pero X la cobra a 23.
    const long = 'https://www.silvanopuccini.dev/es/blog/un-slug-bastante-largo-para-la-prueba';
    expect(long.length).toBeGreaterThan(23);
    expect(weightedLength(long).length).toBe(23);
  });

  it('charges two units for characters a plain length check would wave through', () => {
    // 200 caracteres japoneses: `.length` dice 200 y parece que entra, pero X
    // los cobra a 2 cada uno. Este es el caso exacto por el que no se puede
    // validar con `texto.length` ni pedirle al modelo que cuente.
    const text = 'あ'.repeat(200);
    expect(text.length).toBeLessThanOrEqual(280);
    expect(weightedLength(text).length).toBe(400);
    expect(weightedLength(text).valid).toBe(false);
  });

  it('keeps Spanish accents at one unit, so a normal post is not penalised', () => {
    const text = 'á'.repeat(270);
    expect(weightedLength(text).length).toBe(270);
    expect(weightedLength(text).valid).toBe(true);
  });

  it('normalises combining accents so the same word never weighs two different amounts', () => {
    const precomposed = 'canción';
    const decomposed = 'canción';
    expect(precomposed).not.toBe(decomposed);
    expect(weightedLength(decomposed).length).toBe(weightedLength(precomposed).length);
  });
});

describe('validateThread', () => {
  it('accepts a thread that respects every rule', () => {
    expect(validateThread(goodThread(), REPLY, ALLOWED)).toEqual([]);
  });

  it('rejects any URL inside the thread, which is what kills its reach', () => {
    const tweets = goodThread();
    tweets[2] = `Lo conté acá: ${OK_URL}`;
    const issues = validateThread(tweets, REPLY, ALLOWED);
    expect(issues).toContainEqual(expect.objectContaining({ target: 'tweet_3', code: 'FORMAT' }));
  });

  it('rejects a hook whose first line runs long', () => {
    const tweets = goodThread();
    tweets[0] = 'Algunas reflexiones sobre por qué migrar componentes suele salir bastante peor de lo esperado.';
    const issues = validateThread(tweets, REPLY, ALLOWED);
    expect(issues).toContainEqual(expect.objectContaining({ code: 'MISLEADING_HOOK' }));
  });

  it('rejects a project that must never be named in public', () => {
    const tweets = goodThread();
    tweets[1] = 'Lo mismo me pasó armando PayTrack el año pasado.';
    const issues = validateThread(tweets, REPLY, ALLOWED);
    expect(issues).toContainEqual(expect.objectContaining({ code: 'UNSUPPORTED_CLAIM', target: 'tweet_2' }));
  });

  it('rejects prefabricated AI phrasing and em dashes', () => {
    const tweets = goodThread();
    tweets[1] = 'En el mundo del desarrollo esto es crucial — y conviene tenerlo presente.';
    const issues = validateThread(tweets, REPLY, ALLOWED);
    expect(issues.filter((issue) => issue.code === 'STYLE').length).toBeGreaterThanOrEqual(2);
  });

  it('rejects a link that is not on the allow list', () => {
    const issues = validateThread(goodThread(), 'Miralo acá: https://ejemplo-no-autorizado.com/post', ALLOWED);
    expect(issues).toContainEqual(expect.objectContaining({ target: 'link_reply' }));
  });

  it('rejects a reply with no link at all, which would strand the thread', () => {
    const issues = validateThread(goodThread(), 'Gracias por leer.', ALLOWED);
    expect(issues).toContainEqual(expect.objectContaining({ target: 'link_reply' }));
  });

  it('rejects a thread outside the 4 to 6 range', () => {
    const short = goodThread().slice(0, 2);
    expect(validateThread(short, REPLY, ALLOWED)).toContainEqual(
      expect.objectContaining({ code: 'FORMAT', target: 'thread' }),
    );
  });

  it('rejects manual numbering, which X already handles', () => {
    const tweets = goodThread();
    tweets[0] = '1/4 Migré 40 componentes.';
    expect(validateThread(tweets, REPLY, ALLOWED)).toContainEqual(
      expect.objectContaining({ code: 'FORMAT', target: 'tweet_1' }),
    );
  });

  it('reports every problem at once, so a rewrite can fix them in one pass', () => {
    const issues = validateThread(
      ['1/2 En el mundo del desarrollo esto es crucial y va con link https://x.com/a', 'Corto.'],
      'Sin link',
      ALLOWED,
    );
    expect(issues.length).toBeGreaterThan(3);
  });
});
