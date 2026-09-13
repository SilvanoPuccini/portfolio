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
 */
function accumulatedFixes(history: XRewriteHistoryEntry[] | undefined): string[] {
  const seen = new Set<string>();
  const fixes: string[] = [];
  for (const entry of history ?? []) {
    for (const fix of entry.fixes) {
      if (!seen.has(fix)) { seen.add(fix); fixes.push(fix); }
    }
  }
  return fixes.slice(-MAX_REWRITE_HISTORY * 4);
}

export async function orchestrateThread(params: OrchestrateParams): Promise<OrchestrateResult> {
  let tokens = 0;
  let provider: XProvider = 'gemini';
  let fixes = accumulatedFixes(params.history);
  let lastDraft: XDraft | null = null;

  const attempt = async (n: number): Promise<OrchestrateResult> => {
    const written = await writeThread({ ...params, fixes });
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

    const reviewed = await critique({
      draft,
      articleTitle: params.articleTitle,
      articleText: params.articleText,
      angles: params.angles,
      selectedAngleId: params.selectedAngleId,
      publishedThisWeek: params.publishedThisWeek,
      validationReport: validation,
    });
    tokens += reviewed.tokens;
    const verdict = reviewed.data;

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
    await params.onAttempt?.({
      at: new Date().toISOString(),
      attempt: n,
      provider,
      fixes: [...fixes],
      verdict: 'rewrite',
    });
    fixes = nextFixes.slice(-MAX_REWRITE_HISTORY * 4);

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