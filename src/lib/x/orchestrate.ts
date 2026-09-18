import { createHash } from 'node:crypto';
import { critique, writeThread, type XCritique, type XDraft } from './gemini';
import { validateThread } from './validate';
import { MAX_REWRITE_HISTORY, type XAngle, type XProvider, type XRewriteHistoryEntry } from './types';

/**
 * El circuito completo de un hilo: escribir, validar por código, criticar y
 * reescribir si hace falta.
 *
 * El orden importa. La validación mecánica corre ANTES que el crítico y su
 * resultado se le pasa: si el conteo ya falló, no tiene sentido que el modelo
 * opine sobre el estilo, y además el crítico no puede contradecir un dato
 * medido. Un modelo no sabe contar caracteres ponderados.
 *
 * A diferencia de la versión original, el circuito tiene MEMORIA: los fixes de
 * cada vuelta se persisten (rewrite_history) y se vuelven a pasar al escritor
 * en la siguiente corrida. Reescribir sin memoria hace que el modelo repita
 * los mismos errores en cada intento de un hilo.
 */

/** Un borrador inicial y hasta dos reescrituras. Después se bloquea. */
export const MAX_ATTEMPTS = 3;

/**
 * Señal de que el ángulo está agotado, no el texto.
 *
 * Cuando el crítico marca REPETITION el problema no se resuelve reescribiendo:
 * la tesis ya la cubrió otro hilo de la semana y cambiar las palabras no
 * vuelve nuevo un ángulo. El circuito corta acá en vez de gastar intentos, y
 * el servicio usa esta línea para probar el siguiente ángulo del plan.
 */
export const REPETITION_BLOCK_REASON = 'El ángulo ya lo cubrió otro hilo publicable de la semana: reescribirlo no lo vuelve distinto.';

export interface OrchestrateParams {
  articleTitle: string;
  articleUrl: string;
  articleText: string;
  angles: XAngle[];
  selectedAngleId: string;
  publishedThisWeek: string[];
  allowedUrls: string[];
  /** Historial ya persistido de corridas anteriores. Se suma a los fixes. */
  history?: XRewriteHistoryEntry[];
  /** Persiste una entrada histórica apenas termina cada intento. */
  onAttempt?: (entry: XRewriteHistoryEntry) => void | Promise<void>;
}

export type OrchestrateResult =
  | {
      outcome: 'approved';
      draft: XDraft;
      critique: XCritique;
      /** Huella del texto exacto aprobado. Publicar exige que coincida. */
      fingerprint: string;
      attempts: number;
      tokens: number;
      provider: string;
    }
  | {
      outcome: 'blocked';
      reasons: string[];
      attempts: number;
      tokens: number;
      /** Último borrador, para poder mirarlo y entender qué falló. */
      lastDraft: XDraft | null;
      provider: string;
    };

/**
 * Huella del paquete aprobado.
 *
 * Se calcula sobre el texto normalizado, no sobre el objeto entero: si mañana
 * alguien edita un tweet a mano, la huella deja de coincidir y el publicador
 * se niega a mandarlo hasta que vuelva a pasar los controles. Publicar algo que
 * nadie validó es exactamente lo que este circuito existe para impedir.
 */
export function fingerprint(tweets: string[], replyWithLink: string): string {
  const payload = [...tweets, replyWithLink].map((t) => t.normalize('NFC').trim()).join(' ');
  return createHash('sha256').update(payload).digest('hex');
}

/**
 * Los fixes acumulados de toda la historia persistida. Es lo que el escritor
 * recibe en el primer intento de una corrida nueva: si la corrida anterior
 * dejó problemas sin resolver, el modelo ya los conoce.
 *
 * Las entradas bloqueadas aportan sus `reasons`, no sus `fixes`. Cuando una
 * vuelta termina en `blocked` se persiste con los fixes VIEJOS (todavía no hay
 * correcciones nuevas: el crítico cortó) y el motivo real del rechazo queda en
 * `reasons`. Leyendo solo `fixes`, la devolución que causó el bloqueo no
 * llegaba nunca al escritor: la fila quedaba en `error`, se apretaba
 * "Reescribir" y el modelo arrancaba sin saber por qué lo habían rechazado.
 */
function accumulatedFixes(history: XRewriteHistoryEntry[] | undefined): string[] {
  const seen = new Set<string>();
  const fixes: string[] = [];
  const push = (fix: string) => {
    if (!seen.has(fix)) { seen.add(fix); fixes.push(fix); }
  };
  for (const entry of history ?? []) {
    for (const fix of entry.fixes) push(fix);
    if (entry.verdict === 'blocked') for (const reason of entry.reasons ?? []) push(reason);
  }
  return fixes.slice(-MAX_REWRITE_HISTORY * 4);
}

/**
 * Cuánto se acepta dormir esperando que se recupere la cuota.
 *
 * El request tiene 300s de presupuesto (maxDuration), así que un minuto entra
 * de sobra. Más que eso ya no es esperar: es rifar la corrida entera contra el
 * reloj de la función.
 */
const MAX_QUOTA_WAIT_SECONDS = 60;

/** Los segundos que pidió el proveedor, si pidió alguno que valga la pena. */
function quotaWait(error: unknown): number | null {
  if (!(error instanceof Error) || error.name !== 'ProviderFailoverError') return null;
  const seconds = (error as Error & { retryAfterSeconds?: number }).retryAfterSeconds;
  if (typeof seconds !== 'number' || seconds <= 0 || seconds >= MAX_QUOTA_WAIT_SECONDS) return null;
  return seconds;
}

/**
 * Una llamada al modelo que sobrevive a un límite de cuota.
 *
 * Si el proveedor dice "esperá N segundos", se espera y se reintenta UNA vez.
 * Un segundo 429 sube: insistir contra una cuota agotada es lo que nos hacía
 * gastar la API sin escribir nada.
 */
async function withQuotaRetry<T>(label: string, call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (error) {
    const wait = quotaWait(error);
    if (wait === null) throw error;
    console.warn(`[x/orchestrate] ${label}: durmiendo ${wait}s por límite de cuota.`);
    await new Promise((resolve) => setTimeout(resolve, wait * 1000 + 500));
    return call();
  }
}

export async function orchestrateThread(params: OrchestrateParams): Promise<OrchestrateResult> {
  let tokens = 0;
  let provider: XProvider = 'gemini';
  let fixes = accumulatedFixes(params.history);
  let lastDraft: XDraft | null = null;

  const attempt = async (n: number): Promise<OrchestrateResult> => {
    const written = await withQuotaRetry('escritura', () => writeThread({ ...params, fixes }));

    tokens += written.tokens;
    provider = written.provider;
    const draft = written.data;
    lastDraft = draft;

    if (draft.status === 'blocked') {
      const reasons = draft.block_reasons;
      await params.onAttempt?.({
        at: new Date().toISOString(),
        attempt: n,
        provider,
        fixes: [...fixes],
        verdict: 'blocked',
        reasons,
      });
      return { outcome: 'blocked', reasons, attempts: n, tokens, lastDraft, provider };
    }

    const validation = validateThread(draft.tweets, draft.reply_with_link, params.allowedUrls);

    const reviewed = await withQuotaRetry('crítica', () => critique({
      draft,
      articleTitle: params.articleTitle,
      articleText: params.articleText,
      angles: params.angles,
      selectedAngleId: params.selectedAngleId,
      publishedThisWeek: params.publishedThisWeek,
      validationReport: validation,
    }));
    tokens += reviewed.tokens;
    const verdict = reviewed.data;

    if (verdict.verdict !== 'approved' && verdict.issues.some((issue) => issue.code === 'REPETITION')) {
      const reasons = [
        REPETITION_BLOCK_REASON,
        verdict.summary,
        ...verdict.issues.map((issue) => `${issue.target}: ${issue.problem}`),
        ...validation.map((issue) => `${issue.target}: ${issue.problem}`),
      ];
      await params.onAttempt?.({
        at: new Date().toISOString(),
        attempt: n,
        provider,
        fixes: [...fixes],
        verdict: 'blocked',
        reasons,
      });
      return {
        outcome: 'blocked',
        reasons,
        attempts: n,
        tokens,
        lastDraft,
        provider,
      };
    }

    if (verdict.verdict === 'approved' && validation.length === 0) {
      await params.onAttempt?.({
        at: new Date().toISOString(),
        attempt: n,
        provider,
        fixes: [...fixes],
        verdict: 'approved',
      });
      return {
        outcome: 'approved',
        draft,
        critique: verdict,
        fingerprint: fingerprint(draft.tweets, draft.reply_with_link),
        attempts: n,
        tokens,
        provider,
      };
    }

    if (verdict.verdict === 'blocked') {
      const reasons = [verdict.summary, ...verdict.issues.map((i) => `${i.target}: ${i.problem}`)];
      await params.onAttempt?.({
        at: new Date().toISOString(),
        attempt: n,
        provider,
        fixes: [...fixes],
        verdict: 'blocked',
        reasons,
      });
      return {
        outcome: 'blocked',
        reasons,
        attempts: n,
        tokens,
        lastDraft,
        provider,
      };
    }

    // Para la próxima vuelta: los problemas mecánicos y los editoriales juntos.
    const nextFixes = [
      ...fixes,
      ...validation.map((issue) => `${issue.target}: ${issue.problem}`),
      ...verdict.issues.map((issue) => `${issue.target}: ${issue.problem}. Corrección: ${issue.suggested_change}`),
    ];
    fixes = nextFixes.slice(-MAX_REWRITE_HISTORY * 4);
    // La entrada se persiste DESPUÉS de actualizar `fixes`: la vuelta que acaba
    // de fallar es la que más importa y es la única forma de que el último
    // rechazo (con su corrección) llegue a la próxima corrida. Antes se guardaba
    // el estado viejo y la devolución del intento final se perdía.
    await params.onAttempt?.({
      at: new Date().toISOString(),
      attempt: n,
      provider,
      fixes: [...fixes],
      verdict: 'rewrite',
      reasons: [...nextFixes],
    });

    if (n >= MAX_ATTEMPTS) {
      return {
        outcome: 'blocked',
        reasons: [`No pasó los controles en ${MAX_ATTEMPTS} intentos.`, ...fixes],
        attempts: n,
        tokens,
        lastDraft,
        provider,
      };
    }
    return attempt(n + 1);
  };

  return attempt(1);
}