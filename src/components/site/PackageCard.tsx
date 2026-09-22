'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Check, Minus } from 'lucide-react';

import {
  calificaParaComprar,
  destinoDe,
  paquetePorSlug,
  servicioPorSlug,
  totalPedido,
  type Destino,
  type Extra,
  type Locale,
  type Paquete,
} from '@/content/servicios';

/**
 * Un paquete, con lo que hace falta para decidirlo.
 *
 * Antes de mostrar el precio pregunta lo que define si el cliente entra en el
 * alcance. Si se pasa, el botón deja de vender y ofrece agendar: un cliente
 * fuera de alcance que compra igual es un proyecto que arranca mal y una
 * discusión asegurada. Además, el que se pasa suele ser el lead más valioso.
 */

const copy = {
  es: {
    destacado: 'El que más se elige',
    dias: (n: number) => `Entrega en ${n} días hábiles`,
    porMes: 'por mes',
    aCotizar: 'Se cotiza en la llamada',
    desde: (n: number) => `Desde USD ${n.toLocaleString('es-AR')}`,
    incluye: 'Incluye',
    noIncluye: 'No incluye',
    extras: 'Sumale',
    contratar: 'Contratar y firmar',
    agendar: 'Agendar una llamada',
    nota: 'Firmás online y te llega el mail de pago. Sin llamada previa.',
    faltaResponder: 'Contestá las preguntas para ver si entra en este paquete.',
    pidiendo: 'Preparando…',
    falloPedido: 'No se pudo preparar el contrato. Probá de nuevo en un momento.',
    teConviene: 'Por lo que contestaste, te conviene',
    total: 'Total',
  },
  en: {
    destacado: 'Most chosen',
    dias: (n: number) => `Delivered in ${n} business days`,
    porMes: 'per month',
    aCotizar: 'Quoted on the call',
    desde: (n: number) => `From USD ${n.toLocaleString('en-US')}`,
    incluye: 'Includes',
    noIncluye: 'Not included',
    extras: 'Add on',
    contratar: 'Get it and sign',
    agendar: 'Schedule a call',
    nota: 'Sign online and get the payment email. No call needed.',
    faltaResponder: 'Answer the questions to see if this package fits.',
    pidiendo: 'Preparing…',
    falloPedido: 'Could not prepare the contract. Please try again in a moment.',
    teConviene: 'Based on your answers, a better fit is',
    total: 'Total',
  },
} as const;

/** El texto del destino, para que nadie quede sin próximo paso. */
function nombreDelDestino(destino: Destino, locale: Locale): string | null {
  if (destino.tipo === 'paquete') return paquetePorSlug(destino.slug)?.nombre[locale] ?? null;
  if (destino.tipo === 'servicio') return servicioPorSlug(destino.slug)?.nombre[locale] ?? null;
  return null;
}

export default function PackageCard({
  locale,
  paquete,
  extras,
}: {
  locale: Locale;
  paquete: Paquete;
  extras: Extra[];
}) {
  const labels = copy[locale];
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [elegidos, setElegidos] = useState<string[]>([]);
  const [pidiendo, setPidiendo] = useState(false);
  const [falloPedido, setFalloPedido] = useState(false);

  /**
   * El pedido se registra antes de firmar. Así queda asentado qué eligió
   * aunque después no firme, y el contrato sale por el total real y no por el
   * precio de lista del paquete.
   */
  async function contratar() {
    setPidiendo(true);
    setFalloPedido(false);

    try {
      const res = await fetch('/api/pedido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Las respuestas viajan con el pedido: son lo que el cliente ya
        // contestó y lo que después evita volver a preguntárselo.
        body: JSON.stringify({ paquete: paquete.slug, extras: elegidos, locale, calificacion: respuestas }),
      });
      const body = (await res.json()) as { url?: string };

      if (!res.ok || !body.url) {
        setFalloPedido(true);
        setPidiendo(false);
        return;
      }
      window.location.href = body.url;
    } catch {
      setFalloPedido(true);
      setPidiendo(false);
    }
  }

  const pedido = useMemo(() => totalPedido(paquete, elegidos, extras), [paquete, elegidos, extras]);

  const aCotizar = paquete.precioUsd === null;
  const califica = !aCotizar && calificaParaComprar(paquete, respuestas);
  const destino = destinoDe(paquete, respuestas);
  const contestoTodo = paquete.calificacion.every((q) => respuestas[q.id]);
  // Con una respuesta fuera de alcance no se vende: se deriva.
  const vende = !aCotizar && !destino;

  const agendarHref = `/${locale}/services/agendar?paquete=${paquete.slug}`;

  const precio = aCotizar
    ? paquete.desdeUsd
      ? labels.desde(paquete.desdeUsd)
      : labels.aCotizar
    : `USD ${(pedido.totalUsd ?? pedido.recurrenteUsd).toLocaleString(locale === 'es' ? 'es-AR' : 'en-US')}`;

  return (
    <article
      className={`surface-panel flex h-full flex-col border px-5 py-6 sm:px-6 ${
        paquete.destacado
          ? 'border-brand-primary/35 bg-brand-primary/[0.04]'
          : 'border-outline-ghost/10'
      }`}
    >
      {paquete.destacado && (
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-brand-primary">
          {labels.destacado}
        </p>
      )}

      <h3 className="mt-2 text-xl font-medium tracking-tight text-text-primary">
        {paquete.nombre[locale]}
      </h3>
      <p className="mt-2 text-sm leading-6 text-text-secondary">{paquete.resumen[locale]}</p>

      <div className="mt-5 border-y border-outline-ghost/10 py-4">
        <p className="font-mono text-2xl font-semibold text-text-primary sm:text-3xl">
          {precio}
          {paquete.recurrente && (
            <span className="ml-2 font-sans text-sm font-normal text-text-tertiary">
              {labels.porMes}
            </span>
          )}
        </p>
        {paquete.plazoDias > 0 && (
          <p className="mt-1 text-sm text-text-tertiary">{labels.dias(paquete.plazoDias)}</p>
        )}
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-tertiary">
            {labels.incluye}
          </p>
          <ul className="mt-2 space-y-1.5">
            {paquete.incluye[locale].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm leading-6 text-text-secondary">
                <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-brand-primary" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {paquete.noIncluye[locale].length > 0 && (
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-tertiary">
              {labels.noIncluye}
            </p>
            <ul className="mt-2 space-y-1.5">
              {paquete.noIncluye[locale].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm leading-6 text-text-tertiary">
                  <Minus className="mt-1.5 h-3 w-3 shrink-0" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {extras.length > 0 && (
        <fieldset className="mt-6 border-t border-outline-ghost/10 pt-4">
          <legend className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-tertiary">
            {labels.extras}
          </legend>
          <div className="mt-3 space-y-2">
            {extras.slice(0, 6).map((extra) => (
              <label
                key={extra.id}
                className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-text-secondary"
              >
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 shrink-0"
                  checked={elegidos.includes(extra.id)}
                  onChange={(event) =>
                    setElegidos((actuales) =>
                      event.target.checked
                        ? [...actuales, extra.id]
                        : actuales.filter((id) => id !== extra.id),
                    )
                  }
                />
                <span>
                  {extra.label[locale]}
                  <span className="ml-2 font-mono text-xs text-brand-primary">
                    +{extra.precioUsd}
                    {extra.recurrente ? `/${locale === 'es' ? 'mes' : 'mo'}` : ''}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {paquete.calificacion.length > 0 && (
        <div className="mt-6 space-y-4 border-t border-outline-ghost/10 pt-4">
          {paquete.calificacion.map((pregunta) => (
            <fieldset key={pregunta.id}>
              <legend className="text-sm font-medium text-text-primary">
                {pregunta.texto[locale]}
              </legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {pregunta.opciones.map((opcion) => {
                  const marcada = respuestas[pregunta.id] === opcion.valor;
                  return (
                    <label
                      key={opcion.valor}
                      className={`cursor-pointer rounded-pill border px-3 py-1.5 text-sm transition-colors ${
                        marcada
                          ? 'border-brand-primary/50 bg-brand-primary/10 text-text-primary'
                          : 'border-outline-ghost/15 text-text-secondary hover:border-outline-ghost/30'
                      }`}
                    >
                      <input
                        type="radio"
                        className="sr-only"
                        name={`${paquete.slug}-${pregunta.id}`}
                        value={opcion.valor}
                        checked={marcada}
                        onChange={() =>
                          setRespuestas((actuales) => ({ ...actuales, [pregunta.id]: opcion.valor }))
                        }
                      />
                      {opcion.label[locale]}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
      )}

      <div className="mt-6 border-t border-outline-ghost/10 pt-5">
        {vende ? (
          <>
            <button
              type="button"
              className="button-primary w-full gap-2"
              disabled={!califica || pidiendo}
              onClick={contratar}
            >
              {pidiendo ? labels.pidiendo : labels.contratar}
              {!pidiendo && <ArrowUpRight className="h-4 w-4" aria-hidden="true" />}
            </button>
            {falloPedido && (
              <p role="alert" className="mt-2 text-xs leading-5 text-red-400">
                {labels.falloPedido}
              </p>
            )}
            {!contestoTodo && paquete.calificacion.length > 0 && (
              <p className="mt-2 text-xs leading-5 text-text-tertiary">{labels.faltaResponder}</p>
            )}
            {califica && (
              <p className="mt-2 text-xs leading-5 text-text-tertiary">{labels.nota}</p>
            )}
          </>
        ) : (
          <>
            <Link href={agendarHref} className="button-secondary w-full">
              {labels.agendar}
            </Link>
            {destino && nombreDelDestino(destino, locale) && (
              <p className="mt-2 text-xs leading-5 text-text-tertiary">
                {labels.teConviene}{' '}
                <span className="text-text-secondary">{nombreDelDestino(destino, locale)}</span>.
              </p>
            )}
          </>
        )}
      </div>
    </article>
  );
}
