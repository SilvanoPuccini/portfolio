'use client';

import { useState } from 'react';
import { Check, FileText } from 'lucide-react';

import type { Clausula } from '@/content/contrato';

/**
 * El contrato, leído y firmado en la misma página.
 *
 * El cliente ve el texto completo, no un resumen ni un adjunto que tiene que
 * abrir aparte. Escribe su nombre y acepta: eso es una firma electrónica, y
 * lo que la sostiene es la evidencia que se guarda del otro lado.
 *
 * El botón está apagado hasta que tildó y escribió su nombre. No es un
 * trámite: es el momento en que se obliga, y tiene que notarse.
 */

export function FirmaContrato({
  pedidoId,
  clausulas,
  nombreEsperado,
  onFirmado,
}: {
  pedidoId: string;
  clausulas: Clausula[];
  nombreEsperado: string;
  /** Sin esto se recarga: la página vuelve a calcular su etapa y cae en el pago. */
  onFirmado?: () => void;
}) {
  const [nombre, setNombre] = useState('');
  const [acepta, setAcepta] = useState(false);
  const [firmando, setFirmando] = useState(false);
  const [error, setError] = useState('');

  async function firmar(event: React.FormEvent) {
    event.preventDefault();
    setFirmando(true);
    setError('');

    try {
      const res = await fetch(`/api/pedido/${pedidoId}/firmar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, acepta }),
      });
      const body = await res.json() as { error?: string };

      if (!res.ok) {
        setError(body.error ?? 'No se pudo firmar. Probá de nuevo en un momento.');
        return;
      }
      if (onFirmado) onFirmado();
      else window.location.reload();
    } catch {
      setError('Se cortó la conexión. Probá de nuevo: no se firmó nada.');
    } finally {
      setFirmando(false);
    }
  }

  return (
    <div>
      <div className="surface-panel border border-outline-ghost/10 px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 shrink-0 text-brand-primary" aria-hidden="true" />
          <h2 className="section-title-sm">Contrato de prestación de servicios</h2>
        </div>
        <p className="mt-3 text-sm leading-6 text-text-secondary">
          Leelo con calma. Firmar no dispara ningún cobro: los datos para pagar aparecen después.
        </p>

        {/* El contrato entero, no un resumen: lo que se firma es esto. */}
        <div className="mt-7 max-h-[28rem] space-y-7 overflow-y-auto rounded-[var(--radius-soft)] border border-outline-ghost/10 bg-[rgb(var(--surface)/0.5)] px-5 py-6 sm:px-7">
          {clausulas.map((clausula) => (
            <section key={clausula.numero}>
              <h3 className="font-mono text-[11px] uppercase tracking-[0.16em] text-brand-primary">
                {clausula.numero}. {clausula.titulo}
              </h3>

              {clausula.parrafos.map((parrafo) => (
                <p key={parrafo.slice(0, 40)} className="mt-3 text-sm leading-6 text-text-secondary">
                  {parrafo}
                </p>
              ))}

              {clausula.destacado && (
                <ul className="mt-3 space-y-1.5 border-l border-brand-primary/30 pl-4">
                  {clausula.destacado.split('\n').filter(Boolean).map((linea) => (
                    <li key={linea} className="text-sm leading-6 text-text-primary">{linea}</li>
                  ))}
                </ul>
              )}

              {clausula.excluido && (
                <>
                  <p className="mt-4 text-sm font-medium text-text-secondary">No incluye:</p>
                  <ul className="mt-2 space-y-1.5 border-l border-outline-ghost/20 pl-4">
                    {clausula.excluido.split('\n').filter(Boolean).map((linea) => (
                      <li key={linea} className="text-sm leading-6 text-text-tertiary">{linea}</li>
                    ))}
                  </ul>
                </>
              )}

              {clausula.parrafosFinales?.map((parrafo) => (
                <p key={parrafo.slice(0, 40)} className="mt-3 text-sm leading-6 text-text-secondary">
                  {parrafo}
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>

      <form onSubmit={firmar} className="surface-panel mt-4 border border-brand-primary/25 px-5 py-6 sm:px-8">
        <h3 className="section-title-sm">Firmá</h3>

        <label className="mt-5 block max-w-md">
          <span className="technical-label">Escribí tu nombre completo</span>
          <input
            type="text"
            required
            className="form-field mt-2"
            placeholder={nombreEsperado}
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
          />
          <span className="mt-1.5 block text-xs leading-5 text-text-tertiary">
            Tal como figura en el contrato. Es tu firma.
          </span>
        </label>

        <label className="mt-5 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 shrink-0"
            checked={acepta}
            onChange={(event) => setAcepta(event.target.checked)}
          />
          <span className="text-sm leading-6 text-text-secondary">
            Leí el contrato completo y acepto sus términos. Entiendo que esto equivale a mi firma.
          </span>
        </label>

        {error && <p role="alert" className="mt-4 text-sm leading-6 text-red-400">{error}</p>}

        <button
          type="submit"
          className="button-primary mt-6 gap-2"
          disabled={firmando || !acepta || nombre.trim().length < 3}
        >
          {firmando ? 'Firmando…' : 'Firmar el contrato'}
          {!firmando && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
        </button>

        <p className="mt-3 text-xs leading-5 text-text-tertiary">
          Al firmar se registra la fecha, tu dirección de internet y una huella del texto exacto que
          aceptaste. Te llega la copia por correo.
        </p>
      </form>
    </div>
  );
}
