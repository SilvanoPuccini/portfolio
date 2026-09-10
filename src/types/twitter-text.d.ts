/**
 * `twitter-text` es la implementación oficial de X y no publica tipos.
 * Declaramos solo lo que usamos: el contador ponderado.
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
  export function parseTweet(text: string): ParsedTweet;
}
