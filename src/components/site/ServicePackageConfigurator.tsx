'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight, Check } from 'lucide-react';
import { carePrice, policyForPackage } from '@/content/service-policy';
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
  const [ready, setReady] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [configuration, setConfiguration] = useState<PackageConfiguration>({ calificacion: {}, extras: [] });
  const [changeNotice, setChangeNotice] = useState('');
  const selected = servicio.paquetes.find((paquete) => paquete.slug === selectedSlug) ?? null;
  useEffect(() => setReady(true), []);

  function select(paquete: Paquete) {
    const next = compatibleConfiguration(paquete, servicio.extras, configuration.calificacion, configuration.extras);
    const removed = Object.keys(configuration.calificacion).length > Object.keys(next.calificacion).length || configuration.extras.some((id) => !next.extras.includes(id));
    const added = next.extras.some((id) => !configuration.extras.includes(id));
    setChangeNotice([removed ? labels.removed : '', added ? labels.added : ''].filter(Boolean).join(' '));
    setConfiguration(next);
    setSelectedSlug(paquete.slug);
  }

  return <div className="space-y-8">
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" role="group" aria-label={labels.choose}>
      {servicio.paquetes.map((paquete, index) => {
        const active = selectedSlug === paquete.slug;
        return <button key={paquete.slug} type="button" aria-pressed={active} disabled={!ready} onClick={() => select(paquete)}
          className={`group relative flex min-h-44 w-full flex-col border p-5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary ${active ? 'border-brand-primary bg-brand-primary/[0.08]' : 'border-outline-ghost/20 bg-[rgb(var(--surface)/0.45)] hover:border-brand-primary/50'}`}>
          <span className="flex w-full items-center justify-between gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-text-tertiary"><span>{String(index + 1).padStart(2, '0')} / {String(servicio.paquetes.length).padStart(2, '0')}</span><span>{active ? labels.selected : paquete.destacado ? labels.recommended : ''}</span></span>
          <strong className="mt-5 text-lg font-medium leading-snug text-text-primary">{paquete.nombre[locale]}</strong>
          <span className="mt-2 text-sm leading-6 text-text-secondary">{paquete.resumen[locale]}</span>
          <span className="mt-auto flex w-full items-end justify-between gap-3 border-t border-outline-ghost/15 pt-4 text-sm font-medium text-text-primary"><span>{price(paquete, locale)}</span><ArrowUpRight className="h-4 w-4 shrink-0 text-brand-primary" aria-hidden="true" /></span>
          <span className="sr-only">{labels.select}</span>
        </button>;
      })}
    </div>
    {!selected && <p className="border-l-2 border-brand-primary pl-4 text-sm leading-6 text-text-secondary">{labels.choose}. {labels.recommended} {locale === 'es' ? 'es una sugerencia, no una selección.' : 'is a suggestion, not a selection.'}</p>}
    {changeNotice && <p role="status" className="border-l-2 border-brand-primary pl-4 text-sm leading-6 text-text-secondary">{changeNotice}</p>}
    {selected && <section aria-labelledby="configuration-title" className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.55fr)]">
      <div><h3 id="configuration-title" className="mb-4 font-mono text-xs uppercase tracking-[0.18em] text-brand-primary">{labels.configuration}</h3><PackageCard locale={locale} paquete={selected} extras={servicio.extras} configuration={configuration} onConfigurationChange={setConfiguration} /></div>
      <aside className="surface-panel h-fit border border-outline-ghost/15 p-5 sm:p-6" aria-label={labels.preview}>
        <p className="technical-label">{labels.preview}</p><p className="mt-2 text-sm leading-6 text-text-secondary">{selected.nombre[locale]}</p>
        <div className="mt-5 space-y-2 border border-outline-ghost/15 p-3" aria-hidden="true"><div className="h-2 w-1/3 bg-brand-primary/70" /><div className="h-20 border border-outline-ghost/20 bg-brand-primary/[0.06]" /><div className="grid grid-cols-3 gap-2">{selected.incluye[locale].slice(0, 3).map((item) => <div key={item} className="h-12 border border-outline-ghost/20 bg-[rgb(var(--surface)/0.7)]" />)}</div></div>
        <ul className="mt-5 space-y-2">{selected.incluye[locale].slice(0, 3).map((item) => <li key={item} className="flex gap-2 text-xs leading-5 text-text-secondary"><Check className="mt-1 h-3 w-3 shrink-0 text-brand-primary" aria-hidden="true" />{item}</li>)}</ul>
        <p className="mt-5 border-t border-outline-ghost/15 pt-4 text-xs leading-5 text-text-tertiary">{labels.illustrative} {labels.pending}</p>
      </aside>
    </section>}
  </div>;
}
