const MAX_DIAGNOSTIC_LENGTH = 300;

export type XVerificationStep = {
  step: 'lectura' | 'escritura' | 'borrado';
  ok: boolean;
  skipped?: boolean;
  detail?: string;
};

type ErrorWithStatus = Error & { status?: number; detail?: string };

function sanitizeDiagnosticText(value: string): string {
  const printable = Array.from(value, (character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127 ? ' ' : character;
  }).join('');

  return printable
    .replace(
      /(oauth_(?:consumer_key|token|signature)|access_token(?:_secret)?|api_(?:key|secret)|authorization)\s*["']?\s*[:=]\s*["']?[^,\s"'}]+/gi,
      '$1=[redacted]',
    )
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_DIAGNOSTIC_LENGTH);
}

export function normalizeXDiagnosticError(reason: unknown): string {
  const error = reason as ErrorWithStatus;
  const raw = typeof error?.detail === 'string'
    ? error.detail
    : reason instanceof Error
      ? reason.message
      : typeof reason === 'string'
        ? reason
        : 'Error desconocido';

  return sanitizeDiagnosticText(raw) || 'Error desconocido';
}

export function isXReadPolicySkip(reason: unknown): boolean {
  const error = reason as ErrorWithStatus;
  if (error?.status !== 403) return false;

  const detail = `${typeof error.detail === 'string' ? error.detail : ''} ${reason instanceof Error ? reason.message : ''}`;
  return detail.toLowerCase().includes('client-not-enrolled');
}

export function formatXVerificationFailure(payload: {
  steps?: XVerificationStep[];
  hint?: string;
}): string {
  const failed = payload.steps?.find((step) => step.step === 'escritura' && !step.ok)
    ?? payload.steps?.find((step) => !step.ok && !step.skipped);
  const detail = failed?.detail ? `: ${sanitizeDiagnosticText(failed.detail)}` : '';
  const hint = payload.hint ? ` ${sanitizeDiagnosticText(payload.hint)}` : '';

  return `${failed?.step ?? 'Verificación'} falló${detail}.${hint}`;
}

export function formatXReadWarning(steps?: XVerificationStep[]): string {
  const failedRead = steps?.find((step) => step.step === 'lectura' && !step.ok && !step.skipped);
  if (!failedRead) return '';

  const detail = failedRead.detail ? `: ${sanitizeDiagnosticText(failedRead.detail)}` : '';
  return `lectura falló${detail}. La escritura y el borrado sí fueron verificados.`;
}
