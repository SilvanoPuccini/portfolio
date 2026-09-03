/**
 * Margen de tolerancia hacia adelante del cron de publicación.
 *
 * El cron corre a las 13:00 UTC (10:00 en Argentina) y los posts se programan
 * justo a esa hora. Sin margen, que un post salga o no dependería de si Vercel
 * dispara la corrida una fracción de segundo antes o después de la hora
 * exacta: si cae antes, el post no sale y el siguiente intento es 24hs
 * después. Con este margen la comparación deja de ser un empate de relojes, y
 * como mucho un post sale unos minutos antes de lo programado.
 */
export const PUBLISH_WINDOW_MINUTES = 15;

/** Límite superior de "ya le toca salir" para una corrida del cron. */
export function publishCutoff(now: Date = new Date()): string {
  return new Date(now.getTime() + PUBLISH_WINDOW_MINUTES * 60_000).toISOString();
}

/** ¿A este post le toca salir en esta corrida? */
export function isDue(scheduledAt: string, now: Date = new Date()): boolean {
  return new Date(scheduledAt).getTime() <= new Date(publishCutoff(now)).getTime();
}
