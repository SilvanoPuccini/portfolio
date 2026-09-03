import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * Freno de fuerza bruta para el login del admin, persistido en Supabase.
 *
 * El limitador en memoria cuenta por IP y por proceso: en serverless eso es
 * "N intentos × cantidad de instancias", y se resetea solo con que Vercel
 * recicle una lambda. Peor: la clave sale de `x-forwarded-for`, que el cliente
 * controla en parte, así que rotando IPs el límite por IP no frena nada.
 *
 * Este contador es global y vive en la base. No distingue origen a propósito:
 * lo que frena una fuerza bruta distribuida es el total de fallos, no de dónde
 * vienen. Se cuentan solo fallos CONSECUTIVOS y un login exitoso lo reinicia,
 * así que tu propio uso normal nunca lo dispara.
 */

const THROTTLE_ID = 'admin-login';

/** Margen para que un tipeo mal no te bloquee: recién después frena. */
const FREE_ATTEMPTS = 15;

/** Primer bloqueo tras pasar el margen. Se duplica con cada fallo posterior. */
const BASE_BLOCK_MS = 60_000;

/** Techo del bloqueo: que un atacante no te deje afuera de tu propio admin. */
const MAX_BLOCK_MS = 15 * 60_000;

export interface ThrottleState {
  blocked: boolean;
  retryAfterSeconds: number;
}

/** Exportada para poder testear la curva sin tocar la base. */
export function blockDuration(failures: number): number {
  const over = failures - FREE_ATTEMPTS;
  if (over <= 0) return 0;
  return Math.min(BASE_BLOCK_MS * 2 ** (over - 1), MAX_BLOCK_MS);
}

/**
 * ¿Está frenado el login ahora mismo? Ante un error de base devuelve "no
 * bloqueado": este freno es una capa extra sobre la contraseña, no la
 * autenticación en sí, y dejar afuera al dueño por un problema de Supabase
 * sería peor que el riesgo que cubre.
 */
export async function isLoginBlocked(): Promise<ThrottleState> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('auth_throttle')
    .select('blocked_until')
    .eq('id', THROTTLE_ID)
    .maybeSingle<{ blocked_until: string | null }>();

  if (error || !data?.blocked_until) {
    return { blocked: false, retryAfterSeconds: 0 };
  }

  const remainingMs = new Date(data.blocked_until).getTime() - Date.now();
  if (remainingMs <= 0) return { blocked: false, retryAfterSeconds: 0 };

  return { blocked: true, retryAfterSeconds: Math.ceil(remainingMs / 1000) };
}

/** Suma un fallo y, si corresponde, extiende el bloqueo. */
export async function recordLoginFailure(): Promise<void> {
  const db = getSupabaseAdmin();

  const { data } = await db
    .from('auth_throttle')
    .select('failures')
    .eq('id', THROTTLE_ID)
    .maybeSingle<{ failures: number }>();

  const failures = (data?.failures ?? 0) + 1;
  const blockMs = blockDuration(failures);

  await db.from('auth_throttle').upsert(
    {
      id: THROTTLE_ID,
      failures,
      blocked_until: blockMs > 0 ? new Date(Date.now() + blockMs).toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  );
}

/** Login correcto: se limpia la cuenta de fallos. */
export async function clearLoginFailures(): Promise<void> {
  const db = getSupabaseAdmin();
  await db.from('auth_throttle').upsert(
    {
      id: THROTTLE_ID,
      failures: 0,
      blocked_until: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  );
}
