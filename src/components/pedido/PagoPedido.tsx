'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Copy, Landmark, Paperclip, Wallet, X } from 'lucide-react';

import { MAX_COMPROBANTE, TIPOS_COMPROBANTE } from '@/lib/leads/comprobante';

/**
 * El pago, en la misma página donde firmó.
 *
 * Antes los datos para pagar vivían solo en un correo: si el cliente lo
 * borraba o le caía en spam, se quedaba sin saber cómo pagarte.
 *
 * El botón no confirma el cobro, lo informa. La plata la confirma Silvano
 * cuando la ve en la cuenta — y desde que el aviso puede viajar con el
 * comprobante, confirmarla dejó de ser buscar un movimiento a ciegas en el
 * banco.
 *
 * Los medios de pago van plegados: el que transfiere no tiene por qué leer lo
 * de Mercado Pago, y al revés igual.
 */

const ACEPTA = [...TIPOS_COMPROBANTE].join(',');

/** Cada cuánto pregunta si el pago ya se confirmó, mientras espera. */
const CADA = 15_000;

function Medio({
  titulo, descripcion, icono, abierto, onAbrir, children, deshabilitado,
}: {
  titulo: string;
  descripcion: string;
  icono: React.ReactNode;
  abierto: boolean;
  onAbrir: () => void;
  children?: React.ReactNode;
  deshabilitado?: string;
}) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-soft)] border border-outline-ghost/10">
      <button
        type="button"
        onClick={onAbrir}
        disabled={Boolean(deshabilitado)}
        aria-expanded={abierto}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-[rgb(var(--surface)/0.6)] disabled:cursor-not-allowed disabled:opacity-55"
      >
        <span className="shrink-0 text-brand-primary" aria-hidden="true">{icono}</span>
        <span className="flex-1">
          <span className="block text-sm font-medium text-text-primary">{titulo}</span>
          <span className="block text-xs leading-5 text-text-tertiary">
            {deshabilitado ?? descripcion}
          </span>
        </span>
        {!deshabilitado && (
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-text-tertiary transition-transform ${abierto ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        )}
      </button>

      {abierto && !deshabilitado && (
        <div className="border-t border-outline-ghost/10 px-5 py-5">{children}</div>
      )}
    </div>
  );
}

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
  const [abierto, setAbierto] = useState<'transferencia' | null>(yaInformado ? null : 'transferencia');
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [error, setError] = useState('');
  const archivoRef = useRef<HTMLInputElement>(null);

  /**
   * Mientras espera la confirmación, pregunta sola si el pago ya entró.
   *
   * Silvano lo aprueba desde el panel o desde el teléfono y esta pantalla se
   * queda vieja: el cliente miraba «recibí tu aviso» hasta que recargaba a
   * mano, si se le ocurría. Se corta apenas el paso cambia.
   */
  useEffect(() => {
    if (!informado) return;

    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/pedido/${pedidoId}/estado`);
        if (!res.ok) return;
        const { paso } = await res.json() as { paso: string };
        if (paso !== 'pagar') window.location.reload();
      } catch {
        // Sin conexión no pasa nada: se vuelve a intentar en el próximo tic.
      }
    }, CADA);

    return () => clearInterval(id);
  }, [informado, pedidoId]);

  function elegir(event: React.ChangeEvent<HTMLInputElement>) {
    const archivo = event.target.files?.[0] ?? null;
    setError('');

    if (archivo && archivo.size > MAX_COMPROBANTE) {
      setError('El comprobante supera los 8 MB. Mandá una captura o el PDF del banco.');
      return;
    }
    setComprobante(archivo);
  }

  async function avisar() {
    setEnviando(true);
    setError('');

    try {
      const cuerpo = new FormData();
      if (comprobante) cuerpo.set('comprobante', comprobante);

      const res = await fetch(`/api/pedido/${pedidoId}/pago`, {
        method: 'POST',
        ...(comprobante ? { body: cuerpo } : {}),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        setError(body.error ?? 'No se pudo registrar el aviso. Probá de nuevo en un momento.');
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
        <p className="mt-4 text-sm leading-6 text-text-tertiary">
          No hace falta que recargues: esta página avanza sola cuando confirmo el pago.
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
        {montoLocal && <p className="mt-1 font-mono text-lg text-brand-primary">= {montoLocal}</p>}
        {notaCotizacion && (
          <p className="mt-3 text-xs leading-5 text-text-tertiary">{notaCotizacion}</p>
        )}
      </div>

      <p className="technical-label mt-6">Cómo querés pagar</p>

      <div className="mt-3 space-y-3">
        <Medio
          titulo="Transferencia bancaria"
          descripcion="Transferís desde tu banco y me pasás el comprobante."
          icono={<Landmark className="h-4 w-4" />}
          abierto={abierto === 'transferencia'}
          onAbrir={() => setAbierto(abierto === 'transferencia' ? null : 'transferencia')}
        >
          <div className="rounded-[var(--radius-soft)] border border-outline-ghost/10 bg-[rgb(var(--surface)/0.5)] px-4 py-3">
            <div className="flex items-start justify-between gap-4">
              <p className="technical-label">Datos para transferir</p>
              <button
                type="button"
                onClick={copiar}
                className="inline-flex shrink-0 items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-text-tertiary transition-colors hover:text-text-primary"
              >
                {copiado
                  ? <Check className="h-3 w-3" aria-hidden="true" />
                  : <Copy className="h-3 w-3" aria-hidden="true" />}
                {copiado ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <p className="mt-3 whitespace-pre-wrap break-words font-mono text-sm leading-7 text-text-primary">
              {instrucciones}
            </p>
          </div>

          {/* El comprobante es lo que convierte el aviso en algo verificable.
              No es obligatorio: el que ya transfirió y no lo encuentra no
              puede quedar trabado acá. */}
          <div className="mt-5">
            <p className="technical-label">Tu comprobante</p>

            <input
              ref={archivoRef}
              type="file"
              accept={ACEPTA}
              className="sr-only"
              aria-label="Adjuntar el comprobante de la transferencia"
              onChange={elegir}
            />

            {comprobante ? (
              <div className="mt-2 flex items-center gap-3 rounded-[var(--radius-soft)] border border-brand-primary/30 bg-brand-primary/[0.04] px-4 py-3">
                <Check className="h-4 w-4 shrink-0 text-brand-primary" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate text-sm text-text-primary">
                  {comprobante.name}
                </span>
                <button
                  type="button"
                  aria-label="Quitar el comprobante"
                  onClick={() => {
                    setComprobante(null);
                    if (archivoRef.current) archivoRef.current.value = '';
                  }}
                  className="shrink-0 text-text-tertiary transition-colors hover:text-text-primary"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => archivoRef.current?.click()}
                className="mt-2 inline-flex items-center gap-2 rounded-[var(--radius-soft)] border border-dashed border-outline-ghost/25 px-4 py-3 text-sm text-text-secondary transition-colors hover:border-brand-primary/40 hover:text-text-primary"
              >
                <Paperclip className="h-4 w-4 shrink-0" aria-hidden="true" />
                Adjuntar el comprobante
              </button>
            )}

            <p className="mt-2 text-xs leading-5 text-text-tertiary">
              La captura o el PDF del banco. Con eso confirmo el pago mucho más rápido.
            </p>
          </div>

          {error && <p role="alert" className="mt-4 text-sm leading-6 text-red-400">{error}</p>}

          <button type="button" onClick={avisar} disabled={enviando} className="button-primary mt-5">
            {enviando ? 'Enviando…' : comprobante ? 'Enviar el comprobante' : 'Ya transferí'}
          </button>

          <p className="mt-3 text-xs leading-5 text-text-tertiary">
            Lo verifico y te mando la factura. Si no tenés el comprobante a mano, avisá igual.
          </p>
        </Medio>

        <Medio
          titulo="Mercado Pago"
          descripcion="Tarjeta, débito o dinero en cuenta."
          icono={<Wallet className="h-4 w-4" />}
          abierto={false}
          onAbrir={() => undefined}
          deshabilitado="Todavía no está disponible. Por ahora, transferencia."
        />
      </div>
    </div>
  );
}
