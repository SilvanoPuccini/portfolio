import twitterText from 'twitter-text';
import { NEVER_MENTION } from './author-profile';

/**
 * Controles que NO delegamos en ninguna IA.
 *
 * Un segundo modelo revisando al primero puede compartir sus errores. Estas
 * reglas son mecánicas y verificables: o se cumplen o no. Si algo de acá falla,
 * no se publica, sin importar qué haya dictaminado el crítico.
 */

export const MAX_TWEETS = 6;
export const MIN_TWEETS = 4;
/** El límite real de X es 280 ponderados; el generador apunta a 260 para dejar aire. */
export const HOOK_MAX_WORDS = 9;

export interface ValidationIssue {
  code: string;
  target: string;
  problem: string;
}

/**
 * X no cuenta caracteres, cuenta "peso": los emoji y varios alfabetos valen 2,
 * y toda URL vale 23 fijos sin importar su largo. Por eso el conteo lo hace la
 * librería oficial de X y no `texto.length` ni el modelo, que no puede contar.
 */
export function weightedLength(text: string): { length: number; valid: boolean } {
  // NFC primero: "á" puede venir como un carácter o como dos, y pesan distinto.
  const parsed = twitterText.parseTweet(text.normalize('NFC'));
  return { length: parsed.weightedLength, valid: parsed.valid };
}

/** Detecta URLs de cualquier forma, para exigir que el hilo no tenga ninguna. */
const URL_PATTERN = /(https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(com|dev|ar|io|net|org|co)\b/i;

/** Tics de redacción de IA. Si aparecen, el texto no suena a él. */
const SLOP = [
  'en el mundo del desarrollo', 'en la era de la', 'no es solo', 'sino que también',
  'en el vertiginoso', 'cabe destacar', 'es crucial', 'es fundamental',
  'desbloquear', 'aprovechar al máximo', 'llevar al siguiente nivel',
  'en resumen,', 'en conclusión,',
];

function firstLineWords(text: string): number {
  const firstLine = text.normalize('NFC').split('\n')[0] ?? '';
  return firstLine.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Valida el paquete completo. Devuelve todos los problemas, no solo el primero:
 * si el generador tiene que reescribir, conviene que los vea todos de una.
 */
export function validateThread(tweets: string[], replyWithLink: string, allowedUrls: string[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const push = (code: string, target: string, problem: string) => issues.push({ code, target, problem });

  if (tweets.length < MIN_TWEETS || tweets.length > MAX_TWEETS) {
    push('FORMAT', 'thread', `El hilo tiene ${tweets.length} posts; se esperan entre ${MIN_TWEETS} y ${MAX_TWEETS}.`);
  }

  tweets.forEach((tweet, index) => {
    const target = `tweet_${index + 1}`;

    if (!tweet.trim()) return push('FORMAT', target, 'El post está vacío.');

    const { length, valid } = weightedLength(tweet);
    if (!valid) push('FORMAT', target, `X rechaza este post: ${length} caracteres ponderados sobre 280.`);

    // Cero links en el hilo: un post con link pierde casi todo su alcance.
    if (URL_PATTERN.test(tweet)) push('FORMAT', target, 'El hilo no puede contener ninguna URL.');

    // La numeración la pone X sola.
    if (/^\s*\d+\s*\/\s*\d+/.test(tweet)) push('FORMAT', target, 'No numerar los posts.');

    const lower = tweet.toLowerCase();
    for (const phrase of SLOP) {
      if (lower.includes(phrase)) push('STYLE', target, `Frase prefabricada: "${phrase}".`);
    }
    if (tweet.includes('—')) push('STYLE', target, 'Sin rayas largas.');

    for (const forbidden of NEVER_MENTION) {
      if (new RegExp(`\\b${forbidden.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(tweet)) {
        push('UNSUPPORTED_CLAIM', target, `Menciona "${forbidden}", que no se cita nunca.`);
      }
    }
  });

  const hook = tweets[0];
  if (hook) {
    const words = firstLineWords(hook);
    if (words < 1 || words > HOOK_MAX_WORDS) {
      push('MISLEADING_HOOK', 'tweet_1', `La primera línea tiene ${words} palabras; se esperan entre 1 y ${HOOK_MAX_WORDS}.`);
    }
  }

  const hashtags = tweets.join(' ').match(/#\w+/g) ?? [];
  if (hashtags.length > 1) push('FORMAT', 'thread', `${hashtags.length} hashtags; se permite uno como máximo.`);

  // La respuesta es el único lugar donde puede haber links, y solo los autorizados.
  const { valid: replyValid, length: replyLength } = weightedLength(replyWithLink);
  if (!replyValid) push('FORMAT', 'link_reply', `La respuesta con links no entra: ${replyLength} sobre 280.`);

  const urlsInReply = replyWithLink.match(/https?:\/\/\S+/g) ?? [];
  if (urlsInReply.length === 0) push('FORMAT', 'link_reply', 'La respuesta tiene que llevar al menos una URL.');
  for (const url of urlsInReply) {
    const clean = url.replace(/[.,;)]+$/, '');
    if (!allowedUrls.includes(clean)) {
      push('FORMAT', 'link_reply', `URL no autorizada: ${clean}`);
    }
  }

  return issues;
}
