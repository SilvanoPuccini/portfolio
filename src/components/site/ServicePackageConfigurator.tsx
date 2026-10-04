'use client';

import { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { carePrice, policyForPackage, policyParagraphs } from '@/content/service-policy';
import type { Locale, Paquete, Servicio } from '@/content/servicios';
import { compatibleConfiguration } from '@/lib/order-config';
import PackageCard, { type PackageConfiguration } from './PackageCard';

const copy = {
  es: { choose: 'Elegí un paquete para configurarlo', recommended: 'Recomendado', selected: 'Seleccionado', select: 'Elegir paquete', from: 'Desde', quote: 'A cotizar', configuration: 'Configuración y próximo paso', preview: 'Vista de alcance', illustrative: 'Esquema ilustrativo del alcance. No es una demo funcional ni un entregable terminado.', pending: 'Todavía no hay una demostración pública verificada de este paquete.', removed: 'Se quitaron opciones que no aplican al nuevo paquete.', added: 'Se agregó un requisito incluido en este paquete.' },
  en: { choose: 'Choose a package to configure', recommended: 'Recommended', selected: 'Selected', select: 'Select package', from: 'From', quote: 'Quoted', configuration: 'Configuration and next step', preview: 'Scope preview', illustrative: 'Illustrative scope map. This is not a working demo or finished deliverable.', pending: 'A verified public demonstration of this package is not available yet.', removed: 'Choices that do not apply to this package were removed.', added: 'A required item was added for this package.' },
} as const;

function price(paquete: Paquete, locale: Locale): string {
  const care = policyForPackage(paquete.slug);
  if (paquete.recurrente && care) return carePrice(care, locale);
  if (paquete.precioUsd !== null) return `USD ${paquete.precioUsd.toLocaleString(locale === 'es' ? 'es-AR' : 'en-US')}${paquete.recurrente ? (locale === 'es' ? ' por mes' : ' per month') : ''}`;
  return paquete.desdeUsd ? `${copy[locale].from} USD ${paquete.desdeUsd.toLocaleString(locale === 'es' ? 'es-AR' : 'en-US')}` : copy[locale].quote;
}

export default function ServicePackageConfigurator({ locale, servicio }: { locale: Locale; servicio: Servicio }) {
  const labels = copy[locale];
  const checkoutRef = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [configuration, setConfiguration] = useState<PackageConfiguration>({ calificacion: {}, extras: [] });
  const [changeNotice, setChangeNotice] = useState('');
  const selected = servicio.paquetes.find((paquete) => paquete.slug === selectedSlug) ?? null;
  useEffect(() => setReady(true), []);
  useEffect(() => { if (selectedSlug) checkoutRef.current?.focus(); }, [selectedSlug]);

  function select(paquete: Paquete) {
    const next = compatibleConfiguration(paquete, servicio.extras, configuration.calificacion, configuration.extras);
    const removed = Object.keys(configuration.calificacion).length > Object.keys(next.calificacion).length || configuration.extras.some((id) => !next.extras.includes(id));
    const added = next.extras.some((id) => !configuration.extras.includes(id));
    setChangeNotice([removed ? labels.removed : '', added ? labels.added : ''].filter(Boolean).join(' '));
    setConfiguration(next);
    setSelectedSlug(paquete.slug);
  }

  return <div className="space-y-6">
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" role="group" aria-label={locale === 'es' ? `Paquetes de ${servicio.nombre.es}` : `${servicio.nombre.en} packages`}>
      {servicio.paquetes.map((paquete) => {
        const active = selectedSlug === paquete.slug;
        const care = policyForPackage(paquete.slug);
        const requiresQuote = paquete.precioUsd === null || Boolean(paquete.recurrente);
        const quoteHref = `/${locale}/services/agendar?service=${servicio.slug}&paquete=${paquete.slug}`;
        return <article key={paquete.slug} className={`flex flex-col border p-5 transition-colors ${active ? 'border-brand-primary bg-brand-primary/[0.04]' : 'border-outline-ghost/20'}`}>
          <p className="technical-label min-h-4">{paquete.destacado ? labels.recommended : ''}</p>
          <h3 className="mt-2 text-xl font-medium">{paquete.nombre[locale]}</h3>
          <p className="mt-2 text-sm leading-6 text-text-secondary">{paquete.resumen[locale]}</p>
          <p className="mt-3 font-mono text-2xl font-semibold">{price(paquete, locale)}</p>
          <ul className="my-4 space-y-2 text-sm leading-5 text-text-secondary">{paquete.incluye[locale].slice(0, 3).map((item) => <li key={item} className="flex gap-2"><Check className="mt-1 h-3 w-3 shrink-0 text-brand-primary" aria-hidden="true" />{item}</li>)}</ul>
          <details className="mb-4 text-sm leading-6 text-text-secondary"><summary className="cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary">{locale === 'es' ? 'Alcance y condiciones' : 'Scope and terms'}</summary><ul className="mt-2 space-y-2">{paquete.incluye[locale].slice(3).map((item) => <li key={item}>{item}</li>)}{paquete.noIncluye[locale].map((item) => <li key={item}>{locale === 'es' ? 'No incluye: ' : 'Not included: '}{item}</li>)}</ul>{care && <div className="mt-3 space-y-2 border-t border-outline-ghost/15 pt-3">{policyParagraphs(care, locale).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>}</details>
          <div className="mt-auto border-t border-outline-ghost/15 pt-3 text-xs leading-5 text-text-secondary">
            {care && !paquete.recurrente && <p>{locale === 'es' ? 'Cuidado opcional: ' : 'Optional care: '}{carePrice(care, locale)}.</p>}
            {care && <p>{locale === 'es' ? 'Hosting inicial y garantía: 30 días. Luego, cuidado aceptado expresamente o transferencia. Sin cobros automáticos.' : 'Initial hosting and warranty: 30 days. Then explicitly accepted care or transfer. No automatic billing.'}</p>}
            <p>{locale === 'es' ? 'Dominio anual, IA/API, licencias y comisiones de terceros aparte.' : 'Annual domain, AI/API, licenses and third-party fees are separate.'}</p>
          </div>
          {requiresQuote ? <Link href={quoteHref} className="button-primary mt-4 w-full text-center">{locale === 'es' ? 'Solicitar cotización' : 'Request a quote'}</Link> : <button type="button" disabled={!ready} aria-pressed={active} aria-label={`${locale === 'es' ? 'Comprar' : 'Buy'} ${paquete.nombre[locale]}`} onClick={() => select(paquete)} className="button-primary mt-4 w-full">{locale === 'es' ? 'Comprar' : 'Buy'}</button>}
        </article>;
      })}
    </div>
    {changeNotice && <p role="status" className="border-l-2 border-brand-primary pl-4 text-sm leading-6 text-text-secondary">{changeNotice}</p>}
    {selected && <section ref={checkoutRef} tabIndex={-1} aria-labelledby="checkout-title" className="max-w-2xl scroll-mt-28 focus:outline-none">
      <h2 id="checkout-title" className="mb-3 text-lg font-medium">{locale === 'es' ? 'Confirmá el alcance' : 'Confirm the scope'}</h2>
      <PackageCard locale={locale} paquete={selected} extras={servicio.extras} configuration={configuration} onConfigurationChange={setConfiguration} compact />
    </section>}
  </div>;
}
