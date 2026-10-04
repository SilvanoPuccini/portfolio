import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Check, ClipboardCheck, Globe, LayoutDashboard, ShieldCheck, ShoppingBag, Workflow, type LucideIcon } from 'lucide-react';

import ServicePackageConfigurator from '@/components/site/ServicePackageConfigurator';
import {
  ALIAS_SERVICIOS,
  PUBLIC_SERVICIOS,
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
const visualIcons: Record<string, LucideIcon> = { Globe, ShoppingBag, LayoutDashboard, Workflow, ClipboardCheck, ShieldCheck };

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
  return PUBLIC_SERVICIOS.flatMap((servicio) =>
    (['es', 'en'] as Locale[]).map((locale) => ({ locale, slug: servicio.slug })),
  );
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  const currentLocale = resolveLocale(locale) as Locale;
  const servicio = PUBLIC_SERVICIOS.find((item) => item.slug === (ALIAS_SERVICIOS[slug] ?? slug));

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

  const servicio = PUBLIC_SERVICIOS.find((item) => item.slug === (ALIAS_SERVICIOS[slug] ?? slug));
  if (!servicio) notFound();

  const labels = copy[currentLocale];
  const agendarHref = `/${currentLocale}/services/agendar?service=${servicio.slug}`;

  return (
    <section className="site-container py-10 sm:py-14" aria-labelledby="service-title">
      <nav aria-label={currentLocale === 'es' ? 'Ubicación' : 'Breadcrumb'} className="text-sm text-text-secondary"><Link href={`/${currentLocale}/services`} className="hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary">← {labels.volver}</Link><span className="mx-2" aria-hidden="true">/</span><span aria-current="page">{servicio.nombre[currentLocale]}</span></nav>
      <header className="mb-7 mt-6 grid items-center gap-5 md:grid-cols-[minmax(0,1fr)_11rem]">
       <div className="max-w-2xl">
        <p className="technical-label">{servicio.nombre[currentLocale]}</p>
        <h1 id="service-title" className="mt-3 text-3xl font-medium tracking-tight sm:text-4xl">{servicio.problema[currentLocale]}</h1>
        <p className="mt-3 text-sm leading-6 text-text-secondary">{servicio.promesa[currentLocale]}</p>
       </div>
       <div className="hidden h-36 items-center justify-center border border-outline-ghost/15 bg-brand-primary/[0.04] md:flex" aria-hidden="true">{(() => { const Icon = visualIcons[servicio.icono] ?? Globe; return <Icon className="h-12 w-12 text-brand-primary" strokeWidth={1.25} />; })()}</div>
      </header>
      <ul className="mb-7 grid gap-3 border-y border-outline-ghost/15 py-5 sm:grid-cols-3" aria-label={currentLocale === 'es' ? 'Beneficios' : 'Benefits'}>{servicio.paraQuien[currentLocale].slice(0, 3).map((item) => <li key={item} className="flex gap-2 text-sm leading-6 text-text-secondary"><Check className="mt-1 h-4 w-4 shrink-0 text-brand-primary" aria-hidden="true" />{item}</li>)}</ul>
      <p className="mb-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-text-secondary" aria-label={currentLocale === 'es' ? 'Etapas del pedido' : 'Order steps'}><span><b className="mr-2 font-mono text-brand-primary">01</b>{currentLocale === 'es' ? 'Elegí el alcance' : 'Choose the scope'}</span><span><b className="mr-2 font-mono text-brand-primary">02</b>{currentLocale === 'es' ? 'Respondé lo necesario' : 'Answer what is needed'}</span><span><b className="mr-2 font-mono text-brand-primary">03</b>{currentLocale === 'es' ? 'Revisá el acuerdo' : 'Review the agreement'}</span></p>
      <div id="packages" className="scroll-mt-28"><h2 className="mb-5 text-xl font-medium">{servicio.paquetes.length ? labels.paquetes : labels.sinPaquetes}</h2>{servicio.paquetes.length ? <ServicePackageConfigurator locale={currentLocale} servicio={servicio} /> : <div className="max-w-2xl border border-outline-ghost/15 p-6"><p className="text-sm leading-6 text-text-secondary">{servicio.porQueNoTienePrecio?.[currentLocale]}</p><Link href={agendarHref} className="button-primary mt-5 inline-flex">{currentLocale === 'es' ? 'Solicitar cotización' : 'Request a quote'}</Link></div>}</div>
      <details className="mt-8 border-t border-outline-ghost/15 pt-4 text-sm text-text-secondary">
        <summary className="cursor-pointer">{labels.derivaciones}</summary>
        <ul className="mt-3 space-y-2">{servicio.derivaciones.map((item) => <li key={item.label[currentLocale]}><Link href={hrefDelDestino(item.hacia, currentLocale)} className="underline">{item.caso[currentLocale]} — {item.label[currentLocale]}</Link></li>)}</ul>
      </details>
    </section>
  );

}
