'use client';

import { useState } from 'react';
import { ArrowRight, Mail } from 'lucide-react';

/**
 * La puerta al proyecto: un código de seis dígitos al mail de la venta.
 *
 * No es una contraseña a propósito. El cliente no tiene que inventar ni
 * recordar nada, y nosotros no guardamos nada que se pueda robar. El código
 * va siempre a la casilla donde firmó el contrato, así que un link
 * compartido no alcanza para entrar.
 */

export function AccesoCliente({ pedidoId, onEntro }: { pedidoId: string; onEntro: () => void }) {
  const [paso, setPaso] = useState<'pedir' | 'codigo'>('pedir');
  const [pista, setPista] = useState('');
  const [codigo, setCodigo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  async function llamar(cuerpo: Record<string, string> | undefined) {
    setCargando(true);
    setError('');
    try {
      const res = await fetch(`/api/pedido/${pedidoId}/acceso`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo ?? {}),
      });
      const body = await res.json() as { pista?: string; error?: string };

      if (!res.ok) {
        setError(body.error ?? 'No se pudo verificar. Probá de nuevo.');
        return null;
      }
      return body;
    } catch {
      setError('Se cortó la conexión. Probá de nuevo.');
      return null;
    } finally {
      setCargando(false);
    }
  }

  async function pedirCodigo() {
    const body = await llamar(undefined);
    if (!body) return;
    setPista(body.pista ?? '');
    setPaso('codigo');
  }

  async function verificar(event: React.FormEvent) {
    event.preventDefault();
    if (await llamar({ codigo })) onEntro();
  }

  return (
    <div className="surface-panel border border-outline-ghost/10 px-5 py-7 sm:px-8 sm:py-8">
      <Mail className="h-5 w-5 text-brand-primary" aria-hidden="true" />
      <h2 className="section-title-sm mt-4">Verificá que sos vos</h2>

      {paso === 'pedir' ? (
        <>
          <p className="mt-3 max-w-xl text-sm leading-6 text-text-secondary">
            Tu material y tu contrato están acá. Para abrirlos te mando un código al mismo correo
            donde firmaste: así, aunque alguien tenga este link, no puede ver lo tuyo.
          </p>

          {error && <p role="alert" className="mt-4 text-sm leading-6 text-red-400">{error}</p>}

          <button type="button" onClick={pedirCodigo} disabled={cargando} className="button-primary mt-6 gap-2">
            <span>{cargando ? 'Enviando…' : 'Mandame el código'}</span>
            {!cargando && <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />}
          </button>
        </>
      ) : (
        <form onSubmit={verificar}>
          <p className="mt-3 max-w-xl text-sm leading-6 text-text-secondary">
            Te mandé un código de seis dígitos a <span className="text-text-primary">{pista}</span>.
            Vence en diez minutos.
          </p>

          <label className="mt-6 block max-w-[14rem]">
            <span className="technical-label">Tu código</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              autoFocus
              className="form-field mt-2 text-center font-mono text-2xl tracking-[0.3em]"
              value={codigo}
              onChange={(event) => setCodigo(event.target.value.replace(/\D/g, ''))}
            />
          </label>

          {error && <p role="alert" className="mt-4 text-sm leading-6 text-red-400">{error}</p>}

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button type="submit" className="button-primary" disabled={cargando || codigo.length < 6}>
              {cargando ? 'Verificando…' : 'Entrar'}
            </button>
            <button
              type="button"
              onClick={pedirCodigo}
              disabled={cargando}
              className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-tertiary transition-colors hover:text-text-primary"
            >
              No me llegó, mandá otro
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
