/**
 * `twitter-text` es la implementación oficial de X y no publica tipos.
 *
 * Es CommonJS sin salida ESM, así que expone un objeto y no exportaciones
 * nombradas: `import { parseTweet }` compila en Vitest pero rompe en el build
 * de Turbopack. Se declara como default para importarlo como es de verdad.
 */
declare module 'twitter-text' {
  export interface ParsedTweet {
    /** Longitud según el peso real de cada carácter, no la cantidad. */
    weightedLength: number;
    valid: boolean;
    permillage: number;
    displayRangeStart: number;
    displayRangeEnd: number;
    validRangeStart: number;
    validRangeEnd: number;
  }
  const twitterText: {
    parseTweet(text: string): ParsedTweet;
  };
  export default twitterText;
}
