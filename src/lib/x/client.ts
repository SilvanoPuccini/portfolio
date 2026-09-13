import { createHmac, randomBytes } from 'node:crypto';

/**
 * Cliente de X: firma OAuth 1.0a y publica hilos.
 *
 * OAuth 1.0a y no OAuth 2.0 porque el usuario es uno solo y es el dueño de la
 * app: con las cuatro credenciales fijas se firma cada pedido y no hace falta
 * el baile de autorización, el refresco de token ni guardar estado.
 *
 * El Bearer Token no sirve acá: autentica a la app pero no a una persona, y
 * publicar exige actuar como alguien.
 */

const API = 'https://api.x.com/2';

export interface XCredentials {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
}

export function credentialsFromEnv(): XCredentials {
  const apiKey = process.env.X_API_KEY;
  const apiSecret = process.env.X_API_SECRET;
  const accessToken = process.env.X_ACCESS_TOKEN;
  const accessTokenSecret = process.env.X_ACCESS_TOKEN_SECRET;
  if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
    throw new Error('[x/client] Faltan credenciales de X en el entorno');
  }
  return { apiKey, apiSecret, accessToken, accessTokenSecret };
}

/**
 * Percent-encoding de RFC 3986, que es más estricto que encodeURIComponent:
 * `!`, `*`, `'`, `(` y `)` también se codifican. Si esto no se respeta al pie
 * de la letra, la firma no coincide y X devuelve 401 sin explicar por qué.
 */
export function percentEncode(value: string): string {
  return encodeURIComponent(value).replace(
    /[!*'()]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

/**
 * Arma la firma de un pedido. Los parámetros se ordenan alfabéticamente ya
 * codificados, y el resultado se concatena con método y URL. Es determinista:
 * con el mismo nonce y timestamp da siempre lo mismo, y por eso se puede testear.
 */
export function buildSignature(params: {
  method: string;
  url: string;
  oauthParams: Record<string, string>;
  consumerSecret: string;
  tokenSecret: string;
}): string {
  const sorted = Object.keys(params.oauthParams).sort()
    .map((key) => `${percentEncode(key)}=${percentEncode(params.oauthParams[key])}`)
    .join('&');

  const base = [
    params.method.toUpperCase(),
    percentEncode(params.url),
    percentEncode(sorted),
  ].join('&');

  const signingKey = `${percentEncode(params.consumerSecret)}&${percentEncode(params.tokenSecret)}`;
  return createHmac('sha1', signingKey).update(base).digest('base64');
}

function authHeader(method: string, url: string, credentials: XCredentials): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: credentials.apiKey,
    oauth_nonce: randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: credentials.accessToken,
    oauth_version: '1.0',
  };

  // El cuerpo va en JSON, así que no entra en la firma: solo los oauth_*.
  oauthParams.oauth_signature = buildSignature({
    method, url, oauthParams,
    consumerSecret: credentials.apiSecret,
    tokenSecret: credentials.accessTokenSecret,
  });

  const header = Object.keys(oauthParams).sort()
    .map((key) => `${percentEncode(key)}="${percentEncode(oauthParams[key])}"`)
    .join(', ');
  return `OAuth ${header}`;
}

export interface XApiError {
  status: number;
  detail: string;
}

/**
 * X devolvió 402 y el cuerpo lo afirma: la cuenta quedó sin crédito.
 *
 * Es un estado TRANSITORIO y de negocio, no un error opaco del endpoint: para
 * el circuito manual no hay que reintentar ni marcar fallo de infraestructura,
 * hay que avisarle a la persona que copie y publique a mano. Por eso es un tipo
 * propio y no un `XApiError` genérico.
 *
 * Se tipifica SOLO si el cuerpo confirma el título/type de crédito. Un 401 de
 * auth no se toca: ahí es un error real de configuración.
 */
export class XCreditsDepletedError extends Error {
  readonly status = 402;
  readonly code = 'credits-depleted';
  constructor(detail: string) {
    super(`[x/credits] La cuenta de X quedó sin crédito: ${detail || 'copiá y publicá a mano'}`);
    this.name = 'XCreditsDepletedError';
  }
}

export function isCreditsDepletedError(reason: unknown): reason is XCreditsDepletedError {
  return reason instanceof XCreditsDepletedError;
}

/** Mensaje estable para el panel: el hilo no se publica desde acá, se copia. */
export const CREDITS_DEPLETED_MESSAGE = 'Sin crédito en X: copiá y publicá a mano.';

async function request<T>(method: 'GET' | 'POST' | 'DELETE', path: string, credentials: XCredentials, body?: unknown): Promise<T> {
  const url = `${API}${path}`;
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: authHeader(method, url, credentials),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const text = await response.text();
  if (!response.ok) {
    if (response.status === 402 && /credit/i.test(text)) {
      throw new XCreditsDepletedError(text.slice(0, 300));
    }
    const error: XApiError = { status: response.status, detail: text.slice(0, 400) };
    throw Object.assign(new Error(`[x/client] ${method} ${path} → ${response.status}${text ? `: ${text.slice(0, 300)}` : ''}`), error);
  }
  return (text ? JSON.parse(text) : {}) as T;
}

/** Lectura barata para confirmar que las credenciales están vivas. */
export async function whoAmI(credentials = credentialsFromEnv()) {
  return request<{ data: { id: string; name: string; username: string } }>('GET', '/users/me', credentials);
}

export async function postTweet(text: string, replyToId: string | null, credentials = credentialsFromEnv()) {
  const body: Record<string, unknown> = { text };
  if (replyToId) body.reply = { in_reply_to_tweet_id: replyToId };
  const json = await request<{ data: { id: string } }>('POST', '/tweets', credentials, body);
  return json.data.id;
}

export async function deleteTweet(id: string, credentials = credentialsFromEnv()) {
  try {
    await request<{ data: { deleted: boolean } }>('DELETE', `/tweets/${id}`, credentials);
    return true;
  } catch (reason) {
    // Si ya no existe, el objetivo estaba cumplido. Borrar es idempotente.
    if ((reason as XApiError).status === 404) return true;
    throw reason;
  }
}

export interface PublishProgress {
  /** IDs ya publicados, en orden. Se pasa al retomar un hilo cortado. */
  publishedIds: string[];
}

/**
 * Publica un hilo encadenando cada post al anterior.
 *
 * Guarda el id de cada uno apenas sale, mediante onProgress. Si el cuarto
 * falla, los tres primeros ya están en X: reintentar desde cero publicaría
 * duplicados. Con los ids guardados, la próxima vuelta arranca en el cuarto.
 */
export async function publishThread(params: {
  texts: string[];
  alreadyPublished?: string[];
  onProgress: (ids: string[]) => Promise<void>;
  credentials?: XCredentials;
}): Promise<string[]> {
  const credentials = params.credentials ?? credentialsFromEnv();
  const ids = [...(params.alreadyPublished ?? [])];

  for (let index = ids.length; index < params.texts.length; index++) {
    const replyTo = ids.length > 0 ? ids[ids.length - 1] : null;
    const id = await postTweet(params.texts[index], replyTo, credentials);
    ids.push(id);
    // Persistir antes de seguir: si el proceso muere en el siguiente, el id
    // de este ya quedó guardado y no se republica.
    await params.onProgress(ids);
  }

  return ids;
}

export function threadUrl(username: string, firstTweetId: string): string {
  return `https://x.com/${username}/status/${firstTweetId}`;
}
