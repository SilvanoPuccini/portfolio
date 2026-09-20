'use client';

import { useState } from 'react';

/**
 * La decisión del cliente, al pie del diagnóstico.
 *
 * Es lo único interactivo de la página: el resto es lectura. Decir que no
 * tiene que ser igual de fácil que decir que sí — un «no» con motivo vale
 * mucho más que dos semanas de silencio.
 */
export function ProposalDecision({ token, answered }: { token: string; answered?: string | null }) {
  const [motivo, setMotivo] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(answered ?? null);
  const [error, setError] = useState('');

  async function answer(respuesta: 'aceptada' | 'rechazada') {
    setBusy(true);
    setError('');
    const response = await fetch('/api/propuesta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, respuesta, motivo }),
    });
    const json = await response.json().catch(() => ({})) as { error?: string; yaRespondida?: boolean };
    setBusy(false);

    if (json.yaRespondida) return setError('Esta propuesta ya fue respondida. Si querés cambiar algo, escribime y lo vemos.');
    if (!response.ok) return setError(json.error ?? 'No se pudo registrar tu respuesta. Probá de nuevo o respondé el correo.');
    setDone(respuesta);
  }

  if (done === 'aceptada') {
    return (
      <div className="surface-panel border border-brand-primary/30 bg-brand-primary/5 px-6 py-8 text-center">
        <p className="text-lg font-semibold text-text-primary">Listo, gracias</p>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          En unos minutos te llega el contrato para firmar. Cuando esté firmado, te paso los datos de pago.
        </p>
      </div>
    );
  }

  if (done === 'rechazada') {
    return (
      <div className="surface-panel border border-outline-ghost/15 px-6 py-8 text-center">
        <p className="text-lg font-semibold text-text-primary">Gracias por avisar</p>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          Queda anotado. Si más adelante cambia algo, escribime y lo retomamos donde lo dejamos.
        </p>
      </div>
    );
  }

  return (
    <div className="surface-panel border border-brand-primary/25 bg-brand-primary/5 px-6 py-8 sm:px-8">
      <h2 className="text-xl font-semibold text-text-primary">¿Avanzamos?</h2>
      <p className="mt-2 text-sm leading-6 text-text-secondary">
        Si aceptás, te mando el contrato para firmar. Todavía no se paga nada.
      </p>

      {rejecting && (
        <textarea
          aria-label="Por qué no avanzamos"
          value={motivo}
          onChange={(event) => setMotivo(event.target.value)}
          placeholder="El precio, los tiempos, se pospuso el proyecto…"
          className="mt-5 min-h-[100px] w-full rounded-[var(--radius-soft)] border border-outline-ghost/20 bg-[rgb(var(--background)/0.4)] p-3 text-sm text-text-primary"
        />
      )}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button className="button-primary" disabled={busy} onClick={() => void answer('aceptada')}>
          {busy ? 'Un segundo…' : 'Acepto, mandame el contrato'}
        </button>

        {rejecting ? (
          <button
            className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-tertiary transition-colors hover:text-text-primary"
            disabled={busy}
            onClick={() => void answer('rechazada')}
          >
            Enviar mi respuesta
          </button>
        ) : (
          <button
            className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-tertiary transition-colors hover:text-text-primary"
            onClick={() => setRejecting(true)}
          >
            No por ahora
          </button>
        )}
      </div>

      {error && <p role="alert" className="mt-5 text-sm text-[rgb(var(--danger))]">{error}</p>}
    </div>
  );
}
