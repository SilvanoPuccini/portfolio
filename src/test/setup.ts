import "@testing-library/jest-dom/vitest";

/**
 * jsdom no implementa IntersectionObserver y el sistema de motion del sitio
 * (`Reveal`) lo usa para animar al entrar en pantalla. Sin esto, cualquier
 * test que renderice una página pública explota por una animación.
 *
 * El doble no observa nada: en un test no hay viewport que mirar, y lo que
 * importa es que el contenido esté en el DOM.
 */
class NoopIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = '';
  readonly thresholds: ReadonlyArray<number> = [];
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords(): IntersectionObserverEntry[] { return []; }
}

if (typeof globalThis.IntersectionObserver === 'undefined') {
  globalThis.IntersectionObserver = NoopIntersectionObserver as unknown as typeof IntersectionObserver;
}
