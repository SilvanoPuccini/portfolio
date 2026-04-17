/**
 * Simple sliding-window in-memory rate limiter.
 * Works per-process (not distributed), which is fine for a portfolio.
 * Prevents casual abuse and bot storms without requiring external services.
 */

const store = new Map<string, number[]>();

/**
 * Returns true if the request is allowed, false if it exceeds the limit.
 * @param key      Identifier (e.g. IP address)
 * @param limit    Max requests allowed in the window
 * @param windowMs Window size in milliseconds
 */
export function rateLimit(key: string, limit = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const timestamps = (store.get(key) ?? []).filter((t) => now - t < windowMs);

  if (timestamps.length >= limit) return false;

  timestamps.push(now);
  store.set(key, timestamps);
  return true;
}
