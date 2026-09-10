import { createHash } from 'node:crypto';
import { critique, writeThread, type XCritique, type XDraft } from './gemini';
import { validateThread } from './validate';
import type { XAngle } from './types';

/**
 * El circuito completo de un hilo: escribir, validar por código, criticar y
 * reescribir si hace falta.
 *
 * El orden importa. La validación mecánica corre ANTES que el crítico y su
 * resultado se le pasa: si el conteo ya falló, no tiene sentido que el modelo
 * opine sobre el estilo, y además el crítico no puede contradecir un dato
 * medido. Un modelo no sabe contar caracteres ponderados.
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
    }
  | {
      outcome: 'blocked';
      reasons: string[];
      attempts: number;
      tokens: number;
      /** Último borrador, para poder mirarlo y entender qué falló. */
      lastDraft: XDraft | null;
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

export async function orchestrateThread(params: OrchestrateParams): Promise<OrchestrateResult> {
  let tokens = 0;
  let fixes: string[] = [];
  let lastDraft: XDraft | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const written = await writeThread({ ...params, fixes });
    tokens += written.tokens;
    const draft = written.data;
    lastDraft = draft;

    if (draft.status === 'blocked') {
      // El escritor se plantó: no hay material. Reescribir no lo va a crear.
      return { outcome: 'blocked', reasons: draft.block_reasons, attempts: attempt, tokens, lastDraft };
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

    // Aprobar exige las dos cosas: el visto del crítico y cero fallas
    // mecánicas. El crítico puede equivocarse; el contador de caracteres no.
    if (verdict.verdict === 'approved' && validation.length === 0) {
      return {
        outcome: 'approved',
        draft,
        critique: verdict,
        fingerprint: fingerprint(draft.tweets, draft.reply_with_link),
        attempts: attempt,
        tokens,
      };
    }

    if (verdict.verdict === 'blocked') {
      return {
        outcome: 'blocked',
        reasons: [verdict.summary, ...verdict.issues.map((i) => `${i.target}: ${i.problem}`)],
        attempts: attempt,
        tokens,
        lastDraft,
      };
    }

    // Para la próxima vuelta: los problemas mecánicos y los editoriales juntos.
    fixes = [
      ...validation.map((issue) => `${issue.target}: ${issue.problem}`),
      ...verdict.issues.map((issue) => `${issue.target}: ${issue.problem}. Corrección: ${issue.suggested_change}`),
    ];
  }

  return {
    outcome: 'blocked',
    reasons: [`No pasó los controles en ${MAX_ATTEMPTS} intentos.`, ...fixes],
    attempts: MAX_ATTEMPTS,
    tokens,
    lastDraft,
  };
}
