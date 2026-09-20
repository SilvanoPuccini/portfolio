'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * La decisión, al pie de la propuesta.
 *
 * Tres salidas, no dos. «Lo estoy pensando» es la respuesta más común de una
 * venta real —hay que hablarlo con el socio, esperar la cobranza del mes— y
 * hasta ahora no tenía botón: el cliente cerraba la pestaña y desde el panel
 * eso se veía igual que el desinterés.
 *
 * Ahora elige cuándo quiere que le escriban y queda agendado. El silencio se
 * convierte en una fecha, que es la diferencia entre perseguir a alguien y
 * respetarle el tiempo.
 */

type Answer = 'aceptada' | 'rechazada' | 'pensando';
type Mode = 'idle' | 'pensando' | 'rechazando';

/** Las esperas razonables. Más de un mes no es pensarlo, es un no. */
const WAITS = [
  { label: 'Unos días', days: 3 },
  { label: 'Una semana', days: 7 },
  { label: 'Dos semanas', days: 14 },
];

export function ProposalDecision({ token, answered }: { token: string; answered?: string | null }) {
  const [mode, setMode] = useState<Mode>('idle');
  const [motivo, setMotivo] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(answered ?? null);
  const [error, setError] = useState('');
  const router = useRouter();

  async function answer(respuesta: Answer, days?: number) {
    setBusy(true);
    setError('');
    const response = await fetch('/api/propuesta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        respuesta,
        motivo,
        ...(days ? { recordar: new Date(Date.now() + days * 86_400_000).toISOString() } : {}),
      }),
    });
    const json = await response.json().catch(() => ({})) as { error?: string; yaRespondida?: boolean };
    setBusy(false);

    if (json.yaRespondida) return setError('Esta propuesta ya fue respondida. Si querés cambiar algo, escribime y lo vemos.');
    if (!response.ok) return setError(json.error ?? 'No se pudo registrar tu respuesta. Probá de nuevo o respondé el correo.');
    setDone(respuesta);
    // Al aceptar, el contrato ya existe del lado del servidor: recargar la
    // página lo trae para firmarlo acá mismo, sin esperar ningún correo.
    if (respuesta === 'aceptada') router.refresh();
  }

  if (done === 'aceptada' || done === 'rechazada') {
    const accepted = done === 'aceptada';
    return (
      <div
        className={`surface-panel border px-7 py-10 text-center ${
          accepted ? 'border-brand-primary/30' : 'border-outline-ghost/15'
        }`}
      >
        <p className="section-title-sm">{accepted ? 'Listo, gracias' : 'Gracias por avisar'}</p>
        <p className="mx-auto mt-3 max-w-md text-base leading-7 text-text-secondary">
          {accepted
            ? 'En unos minutos te llega el contrato para firmar. Cuando esté firmado, te paso los datos de pago.'
            : 'Queda anotado. Si más adelante cambia algo, escribime y lo retomamos donde lo dejamos.'}
        </p>
      </div>
    );
  }

  if (done === 'pensando') {
    return (
      <div className="surface-panel border border-outline-ghost/15 px-7 py-10 text-center">
        <p className="section-title-sm">Dale, tomate el tiempo</p>
        <p className="mx-auto mt-3 max-w-md text-base leading-7 text-text-secondary">
          Te escribo en la fecha que elegiste. Este link te sigue sirviendo: si te decidís antes, entrá y aceptá
          desde acá.
        </p>
        <button
          className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-brand-primary hover:underline"
          onClick={() => { setDone(null); setMode('idle'); }}
        >
          Quiero decidir ahora
        </button>
      </div>
    );
  }

  return (
    <div className="surface-panel relative overflow-hidden border border-brand-primary/25 px-7 py-10 sm:px-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgb(var(--brand-primary)/0.6),transparent)]"
      />

      <h2 className="section-title-sm">¿Avanzamos?</h2>
      <p className="mt-3 max-w-xl text-base leading-7 text-text-secondary">
        Si aceptás, te mando el contrato para firmar. Todavía no se paga nada: la seña va después de la firma.
      </p>

      {mode === 'pensando' && (
        <div className="mt-7 border-t border-outline-ghost/10 pt-6">
          <p className="technical-label">¿Cuándo te escribo?</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {WAITS.map((wait) => (
              <button
                key={wait.days}
                disabled={busy}
                onClick={() => void answer('pensando', wait.days)}
                className="rounded-full border border-outline-ghost/20 px-5 py-2 text-sm text-text-primary transition-colors hover:border-brand-primary/50 hover:text-brand-primary"
              >{wait.label}</button>
            ))}
          </div>
          <textarea
            aria-label="Qué estás por resolver"
            value={motivo}
            onChange={(event) => setMotivo(event.target.value)}
            placeholder="Opcional: qué tenés que resolver antes (el presupuesto, hablarlo con alguien…)"
            className="mt-4 min-h-[90px] w-full rounded-[var(--radius-soft)] border border-outline-ghost/20 bg-[rgb(var(--background)/0.4)] p-3 text-sm text-text-primary"
          />
        </div>
      )}

      {mode === 'rechazando' && (
        <div className="mt-7 border-t border-outline-ghost/10 pt-6">
          <p className="technical-label">¿Por qué no?</p>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            Me sirve saberlo aunque sea en una línea. Si es algo que se puede ajustar, lo ajusto.
          </p>
          <textarea
            aria-label="Por qué no avanzamos"
            value={motivo}
            onChange={(event) => setMotivo(event.target.value)}
            placeholder="El precio, los tiempos, se pospuso el proyecto…"
            className="mt-4 min-h-[90px] w-full rounded-[var(--radius-soft)] border border-outline-ghost/20 bg-[rgb(var(--background)/0.4)] p-3 text-sm text-text-primary"
          />
          <button
            disabled={busy}
            onClick={() => void answer('rechazada')}
            className="button-primary mt-4"
          >{busy ? 'Un segundo…' : 'Enviar mi respuesta'}</button>
        </div>
      )}

      {mode === 'idle' && (
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
          <button className="button-primary" disabled={busy} onClick={() => void answer('aceptada')}>
            {busy ? 'Un segundo…' : 'Acepto, mandame el contrato'}
          </button>
          <button
            className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-secondary transition-colors hover:text-text-primary"
            onClick={() => setMode('pensando')}
          >
            Dejámelo pensar
          </button>
          <button
            className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-tertiary transition-colors hover:text-text-primary"
            onClick={() => setMode('rechazando')}
          >
            No por ahora
          </button>
        </div>
      )}

      {error && <p role="alert" className="mt-6 text-sm text-[rgb(var(--danger))]">{error}</p>}
    </div>
  );
}
