import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Download } from 'lucide-react';

import { PedidoGracias } from '@/components/pedido/PedidoGracias';
import { PedidoLayout } from '@/components/pedido/PedidoLayout';
import Reveal from '@/components/site/Reveal';
import { cargarPedidoCompleto } from '@/lib/leads/cargar-pedido';
import { redirigirA } from '@/lib/leads/pedido-pasos';
import { resolveLocale } from '@/lib/i18n';
import { plazoDelPedido, type Locale } from '@/content/servicios';
import { lineaDeTiempo } from '@/lib/leads/linea-de-tiempo';
import { replyToAddress } from '@/lib/resend';

/**
 * Paso 4: pagado, a trabajar.
 *
 * El circuito de la venta terminó y empieza el del proyecto. Lo único que se
 * le pide acá es el material, que es lo que destraba el trabajo: por eso es
 * el único botón lleno de la pantalla.
 */

export const dynamic = 'force-dynamic';

type Params = Promise<{ locale: string; id: string }>;

export const metadata: Metadata = {
  title: 'Tu pedido | Silvano Puccini',
  robots: { index: false, follow: false },
};

const copy = {
  es: {
    titulo: 'A trabajar',
    firmado: 'Pago confirmado',
    arrancamos: 'Ya está todo listo. El último paso es cargar el material de tu proyecto: el logo, las fotos y los textos que tengas.',
    factura: 'Factura',
    facturaPendiente: 'Te mando la factura apenas la emita.',
    cargarDatos: 'Cargar los datos del proyecto',
    contrato: 'Ver el contrato que firmaste',
  },
  en: {
    titulo: 'Getting started',
    firmado: 'Payment confirmed',
    arrancamos: 'Everything is set. The last step is uploading your project material: logo, photos and any copy you have.',
    factura: 'Invoice',
    facturaPendiente: 'I will send the invoice as soon as it is issued.',
    cargarDatos: 'Upload the project details',
    contrato: 'View the contract you signed',
  },
} as const;

export default async function ListoPage({ params }: { params: Params }) {
  const { locale, id } = await params;
  const currentLocale = resolveLocale(locale) as Locale;
  const labels = copy[currentLocale];

  const datos = await cargarPedidoCompleto(id);
  if (!datos) notFound();

  const destino = redirigirA(datos.etapa, 'listo', currentLocale, id);
  if (destino) redirect(destino);

  const { lead, paquete, pedido, resumen } = datos;

  return (
    <PedidoLayout
      paquete={paquete}
      resumen={resumen}
      totalUsd={pedido.total_usd}
      mensualUsd={pedido.mensual_usd}
      esperaDias={datos.espera}
      locale={currentLocale}
      paso="listo"
      titulo={labels.titulo}
    >
      {/* Con el material cargado la compra terminó: gracias y lo que viene,
          con fechas. Antes quedaba un cartel de «Listo» y nada más. */}
      {lead?.kickoff_completado_at ? (
        <PedidoGracias
          pedidoId={pedido.id}
          nombre={lead.nombre}
          paquete={paquete.nombre[currentLocale]}
          factura={lead.factura_numero}
          contacto={replyToAddress() ?? null}
          locale={currentLocale}
          pasos={lineaDeTiempo({
            cobradoAt: lead.cobrado_at,
            materialAt: lead.kickoff_completado_at,
            plazoMaximo: paquete.plazoDias > 0 ? plazoDelPedido(paquete, resumen.extras) + datos.espera : 0,
            espera: datos.espera,
            locale: currentLocale,
          })}
        />
      ) : (
        <CargarMaterial pedidoId={pedido.id} locale={currentLocale} factura={lead?.factura_numero ?? null} />
      )}
    </PedidoLayout>
  );
}

/** Pagado y sin material: lo único que se le pide es cargarlo. */
function CargarMaterial({ pedidoId, locale, factura }: { pedidoId: string; locale: Locale; factura: string | null }) {
  const labels = copy[locale];

  return (
    <>
      <Reveal as="div" className="surface-panel border border-brand-primary/25 px-6 py-8">
        <h2 className="section-title-sm">{labels.firmado}</h2>
        <p className="mt-3 max-w-xl text-base leading-7 text-text-secondary">{labels.arrancamos}</p>

        <p className="mt-5 text-sm leading-6 text-text-tertiary">
          {factura ? `${labels.factura}: ${factura}` : labels.facturaPendiente}
        </p>

        <Link href={`/${locale}/pedido/${pedidoId}/datos`} className="button-primary mt-6 gap-2">
          <span>{labels.cargarDatos}</span>
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </Link>
      </Reveal>

      <p className="mt-5 text-sm leading-6 text-text-tertiary">
        <a
          href={`/api/pedido/${pedidoId}/contrato-firmado`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-text-secondary underline decoration-outline-ghost/30 underline-offset-4 transition-colors hover:text-text-primary"
        >
          <Download className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {labels.contrato}
        </a>
      </p>
    </>
  );
}
