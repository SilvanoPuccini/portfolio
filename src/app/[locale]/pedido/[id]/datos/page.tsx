import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { AccesoGate } from '@/components/pedido/AccesoGate';
import Reveal from '@/components/site/Reveal';
import { planKickoff } from '@/content/kickoff';
import { paquetePorSlug, servicioPorSlug, type Locale } from '@/content/servicios';
import { COOKIE_ACCESO, tieneAcceso } from '@/lib/leads/acceso-cliente';
import { resolveLocale } from '@/lib/i18n';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * El material del proyecto: el último paso de la compra.
 *
 * Tiene URL propia y no vive dentro de la página de gracias a propósito.
 * Cargar el logo, las fotos y los textos es trabajo, y el cliente vuelve a
 * hacerlo en varias sentadas: necesita un link al que volver.
 */

export const dynamic = 'force-dynamic';

type Params = Promise<{ locale: string; id: string }>;

export const metadata: Metadata = {
  title: 'El material de tu proyecto | Silvano Puccini',
  robots: { index: false, follow: false },
};

const copy = {
  es: {
    eyebrow: 'Último paso',
    titulo: 'El material de tu proyecto',
    bajada: 'Con esto arranco. Lo que no tengas a mano, dejalo para después: se guarda solo y podés '
      + 'volver a este mismo link cuando quieras.',
    volver: 'Volver a tu pedido',
    sinFirmar: 'Este paso se abre cuando el contrato está firmado.',
  },
  en: {
    eyebrow: 'Last step',
    titulo: 'Your project material',
    bajada: 'This is what I start with. Whatever you do not have at hand, leave for later: it saves '
      + 'itself and you can come back to this same link.',
    volver: 'Back to your order',
    sinFirmar: 'This step opens once the contract is signed.',
  },
} as const;

async function cargar(id: string) {
  const db = getSupabaseAdmin();

  const { data } = await db
    .from('pedidos')
    .select('id, paquete, extras, calificacion, lead_id')
    .eq('id', id)
    .maybeSingle();

  const pedido = data as {
    id: string; paquete: string; extras: string[] | null;
    calificacion: Record<string, string> | null; lead_id: string | null;
  } | null;

  if (!pedido?.lead_id) return { pedido, lead: null };

  const { data: venta } = await db
    .from('leads')
    .select('contrato_firmado_at, kickoff_datos, kickoff_completado_at')
    .eq('id', pedido.lead_id)
    .maybeSingle();

  return {
    pedido,
    lead: venta as {
      contrato_firmado_at: string | null;
      kickoff_datos: Record<string, unknown> | null;
      kickoff_completado_at: string | null;
    } | null,
  };
}

export default async function DatosDelProyecto({ params }: { params: Params }) {
  const { locale, id } = await params;
  const currentLocale = resolveLocale(locale) as Locale;
  const labels = copy[currentLocale];

  const { pedido, lead } = await cargar(id);
  if (!pedido) notFound();

  const paquete = paquetePorSlug(pedido.paquete);
  if (!paquete) notFound();

  const servicio = servicioPorSlug(paquete.servicio);
  const plan = planKickoff(paquete, pedido.extras ?? [], servicio?.extras ?? [], pedido.calificacion ?? {});

  const verificado = tieneAcceso((await cookies()).get(COOKIE_ACCESO)?.value, pedido.id);

  return (
    <main className="site-container py-14 sm:py-20">
      <Reveal>
        <Link
          href={`/${currentLocale}/pedido/${pedido.id}`}
          className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-text-tertiary transition-colors hover:text-text-primary"
        >
          <ArrowLeft className="h-3 w-3" aria-hidden="true" />
          {labels.volver}
        </Link>
      </Reveal>

      <Reveal>
        <p className="technical-label mt-6">{labels.eyebrow}</p>
      </Reveal>
      <Reveal>
        <h1 className="mt-3 text-3xl font-medium text-text-primary sm:text-4xl">{labels.titulo}</h1>
      </Reveal>
      <Reveal>
        <p className="mt-4 max-w-2xl text-base leading-7 text-text-secondary">{labels.bajada}</p>
      </Reveal>

      <div className="mt-10 max-w-3xl">
        {!lead?.contrato_firmado_at ? (
          <div className="surface-panel border border-outline-ghost/10 px-6 py-8">
            <p className="text-base leading-7 text-text-secondary">{labels.sinFirmar}</p>
          </div>
        ) : (
          <AccesoGate
            pedidoId={pedido.id}
            verificado={verificado}
            plan={plan}
            iniciales={(lead.kickoff_datos ?? {}) as Record<string, never>}
            yaCompletado={Boolean(lead.kickoff_completado_at)}
            locale={currentLocale}
          />
        )}
      </div>
    </main>
  );
}
