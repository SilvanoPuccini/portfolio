'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

/**
 * El pago, en la misma página donde firmó.
 *
 * Antes los datos para pagar vivían solo en un correo: si el cliente lo
 * borraba o le caía en spam, se quedaba sin saber cómo pagarte. Ahora vuelve
 * al mismo link de siempre y los tiene.
 *
 * El botón no confirma el cobro, lo informa. La plata la confirma Silvano
 * cuando la ve en la cuenta.
 */

export function PagoPedido({
  pedidoId,
  montoUsd,
  montoLocal,
  notaCotizacion,
  instrucciones,
  yaInformado,
}: {
  pedidoId: string;
  montoUsd: string;
  montoLocal?: string | null;
  notaCotizacion?: string | null;
  instrucciones: string;
  yaInformado: boolean;
}) {
  const [informado, setInformado] = useState(yaInformado);
  const [enviando, setEnviando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [error, setError] = useState('');

  async function avisar() {
    setEnviando(true);
    setError('');
    try {
      const res = await fetch(`/api/pedido/${pedidoId}/pago`, { method: 'POST' });
      if (!res.ok) {
        setError('No se pudo registrar el aviso. Probá de nuevo en un momento.');
        return;
      }
      setInformado(true);
    } catch {
      setError('Se cortó la conexión. Probá de nuevo.');
    } finally {
      setEnviando(false);
    }
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(instrucciones);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // Sin portapapeles el texto está a la vista igual: no hace falta avisar.
    }
  }

  if (informado) {
    return (
      <div className="surface-panel border border-brand-primary/25 px-6 py-8">
        <h2 className="section-title-sm">Recibí tu aviso</h2>
        <p className="mt-3 max-w-xl text-base leading-7 text-text-secondary">
          Apenas vea la transferencia acreditada te mando la factura y arrancamos. Suele tardar
          unas horas; si es fin de semana, el lunes.
        </p>
      </div>
    );
  }

  return (
    <div className="surface-panel border border-outline-ghost/10 px-5 py-6 sm:px-8 sm:py-8">
      <h2 className="section-title-sm">Último paso: el pago</h2>
      <p className="mt-3 text-sm leading-6 text-text-secondary">
        Con el contrato firmado, esto es lo único que falta para arrancar.
      </p>

      <div className="mt-6 rounded-[var(--radius-soft)] border border-brand-primary/25 bg-brand-primary/[0.04] px-5 py-5">
        <p className="technical-label">A abonar ahora</p>
        <p className="mt-1 font-mono text-3xl font-semibold text-text-primary">{montoUsd}</p>
        {montoLocal && (
          <p className="mt-1 font-mono text-lg text-brand-primary">= {montoLocal}</p>
        )}
        {notaCotizacion && (
          <p className="mt-3 text-xs leading-5 text-text-tertiary">{notaCotizacion}</p>
        )}
      </div>

      <div className="mt-5 rounded-[var(--radius-soft)] border border-outline-ghost/10 bg-[rgb(var(--surface)/0.5)] px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <p className="technical-label">Datos para transferir</p>
          <button
            type="button"
            onClick={copiar}
            className="inline-flex shrink-0 items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-text-tertiary transition-colors hover:text-text-primary"
          >
            {copiado ? <Check className="h-3 w-3" aria-hidden="true" /> : <Copy className="h-3 w-3" aria-hidden="true" />}
            {copiado ? 'Copiado' : 'Copiar'}
          </button>
        </div>
        <p className="mt-3 whitespace-pre-wrap break-words font-mono text-sm leading-7 text-text-primary">
          {instrucciones}
        </p>
      </div>

      {error && <p role="alert" className="mt-4 text-sm leading-6 text-red-400">{error}</p>}

      <button type="button" onClick={avisar} disabled={enviando} className="button-primary mt-6">
        {enviando ? 'Avisando…' : 'Ya transferí'}
      </button>

      <p className="mt-3 text-xs leading-5 text-text-tertiary">
        Tocá ese botón cuando hayas transferido. Lo verifico y te mando la factura.
      </p>
    </div>
  );
}
