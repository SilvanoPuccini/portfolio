'use client';

import { use, useState } from 'react';

/**
 * Donde el cliente contesta la propuesta.
 *
 * Los botones del correo traen la respuesta preseleccionada, pero la decisión
 * se confirma acá con un clic: un link de correo lo abre cualquier filtro de
 * seguridad, y aceptar una propuesta dispara un contrato.
 *
 * Es pública y sin sesión —el cliente no tiene cuenta— y por eso no muestra
 * nada del lead: solo confirma lo que la persona ya tiene en su correo.
 */

type Params = Promise<{ token: string }>;
type Query = Promise<{ r?: string }>;

export default function PropuestaPage({ params, searchParams }: { params: Params; searchParams: Query }) {
  const { token } = use(params);
  const { r } = use(searchParams);

  const [motivo, setMotivo] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<'aceptada' | 'rechazada' | null>(null);
  const [error, setError] = useState('');

  const rejecting = r === 'rechazar';

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

  return (
    <main className="site-container flex min-h-[70vh] items-center justify-center py-16">
      <div className="surface-panel w-full max-w-lg border border-outline-ghost/10 px-6 py-10 sm:px-10">
        {done === 'aceptada' && (
          <>
            <h1 className="text-2xl font-semibold text-text-primary">Listo, gracias</h1>
            <p className="mt-4 text-base leading-7 text-text-secondary">
              En unos minutos te llega el contrato para firmar. Cuando esté firmado, te mando los datos de pago.
            </p>
          </>
        )}

        {done === 'rechazada' && (
          <>
            <h1 className="text-2xl font-semibold text-text-primary">Gracias por avisar</h1>
            <p className="mt-4 text-base leading-7 text-text-secondary">
              Queda anotado. Si más adelante cambia algo, escribime y lo retomamos donde lo dejamos.
            </p>
          </>
        )}

        {!done && (
          <>
            <h1 className="text-2xl font-semibold text-text-primary">
              {rejecting ? '¿Lo dejamos para más adelante?' : '¿Avanzamos con la propuesta?'}
            </h1>
            <p className="mt-4 text-base leading-7 text-text-secondary">
              {rejecting
                ? 'Si me contás por qué, me sirve para saber si hay algo que se pueda ajustar.'
                : 'Si aceptás, te mando el contrato para firmar. Todavía no se paga nada.'}
            </p>

            {rejecting && (
              <textarea
                aria-label="Por qué no avanzamos"
                value={motivo}
                onChange={(event) => setMotivo(event.target.value)}
                placeholder="El precio, los tiempos, se pospuso el proyecto…"
                className="mt-6 min-h-[110px] w-full rounded-[var(--radius-soft)] border border-outline-ghost/20 bg-[rgb(var(--background)/0.4)] p-3 text-sm text-text-primary"
              />
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              {!rejecting && (
                <button className="button-primary" disabled={busy} onClick={() => void answer('aceptada')}>
                  {busy ? 'Un segundo…' : 'Acepto, mandame el contrato'}
                </button>
              )}
              <button
                className={rejecting ? 'button-primary' : 'font-mono text-[11px] uppercase tracking-[0.16em] text-text-tertiary hover:text-text-primary'}
                disabled={busy}
                onClick={() => void answer('rechazada')}
              >
                {rejecting ? 'Enviar' : 'No por ahora'}
              </button>
            </div>

            {error && <p role="alert" className="mt-6 text-sm text-[rgb(var(--danger))]">{error}</p>}
          </>
        )}
      </div>
    </main>
  );
}
