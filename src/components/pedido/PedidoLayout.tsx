import { Check } from 'lucide-react';

import Reveal, { RevealGroup } from '@/components/site/Reveal';
import { PASOS, type PasoPedido } from '@/lib/leads/pedido-pasos';
import { money } from '@/lib/leads/cargar-pedido';
import { plazoDelPedido, type Locale, type Paquete, type Pedido } from '@/content/servicios';

/**
 * El marco de la compra: dónde está parado y qué está comprando.
 *
 * Los cuatro pasos comparten esto a propósito. Lo que más desorienta al que
 * compra algo que todavía no puede ver es no saber cuánto falta ni si lo que
 * va a pagar sigue siendo lo que eligió: el detalle queda al costado todo el
 * tiempo, y arriba la cuenta de pasos.
 */

const copy = {
  es: {
    incluye: 'Qué incluye',
    sumaste: 'Le sumaste',
    total: 'Total',
    porMes: 'Además, por mes',
    entrega: (dias: number) => `Entrega en hasta ${dias} días hábiles, desde el pago y tu material`,
    garantia: 'Una ronda de ajustes y 30 días de garantía después de la entrega.',
    paso: (numero: number, total: number) => `Paso ${numero} de ${total}`,
  },
  en: {
    incluye: 'What it includes',
    sumaste: 'You added',
    total: 'Total',
    porMes: 'Plus, per month',
    entrega: (dias: number) => `Delivered within ${dias} business days of payment and your material`,
    garantia: 'One round of changes and a 30-day warranty after delivery.',
    paso: (numero: number, total: number) => `Step ${numero} of ${total}`,
  },
} as const;

/** La cuenta de pasos. Lo hecho se tilda, lo que falta queda tenue. */
function Pasos({ actual, etiqueta }: { actual: PasoPedido; etiqueta: string }) {
  const indice = PASOS.findIndex((p) => p.paso === actual);

  return (
    <ol aria-label={etiqueta} className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2">
      {PASOS.map((p, i) => {
        const hecho = i < indice;
        const aqui = i === indice;

        return (
          <li key={p.paso} className="flex items-center gap-3">
            <span
              className={[
                'flex items-center gap-2 text-sm leading-6',
                aqui ? 'text-text-primary' : hecho ? 'text-text-secondary' : 'text-text-tertiary',
              ].join(' ')}
              aria-current={aqui ? 'step' : undefined}
            >
              <span
                className={[
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px]',
                  aqui
                    ? 'bg-brand-primary text-surface-base'
                    : hecho
                      ? 'border border-brand-primary/40 text-brand-primary'
                      : 'border border-outline-ghost/20 text-text-tertiary',
                ].join(' ')}
              >
                {hecho ? <Check className="h-3 w-3" aria-hidden="true" /> : i + 1}
              </span>
              {p.titulo}
            </span>

            {i < PASOS.length - 1 && (
              <span aria-hidden className="hidden h-px w-6 bg-outline-ghost/20 sm:block" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function PedidoLayout({
  paquete, resumen, totalUsd, mensualUsd, locale, paso, titulo, children,
}: {
  paquete: Paquete;
  resumen: Pedido;
  totalUsd: number;
  mensualUsd: number;
  locale: Locale;
  paso: PasoPedido;
  /** Qué se hace en este paso. El nombre del paquete queda de subtítulo. */
  titulo: string;
  children: React.ReactNode;
}) {
  const labels = copy[locale];
  const indice = PASOS.findIndex((p) => p.paso === paso);

  return (
    <main className="site-container py-14 sm:py-20">
      <Reveal>
        <p className="technical-label">{labels.paso(indice + 1, PASOS.length)}</p>
      </Reveal>
      <Reveal>
        <h1 className="mt-3 text-3xl font-medium text-text-primary sm:text-4xl">{titulo}</h1>
      </Reveal>
      <Reveal>
        <p className="mt-3 max-w-2xl text-base leading-7 text-text-secondary">
          {paquete.nombre[locale]} · {paquete.resumen[locale]}
        </p>
      </Reveal>

      <Reveal as="div">
        <Pasos actual={paso} etiqueta={labels.paso(indice + 1, PASOS.length)} />
      </Reveal>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start">
        <div>{children}</div>

        <Reveal as="div" className="surface-panel border border-outline-ghost/10 px-5 py-6 sm:px-6">
          <p className="technical-label">{labels.incluye}</p>
          <ul className="mt-4 space-y-2">
            {paquete.incluye[locale].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm leading-6 text-text-secondary">
                <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-brand-primary" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          {resumen.extras.length > 0 && (
            <>
              <p className="technical-label mt-6">{labels.sumaste}</p>
              <RevealGroup className="mt-3 space-y-2">
                {resumen.extras.map((extra) => (
                  <div key={extra.id} className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-text-secondary">{extra.label[locale]}</span>
                    <span className="font-mono text-text-tertiary">{money(extra.precioUsd, locale)}</span>
                  </div>
                ))}
              </RevealGroup>
            </>
          )}

          <div className="mt-6 border-t border-outline-ghost/10 pt-5">
            <p className="technical-label">{labels.total}</p>
            <p className="mt-1 font-mono text-3xl font-semibold text-text-primary">
              {money(totalUsd, locale)}
            </p>
            {mensualUsd > 0 && (
              <p className="mt-2 text-sm text-text-tertiary">
                {labels.porMes}: {money(mensualUsd, locale)}
              </p>
            )}
            {/* Con los días de cada extra: es el mismo número que firma. */}
            {paquete.plazoDias > 0 && (
              <p className="mt-3 text-sm leading-6 text-text-tertiary">
                {labels.entrega(plazoDelPedido(paquete, resumen.extras))}
              </p>
            )}
            <p className="mt-2 text-sm leading-6 text-text-tertiary">{labels.garantia}</p>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
