import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Check, Download } from 'lucide-react';

import { PagoPedido } from '@/components/pedido/PagoPedido';
import { FirmaContrato } from '@/components/pedido/FirmaContrato';
import { PedidoCheckout } from '@/components/pedido/PedidoCheckout';
import { clausulasDelContrato, contratoDeVenta } from '@/content/contrato';
import { jurisdiccionCorta } from '@/lib/leads/legal-clause';
import { ContractStep } from '@/components/propuesta/ContractStep';
import Reveal, { RevealGroup } from '@/components/site/Reveal';
import { paquetePorSlug, servicioPorSlug, totalPedido, type Locale } from '@/content/servicios';
import { etapaDelPedido } from '@/lib/leads/etapa-pedido';
import { quoteFor } from '@/lib/leads/exchange-rate';
import { paymentInstructionsFor } from '@/lib/leads/payment-instructions';
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

interface PedidoRow {
  id: string;
  paquete: string;
  extras: string[] | null;
  total_usd: number;
  mensual_usd: number;
  firmado_at: string | null;
  lead_id: string | null;
}

interface LeadRow {
  nombre: string;
  email: string;
  localidad: string | null;
  estado: string | null;
  pais: string | null;
  pago_estado: string | null;
  factura_numero: string | null;
  contrato_firma_token: string | null;
  contrato_signing_url: string | null;
  contrato_firmado_at: string | null;
}

/** El pedido y su venta: juntos deciden qué ve el cliente al volver. */
async function cargarPedido(id: string) {
  const db = getSupabaseAdmin();

  const { data } = await db
    .from('pedidos')
    .select('id, paquete, extras, total_usd, mensual_usd, firmado_at, lead_id')
    .eq('id', id)
    .maybeSingle();

  const pedido = data as PedidoRow | null;
  if (!pedido) return { pedido: null, lead: null };

  if (!pedido.lead_id) return { pedido, lead: null };

  const { data: venta } = await db
    .from('leads')
    .select('nombre, email, localidad, estado, pais, pago_estado, factura_numero, contrato_firma_token, contrato_signing_url, contrato_firmado_at')
    .eq('id', pedido.lead_id)
    .maybeSingle();

  return { pedido, lead: (venta as LeadRow | null) ?? null };
}

const copy = {
  es: {
    eyebrow: 'Tu pedido',
    incluye: 'Qué incluye',
    sumaste: 'Le sumaste',
    total: 'Total',
    porMes: 'Además, por mes',
    entrega: (dias: number) => `Entrega en ${dias} días hábiles desde el pago`,
    firmado: 'Pago confirmado',
    arrancamos: 'Ya está todo listo. El último paso es cargar el material de tu proyecto: el logo, las fotos y los textos que tengas.',
    factura: 'Factura',
    facturaPendiente: 'Te mando la factura apenas la emita.',
    cargarDatos: 'Cargar los datos del proyecto',
    descargarContrato: 'Descargar el contrato firmado',
    garantia: 'Una ronda de ajustes y 30 días de garantía después de la entrega.',
  },
  en: {
    eyebrow: 'Your order',
    incluye: 'What it includes',
    sumaste: 'You added',
    total: 'Total',
    porMes: 'Plus, per month',
    entrega: (dias: number) => `Delivered in ${dias} business days from payment`,
    firmado: 'Payment confirmed',
    arrancamos: 'Everything is set. The last step is uploading your project material: logo, photos and any copy you have.',
    factura: 'Invoice',
    facturaPendiente: 'I will send the invoice as soon as it is issued.',
    cargarDatos: 'Upload the project details',
    descargarContrato: 'Download the signed contract',
    garantia: 'One round of changes and a 30-day warranty after delivery.',
  },
} as const;

export default async function PedidoPage({ params }: { params: Params }) {
  const { locale, id } = await params;
  const currentLocale = resolveLocale(locale) as Locale;
  const labels = copy[currentLocale];

  const { pedido, lead } = await cargarPedido(id);
  if (!pedido) notFound();

  const paquete = paquetePorSlug(pedido.paquete);
  if (!paquete) notFound();

  const servicio = servicioPorSlug(paquete.servicio);
  const resumen = totalPedido(paquete, pedido.extras ?? [], servicio?.extras ?? []);
  const money = (valor: number) => `USD ${valor.toLocaleString(currentLocale === 'es' ? 'es-AR' : 'en-US')}`;

  const etapa = etapaDelPedido(pedido, lead
    ? {
      estado: lead.estado,
      contrato_firmado_at: lead.contrato_firmado_at,
      pago_estado: lead.pago_estado,
    }
    : null);

  // La cotización solo se pide cuando de verdad toca pagar: es una llamada a
  // una API externa y no tiene sentido hacerla en las otras etapas.
  const cotizacion = etapa === 'pago' ? await quoteFor(lead?.pais ?? null, pedido.total_usd) : null;

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
          {etapa === 'datos' && (
            <PedidoCheckout
              pedidoId={pedido.id}
              paquete={paquete}
              extras={resumen.extras}
              totalUsd={pedido.total_usd}
            />
          )}

          {/* Volvió sin haber firmado: el contrato lo espera igual. */}
          {etapa === 'firma' && (
            lead?.contrato_firma_token
              ? <ContractStep
                  token={lead.contrato_firma_token}
                  signingUrl={lead.contrato_signing_url}
                />
              : <FirmaContrato
                  pedidoId={pedido.id}
                  nombreEsperado={lead?.nombre ?? ''}
                  email={lead?.email}
                  clausulas={clausulasDelContrato(contratoDeVenta({
                    paquete,
                    extras: resumen.extras,
                    cliente: {
                      nombre: lead?.nombre ?? '',
                      localidad: lead?.localidad,
                      pais: lead?.pais,
                    },
                    totalUsd: pedido.total_usd,
                    jurisdiccion: jurisdiccionCorta(lead?.pais ?? null),
                  }))}
                />
          )}

          {(etapa === 'pago' || etapa === 'esperando') && (
            <PagoPedido
              pedidoId={pedido.id}
              montoUsd={money(pedido.total_usd)}
              montoLocal={cotizacion
                ? `${cotizacion.currency} ${cotizacion.amount.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`
                : null}
              notaCotizacion={cotizacion
                ? `Cotización ${cotizacion.source} + 3%, redondeada. Si pasan más de 72 horas, pedime el monto actualizado.`
                : null}
              instrucciones={paymentInstructionsFor(lead?.pais ?? null)}
              yaInformado={etapa === 'esperando'}
            />
          )}

          {etapa === 'listo' && (
            <Reveal as="div" className="surface-panel border border-brand-primary/25 px-6 py-8">
              <h2 className="section-title-sm">{labels.firmado}</h2>
              <p className="mt-3 max-w-xl text-base leading-7 text-text-secondary">
                {labels.arrancamos}
              </p>

              <p className="mt-5 text-sm leading-6 text-text-tertiary">
                {lead?.factura_numero
                  ? `${labels.factura}: ${lead.factura_numero}`
                  : labels.facturaPendiente}
              </p>

              <Link href={`/${currentLocale}/pedido/${pedido.id}/datos`} className="button-primary mt-6 gap-2">
                <span>{labels.cargarDatos}</span>
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
              </Link>
            </Reveal>
          )}

          {/* Su contrato, siempre a un clic del mismo link. */}
          {etapa !== 'datos' && etapa !== 'firma' && (
            <p className="mt-5 text-sm leading-6 text-text-tertiary">
              <a
                href={`/api/pedido/${pedido.id}/contrato-firmado`}
                className="inline-flex items-center gap-2 text-text-secondary underline decoration-outline-ghost/30 underline-offset-4 transition-colors hover:text-text-primary"
              >
                <Download className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {labels.descargarContrato}
              </a>
            </p>
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
