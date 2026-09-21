import Link from 'next/link';
import {
  ArrowRight,
  ClipboardCheck,
  Globe,
  LayoutDashboard,
  ShieldCheck,
  ShoppingBag,
  Workflow,
  type LucideIcon,
} from 'lucide-react';

import Reveal, { RevealGroup } from '@/components/site/Reveal';
import { SERVICIOS, type Locale } from '@/content/servicios';

/**
 * El catálogo, ordenado por el problema del cliente.
 *
 * La tarjeta arranca con la frase que él diría, no con el nombre del servicio:
 * nadie busca «web de captación», busca que lo encuentren. El nombre y el
 * precio van abajo, cuando ya se reconoció en el problema.
 */

const ICONOS: Record<string, LucideIcon> = {
  Globe,
  ShoppingBag,
  LayoutDashboard,
  Workflow,
  ClipboardCheck,
  ShieldCheck,
};

const copy = {
  es: {
    desde: (precio: number) => `Desde USD ${precio.toLocaleString('es-AR')}`,
    porMes: (precio: number) => `Desde USD ${precio} por mes`,
    aCotizar: 'Se cotiza en la llamada',
    ver: 'Ver cómo funciona',
  },
  en: {
    desde: (precio: number) => `From USD ${precio.toLocaleString('en-US')}`,
    porMes: (precio: number) => `From USD ${precio} per month`,
    aCotizar: 'Quoted on the call',
    ver: 'See how it works',
  },
} as const;

export default function ServiceCatalog({ locale }: { locale: Locale }) {
  const labels = copy[locale];

  return (
    <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {SERVICIOS.map((servicio) => {
        const Icono = ICONOS[servicio.icono] ?? Globe;
        const mensual = servicio.paquetes.some((p) => p.recurrente);
        const precio = servicio.desdeUsd === null
          ? labels.aCotizar
          : mensual
            ? labels.porMes(servicio.desdeUsd)
            : labels.desde(servicio.desdeUsd);

        return (
          <Reveal key={servicio.slug} as="article" className="h-full">
            <Link
              href={`/${locale}/services/${servicio.slug}`}
              className="card-interactive surface-panel flex h-full flex-col border border-outline-ghost/10 px-5 py-6 sm:px-6"
            >
              <Icono className="h-5 w-5 shrink-0 text-brand-primary" aria-hidden="true" />

              <h3 className="mt-5 text-lg font-medium leading-snug text-text-primary sm:text-xl">
                {servicio.problema[locale]}
              </h3>

              <p className="mt-3 flex-1 text-sm leading-6 text-text-secondary">
                {servicio.promesa[locale]}
              </p>

              <div className="mt-6 border-t border-outline-ghost/10 pt-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-tertiary">
                  {servicio.nombre[locale]}
                </p>
                <p className="mt-2 flex items-center justify-between gap-3 text-sm font-medium text-text-primary">
                  <span>{precio}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-text-tertiary" aria-hidden="true" />
                </p>
              </div>

              <span className="sr-only">{labels.ver}</span>
            </Link>
          </Reveal>
        );
      })}
    </RevealGroup>
  );
}
