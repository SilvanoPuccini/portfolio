'use client';

import { carePrice, policyForPackage, policyParagraphs } from '@/content/service-policy';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Check, Minus } from 'lucide-react';

import {
  destinoDe,
  extrasParaNuevoPedido,
  paquetePorSlug,
  rangoComoTexto,
  rangoDelPedido,
  servicioPorSlug,
  totalPedido,
  type Destino,
  type Extra,
  type Locale,
  type Paquete,
} from '@/content/servicios';
import { resolveCurrentOrder } from '@/lib/order-config';

export type PackageConfiguration = { calificacion: Record<string, string>; extras: string[] };

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
    destacado: 'Recomendado',
    dias: (rango: string) => `Entrega en ${rango} días hábiles`,
    porMes: 'por mes',
    pagoInicial: 'Pago inicial',
    confirmarMensual: 'La activación y el primer cobro deben confirmarse antes de contratar.',
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
    destacado: 'Recommended',
    dias: (rango: string) => `Delivered in ${rango} business days`,
    porMes: 'per month',
    pagoInicial: 'Initial payment',
    confirmarMensual: 'Activation and the first payment must be confirmed before purchase.',
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
  configuration,
  onConfigurationChange,
  compact = false,
}: {
  locale: Locale;
  paquete: Paquete;
  extras: Extra[];
  configuration?: PackageConfiguration;
  onConfigurationChange?: (next: PackageConfiguration) => void;
  compact?: boolean;
}) {
  const labels = copy[locale];
  const carePlan = policyForPackage(paquete.slug);
  const [localAnswers, setLocalAnswers] = useState<Record<string, string>>({});
  const [localExtras, setLocalExtras] = useState<string[]>([]);
  const respuestas = configuration?.calificacion ?? localAnswers;
  const elegidos = configuration?.extras ?? localExtras;
  const changeConfiguration = (next: PackageConfiguration) => {
    if (onConfigurationChange) onConfigurationChange(next);
    else { setLocalAnswers(next.calificacion); setLocalExtras(next.extras); }
  };
  const seleccionados = useMemo(() => extrasParaNuevoPedido(elegidos, extras), [elegidos, extras]);
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
        body: JSON.stringify({ paquete: paquete.slug, extras: seleccionados, locale, calificacion: respuestas }),
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

  const pedido = useMemo(() => totalPedido(paquete, seleccionados, extras), [paquete, seleccionados, extras]);

  const aCotizar = paquete.precioUsd === null;
  const califica = !aCotizar && resolveCurrentOrder({ paquete: paquete.slug, extras: seleccionados, calificacion: respuestas }).ok;
  const destino = destinoDe(paquete, respuestas);
  const contestoTodo = paquete.calificacion.every((q) => respuestas[q.id]);
  // Con una respuesta fuera de alcance no se vende: se deriva.
  const vende = !aCotizar && !destino && !paquete.recurrente;

  const agendarHref = `/${locale}/services/agendar?service=${paquete.servicio}&paquete=${paquete.slug}`;

  const precio = paquete.recurrente && carePlan ? carePrice(carePlan, locale) : aCotizar
    ? paquete.desdeUsd
      ? labels.desde(paquete.desdeUsd)
      : labels.aCotizar
    : `USD ${(paquete.recurrente ? pedido.recurrenteUsd : pedido.totalUsd ?? 0).toLocaleString(locale === 'es' ? 'es-AR' : 'en-US')}`;

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
          {paquete.recurrente && !carePlan && (
            <span className="ml-2 font-sans text-sm font-normal text-text-tertiary">
              {labels.porMes}
            </span>
          )}
        </p>
        {!paquete.recurrente && pedido.recurrenteUsd > 0 && (
          <p className="mt-1 text-sm text-text-secondary">
            USD {pedido.recurrenteUsd.toLocaleString(locale === 'es' ? 'es-AR' : 'en-US')} {labels.porMes}
          </p>
        )}
        {paquete.recurrente && (pedido.totalUsd ?? 0) > 0 && (
          <p className="mt-1 text-sm text-text-secondary">
            {labels.pagoInicial}: USD {pedido.totalUsd!.toLocaleString(locale === 'es' ? 'es-AR' : 'en-US')}
          </p>
        )}
        {paquete.plazoDias > 0 && (
          <p className="mt-1 text-sm text-text-tertiary">{labels.dias(rangoComoTexto(rangoDelPedido(paquete, []), locale))}</p>
        )}
      </div>

      {!compact && carePlan && <div className="mt-4 space-y-3 text-base leading-7 text-text-secondary" aria-label={locale === 'es' ? 'Precio y costos de continuidad' : 'Price and ongoing costs'}>
        <p>{policyParagraphs(carePlan, locale)[0]}</p>
        <p>{locale === 'es' ? 'Hosting inicial y garantía por defectos: 30 días desde la entrega. Después: plan pago con aceptación expresa y fecha acordada, o transferencia planificada. Sin cobros automáticos.' : 'Initial hosting and defect warranty: 30 days from delivery. Afterward: a paid plan with explicit acceptance and an agreed start date, or a planned transfer. No automatic billing.'}</p>
        <p>{policyParagraphs(carePlan, locale)[2]} {locale === 'es' ? 'Los importes de terceros varían según el proveedor y el consumo; no están incluidos en el desarrollo.' : 'Third-party amounts vary by provider and usage; they are not included in development.'}</p>
        <details className="border-t border-outline-ghost/20 pt-3">
          <summary className="cursor-pointer font-medium text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary">{locale === 'es' ? 'Condiciones de hosting, cuidado y propiedad' : 'Hosting, care and ownership terms'}</summary>
          <div className="mt-3 space-y-3">{policyParagraphs(carePlan, locale).filter((_, i) => i !== 0 && i !== 2).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
        </details>
      </div>}
      {!compact && <div className="mt-5 space-y-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-tertiary">
            {labels.incluye}
          </p>
          <ul className="mt-2 space-y-1.5">
            {(paquete.recurrente && carePlan ? [policyParagraphs(carePlan, locale)[0]] : paquete.incluye[locale]).map((item) => (
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
      </div>}

      {(!compact || paquete.servicio !== 'web') && extras.length > 0 && (
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
                  checked={seleccionados.includes(extra.id)}
                  disabled={extra.obligatorio === true}
                  onChange={(event) => changeConfiguration({ calificacion: respuestas, extras: event.target.checked ? [...elegidos, extra.id] : elegidos.filter((id) => id !== extra.id) })}
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
                      className={`cursor-pointer rounded-pill border px-3 py-1.5 text-sm transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand-primary ${
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
                        onChange={() => changeConfiguration({ calificacion: { ...respuestas, [pregunta.id]: opcion.valor }, extras: elegidos })}
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
              {pidiendo ? labels.pidiendo : compact ? (locale === 'es' ? 'Continuar' : 'Continue') : labels.contratar}
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
              <p className="mt-2 text-xs leading-5 text-text-tertiary">{compact ? (locale === 'es' ? 'Revisá y firmá el contrato antes del pago.' : 'Review and sign the contract before payment.') : labels.nota}</p>
            )}
          </>
        ) : (
          <>
            {paquete.recurrente && <p className="mb-3 text-sm text-text-secondary">{labels.confirmarMensual}</p>}
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
