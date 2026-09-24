import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { Download } from 'lucide-react';

import { PagoPedido } from '@/components/pedido/PagoPedido';
import { PedidoLayout } from '@/components/pedido/PedidoLayout';
import { cargarPedidoCompleto, money } from '@/lib/leads/cargar-pedido';
import { paymentInstructionsFor } from '@/lib/leads/payment-instructions';
import { quoteFor } from '@/lib/leads/exchange-rate';
import { redirigirA } from '@/lib/leads/pedido-pasos';
import { resolveLocale } from '@/lib/i18n';
import type { Locale } from '@/content/servicios';

/**
 * Paso 3: el pago.
 *
 * Acá aparece el contrato firmado para descargar. Es el primer momento en que
 * existe, y es justo cuando el cliente está por mandar plata: poder abrir lo
 * que firmó antes de transferir es lo mínimo.
 */

export const dynamic = 'force-dynamic';

type Params = Promise<{ locale: string; id: string }>;

export const metadata: Metadata = {
  title: 'Pagá tu pedido | Silvano Puccini',
  robots: { index: false, follow: false },
};

const copy = {
  es: {
    titulo: 'El pago',
    contrato: 'Ver el contrato que firmaste',
    nota: 'Cotización {fuente} + 3%, redondeada. Si pasan más de 72 horas, pedime el monto actualizado.',
  },
  en: {
    titulo: 'Payment',
    contrato: 'View the contract you signed',
    nota: 'Rate from {fuente} + 3%, rounded. After 72 hours, ask me for an updated amount.',
  },
} as const;

export default async function PagarPage({ params }: { params: Params }) {
  const { locale, id } = await params;
  const currentLocale = resolveLocale(locale) as Locale;
  const labels = copy[currentLocale];

  const datos = await cargarPedidoCompleto(id);
  if (!datos) notFound();

  const destino = redirigirA(datos.etapa, 'pagar', currentLocale, id);
  if (destino) redirect(destino);

  const { lead, paquete, pedido, resumen, etapa } = datos;

  // Solo cuando de verdad toca pagar: es una llamada a una API externa y al
  // que ya avisó que transfirió no le cambia nada.
  const cotizacion = etapa === 'pago' ? await quoteFor(lead?.pais ?? null, pedido.total_usd) : null;

  return (
    <PedidoLayout
      paquete={paquete}
      resumen={resumen}
      totalUsd={pedido.total_usd}
      mensualUsd={pedido.mensual_usd}
      esperaDias={datos.espera}
      locale={currentLocale}
      paso="pagar"
      titulo={labels.titulo}
    >
      <PagoPedido
        pedidoId={pedido.id}
        montoUsd={money(pedido.total_usd, currentLocale)}
        montoLocal={cotizacion
          ? `${cotizacion.currency} ${cotizacion.amount.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`
          : null}
        notaCotizacion={cotizacion ? labels.nota.replace('{fuente}', cotizacion.source) : null}
        instrucciones={paymentInstructionsFor(lead?.pais ?? null)}
        yaInformado={etapa === 'esperando'}
      />

      <p className="mt-5 text-sm leading-6 text-text-tertiary">
        <a
          href={`/api/pedido/${pedido.id}/contrato-firmado`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-text-secondary underline decoration-outline-ghost/30 underline-offset-4 transition-colors hover:text-text-primary"
        >
          <Download className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {labels.contrato}
        </a>
      </p>
    </PedidoLayout>
  );
}
