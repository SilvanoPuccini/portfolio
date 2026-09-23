import type { Metadata } from 'next';

import { RecuperarPedido } from '@/components/pedido/RecuperarPedido';
import Reveal from '@/components/site/Reveal';
import { resolveLocale } from '@/lib/i18n';
import type { Locale } from '@/content/servicios';

/**
 * El camino de vuelta al pedido.
 *
 * Existe porque el link es un uuid: quien lo perdía y no encontraba el correo
 * empezaba de cero, y ahí nacía un segundo lead del mismo cliente con otro
 * pedido a medias. Dos ventas donde hay una, y ninguna completa.
 */

export const dynamic = 'force-dynamic';

type Params = Promise<{ locale: string }>;

export const metadata: Metadata = {
  title: 'Volver a tu pedido | Silvano Puccini',
  robots: { index: false, follow: false },
};

const copy = {
  es: {
    eyebrow: 'Volver a tu pedido',
    titulo: '¿Perdiste el link?',
    bajada: 'Pasa: el link vive en la barra del navegador y se va con la pestaña. '
      + 'Dejame tu correo y te lo mando de nuevo, al paso exacto donde quedaste.',
  },
  en: {
    eyebrow: 'Back to your order',
    titulo: 'Lost the link?',
    bajada: 'It happens: the link lives in the address bar and leaves with the tab. '
      + 'Leave me your email and I will send it again, to the exact step where you left off.',
  },
} as const;

export default async function RecuperarPage({ params }: { params: Params }) {
  const { locale } = await params;
  const labels = copy[resolveLocale(locale) as Locale];

  return (
    <main className="site-container flex min-h-[70vh] items-center py-16 sm:py-24">
      <div className="w-full max-w-2xl">
        <Reveal>
          <p className="technical-label">{labels.eyebrow}</p>
        </Reveal>
        <Reveal>
          <h1 className="mt-3 text-3xl font-medium text-text-primary sm:text-4xl">{labels.titulo}</h1>
        </Reveal>
        <Reveal>
          <p className="mt-3 text-base leading-7 text-text-secondary">{labels.bajada}</p>
        </Reveal>

        <Reveal as="div" className="mt-8">
          <RecuperarPedido />
        </Reveal>
      </div>
    </main>
  );
}
