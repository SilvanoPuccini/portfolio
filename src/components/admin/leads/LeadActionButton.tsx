'use client';

import { s } from '@/components/admin/AdminShell';
import { c } from '@/components/admin/tokens';

/**
 * Una acción que sale hacia afuera: mandar el cuestionario, la propuesta, el
 * contrato. Las tres repetían el mismo bloque — botón, «Enviando...», mensaje
 * de éxito y mensaje de error — con los colores escritos a mano cada vez.
 *
 * El resultado se muestra al lado del botón y no en un cartel arriba: quien
 * apretó necesita la respuesta donde está mirando.
 */
export function LeadActionButton({ label, sendingLabel, tone, busy, done, doneLabel, error, onClick, hint }: {
  label: string;
  sendingLabel?: string;
  /** El color del botón. Cada acción tiene el suyo en el panel. */
  tone: string;
  busy: boolean;
  done: boolean;
  doneLabel: string;
  error?: string;
  onClick: () => void;
  hint?: string;
}) {
  return (
    <>
      {hint && <p style={s.hint}>{hint}</p>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: hint ? 14 : 0, flexWrap: 'wrap' }}>
        <button type="button" onClick={onClick} disabled={busy}
          style={{
            ...s.btn,
            background: busy ? c.border : tone,
            opacity: busy ? 0.7 : 1,
            cursor: busy ? 'not-allowed' : 'pointer',
          }}>
          {busy ? (sendingLabel ?? 'Enviando...') : label}
        </button>
        {done && <p style={s.successText}>{doneLabel}</p>}
        {error && <p style={s.errorText}>{error}</p>}
      </div>
    </>
  );
}
