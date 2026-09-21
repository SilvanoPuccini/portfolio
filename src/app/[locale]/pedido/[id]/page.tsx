import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Check } from 'lucide-react';

import { PedidoCheckout } from '@/components/pedido/PedidoCheckout';
import Reveal, { RevealGroup } from '@/components/site/Reveal';
import { paquetePorSlug, servicioPorSlug, totalPedido, type Locale } from '@/content/servicios';
import { resolveLocale } from '@/lib/i18n';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * Lo que el cliente está comprando, y la firma.
 *
 * Es la pantalla que faltaba. El botón de contratar mandaba a agendar una
 * llamada: justo lo contrario de lo que pidió alguien que eligió un paquete
 * de precio cerrado. Acá ve el detalle de lo que compra, deja tres datos y
 * firma, sin salir de la página.
 */

export const dynamic = 'force-dynamic';

type Params = Promise<{ locale: string; id: string }>;

export const metadata: Metadata = {
  title: 'Tu pedido | Silvano Puccini',
  robots: { index: false, follow: false },
};

async function cargarPedido(id: string) {
  const { data } = await getSupabaseAdmin()
    .from('pedidos')
    .select('id, paquete, extras, total_usd, mensual_usd, firmado_at')
    .eq('id', id)
    .maybeSingle();

  return data as {
    id: string; paquete: string; extras: string[] | null;
    total_usd: number; mensual_usd: number; firmado_at: string | null;
  } | null;
}

const copy = {
  es: {
    eyebrow: 'Tu pedido',
    incluye: 'Qué incluye',
    sumaste: 'Le sumaste',
    total: 'Total',
    porMes: 'Además, por mes',
    entrega: (dias: number) => `Entrega en ${dias} días hábiles desde el pago`,
    firmado: 'Este pedido ya está firmado. Te llegó una copia por mail.',
    garantia: 'Una ronda de ajustes y 30 días de garantía después de la entrega.',
  },
  en: {
    eyebrow: 'Your order',
    incluye: 'What it includes',
    sumaste: 'You added',
    total: 'Total',
    porMes: 'Plus, per month',
    entrega: (dias: number) => `Delivered in ${dias} business days from payment`,
    firmado: 'This order is already signed. A copy was emailed to you.',
    garantia: 'One round of changes and a 30-day warranty after delivery.',
  },
} as const;

export default async function PedidoPage({ params }: { params: Params }) {
  const { locale, id } = await params;
  const currentLocale = resolveLocale(locale) as Locale;
  const labels = copy[currentLocale];

  const pedido = await cargarPedido(id);
  if (!pedido) notFound();

  const paquete = paquetePorSlug(pedido.paquete);
  if (!paquete) notFound();

  const servicio = servicioPorSlug(paquete.servicio);
  const resumen = totalPedido(paquete, pedido.extras ?? [], servicio?.extras ?? []);
  const money = (valor: number) => `USD ${valor.toLocaleString(currentLocale === 'es' ? 'es-AR' : 'en-US')}`;

  return (
    <main className="site-container py-14 sm:py-20">
      <Reveal>
        <p className="technical-label">{labels.eyebrow}</p>
      </Reveal>
      <Reveal>
        <h1 className="mt-3 text-3xl font-medium text-text-primary sm:text-4xl">
          {paquete.nombre[currentLocale]}
        </h1>
      </Reveal>
      <Reveal>
        <p className="mt-3 max-w-2xl text-base leading-7 text-text-secondary">
          {paquete.resumen[currentLocale]}
        </p>
      </Reveal>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start">
        <div>
          {pedido.firmado_at ? (
            <Reveal as="div" className="surface-panel border border-brand-primary/25 px-6 py-8">
              <p className="text-base leading-7 text-text-secondary">{labels.firmado}</p>
            </Reveal>
          ) : (
            <PedidoCheckout pedidoId={pedido.id} />
          )}
        </div>

        <Reveal as="div" className="surface-panel border border-outline-ghost/10 px-5 py-6 sm:px-6">
          <p className="technical-label">{labels.incluye}</p>
          <ul className="mt-4 space-y-2">
            {paquete.incluye[currentLocale].map((item) => (
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
                    <span className="text-text-secondary">{extra.label[currentLocale]}</span>
                    <span className="font-mono text-text-tertiary">{money(extra.precioUsd)}</span>
                  </div>
                ))}
              </RevealGroup>
            </>
          )}

          <div className="mt-6 border-t border-outline-ghost/10 pt-5">
            <p className="technical-label">{labels.total}</p>
            <p className="mt-1 font-mono text-3xl font-semibold text-text-primary">
              {money(pedido.total_usd)}
            </p>
            {pedido.mensual_usd > 0 && (
              <p className="mt-2 text-sm text-text-tertiary">
                {labels.porMes}: {money(pedido.mensual_usd)}
              </p>
            )}
            {paquete.plazoDias > 0 && (
              <p className="mt-3 text-sm leading-6 text-text-tertiary">
                {labels.entrega(paquete.plazoDias)}
              </p>
            )}
            <p className="mt-2 text-sm leading-6 text-text-tertiary">{labels.garantia}</p>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
