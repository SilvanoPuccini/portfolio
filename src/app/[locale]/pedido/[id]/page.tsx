import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { PedidoCheckout } from '@/components/pedido/PedidoCheckout';
import { PedidoLayout } from '@/components/pedido/PedidoLayout';
import { cargarPedidoCompleto } from '@/lib/leads/cargar-pedido';
import { redirigirA } from '@/lib/leads/pedido-pasos';
import { resolveLocale } from '@/lib/i18n';
import type { Locale } from '@/content/servicios';

/**
 * Paso 1: quién compra.
 *
 * Es la puerta del circuito y por eso vive en la raíz: es el link que sale de
 * los servicios. Si el pedido ya avanzó, manda al paso donde quedó — así el
 * mismo link sirve para siempre, y volver a abrirlo nunca hace retroceder
 * nada.
 */

export const dynamic = 'force-dynamic';

type Params = Promise<{ locale: string; id: string }>;

export const metadata: Metadata = {
  title: 'Tu pedido | Silvano Puccini',
  robots: { index: false, follow: false },
};

const titulo = { es: 'Tus datos', en: 'Your details' } as const;

export default async function PedidoPage({ params }: { params: Params }) {
  const { locale, id } = await params;
  const currentLocale = resolveLocale(locale) as Locale;

  const datos = await cargarPedidoCompleto(id);
  if (!datos) notFound();

  const destino = redirigirA(datos.etapa, 'resumen', currentLocale, id);
  if (destino) redirect(destino);

  return (
    <PedidoLayout
      paquete={datos.paquete}
      resumen={datos.resumen}
      totalUsd={datos.pedido.total_usd}
      mensualUsd={datos.pedido.mensual_usd}
      esperaDias={datos.espera}
      locale={currentLocale}
      paso="resumen"
      titulo={titulo[currentLocale]}
    >
      <PedidoCheckout pedidoId={datos.pedido.id} locale={currentLocale} />
    </PedidoLayout>
  );
}
