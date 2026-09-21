import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowRight, Check } from 'lucide-react';

import PackageCard from '@/components/site/PackageCard';
import PageHero from '@/components/site/PageHero';
import Reveal, { RevealGroup } from '@/components/site/Reveal';
import {
  ALIAS_SERVICIOS,
  SERVICIOS,
  servicioPorSlug,
  type Destino,
  type Locale,
} from '@/content/servicios';
import { resolveLocale } from '@/lib/i18n';

/**
 * La ficha de un servicio: el problema, lo que incluye y con qué se compara.
 *
 * Cada servicio tiene su URL propia porque es la página a la que se llega
 * desde Google y desde el banner. Antes todo vivía en una sola pantalla con
 * cuatro tarjetas larguísimas y un formulario de cuatro pasos al final, y el
 * que quería saber un precio tenía que leer los otros tres servicios primero.
 */

type Params = Promise<{ locale: string; slug: string }>;

const copy = {
  es: {
    paraQuien: 'Esto es para vos si',
    paquetes: 'Elegí el que entra en lo tuyo',
    sinPaquetes: 'Por qué no tiene precio de lista',
    derivaciones: 'Si tu caso es otro',
    agendar: 'Agendar una llamada',
    volver: 'Ver todos los servicios',
    cierre: 'La llamada dura 45 minutos, no tiene costo y salís con un número.',
  },
  en: {
    paraQuien: 'This is for you if',
    paquetes: 'Pick the one that fits',
    sinPaquetes: 'Why there is no list price',
    derivaciones: 'If your case is different',
    agendar: 'Schedule a call',
    volver: 'See all services',
    cierre: 'The call takes 45 minutes, costs nothing, and you leave with a number.',
  },
} as const;

export function generateStaticParams() {
  return SERVICIOS.flatMap((servicio) =>
    (['es', 'en'] as Locale[]).map((locale) => ({ locale, slug: servicio.slug })),
  );
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  const currentLocale = resolveLocale(locale) as Locale;
  const servicio = servicioPorSlug(slug);

  if (!servicio) return {};

  return {
    title: `${servicio.nombre[currentLocale]} | Silvano Puccini`,
    description: servicio.promesa[currentLocale],
    alternates: {
      canonical: `/${currentLocale}/services/${servicio.slug}`,
      languages: {
        es: `/es/services/${servicio.slug}`,
        en: `/en/services/${servicio.slug}`,
      },
    },
  };
}

function hrefDelDestino(destino: Destino, locale: Locale): string {
  if (destino.tipo === 'servicio') return `/${locale}/services/${destino.slug}`;
  if (destino.tipo === 'paquete') return `/${locale}/services/agendar?paquete=${destino.slug}`;
  return `/${locale}/services/agendar`;
}

export default async function ServicioPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  const currentLocale = resolveLocale(locale) as Locale;

  // Los links publicados y los leads viejos usan los slugs anteriores: se
  // redirige en vez de romperlos.
  const nuevo = ALIAS_SERVICIOS[slug];
  if (nuevo) redirect(`/${currentLocale}/services/${nuevo}`);

  const servicio = servicioPorSlug(slug);
  if (!servicio) notFound();

  const labels = copy[currentLocale];
  const agendarHref = `/${currentLocale}/services/agendar?service=${servicio.slug}`;

  return (
    <>
      <PageHero
        eyebrow={servicio.nombre[currentLocale]}
        title={servicio.problema[currentLocale]}
        subtitle={<p>{servicio.promesa[currentLocale]}</p>}
        actions={
          <>
            <Link href={agendarHref} className="button-primary w-full gap-2 sm:w-auto">
              <span>{labels.agendar}</span>
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </Link>
            <Link href={`/${currentLocale}/services`} className="button-secondary w-full sm:w-auto">
              {labels.volver}
            </Link>
          </>
        }
      />

      <section className="site-container py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          <Reveal as="div" className="no-line-stack">
            <p className="technical-label">{labels.paraQuien}</p>
            <ul className="mt-5 space-y-3">
              {servicio.paraQuien[currentLocale].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm leading-6 text-text-secondary">
                  <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-brand-primary" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          <div>
            {servicio.paquetes.length > 0 ? (
              <>
                <p className="technical-label">{labels.paquetes}</p>
                {/* En celular se descubren deslizando; desde tablet, lado a lado. */}
                <RevealGroup className="mt-5 -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 xl:grid-cols-3">
                  {servicio.paquetes.map((paquete) => (
                    <Reveal
                      key={paquete.slug}
                      as="div"
                      className="w-[85vw] shrink-0 snap-center sm:w-auto sm:shrink"
                    >
                      <PackageCard
                        locale={currentLocale}
                        paquete={paquete}
                        extras={servicio.extras}
                      />
                    </Reveal>
                  ))}
                </RevealGroup>
              </>
            ) : (
              <Reveal as="div" className="surface-panel border border-outline-ghost/10 px-6 py-8">
                <p className="technical-label">{labels.sinPaquetes}</p>
                <p className="mt-4 text-base leading-7 text-text-secondary">
                  {servicio.porQueNoTienePrecio?.[currentLocale]}
                </p>
                <Link href={agendarHref} className="button-primary mt-6 inline-flex gap-2">
                  <span>{labels.agendar}</span>
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                </Link>
              </Reveal>
            )}
          </div>
        </div>
      </section>

      {servicio.derivaciones.length > 0 && (
        <section className="site-container pb-16 sm:pb-20">
          <p className="technical-label">{labels.derivaciones}</p>
          <RevealGroup className="mt-5 grid gap-3 sm:grid-cols-2">
            {servicio.derivaciones.map((derivacion) => (
              <Reveal key={derivacion.label[currentLocale]} as="div">
                <Link
                  href={hrefDelDestino(derivacion.hacia, currentLocale)}
                  className="card-interactive-soft flex h-full items-center justify-between gap-4 border border-outline-ghost/10 bg-[rgb(var(--surface)/0.55)] px-5 py-4"
                >
                  <span className="min-w-0">
                    <span className="block text-sm leading-6 text-text-secondary">
                      {derivacion.caso[currentLocale]}
                    </span>
                    <span className="mt-1 block text-base font-medium text-text-primary">
                      {derivacion.label[currentLocale]}
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-text-tertiary" aria-hidden="true" />
                </Link>
              </Reveal>
            ))}
          </RevealGroup>
          <p className="mt-8 max-w-2xl text-sm leading-6 text-text-tertiary">{labels.cierre}</p>
        </section>
      )}
    </>
  );
}
