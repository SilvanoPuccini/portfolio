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
import { frozenKickoffPlan, parseConfigurationSnapshot } from '@/lib/order-configuration-snapshot';

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
    alcance: 'Alcance acordado en tu pedido',
    pagoUnico: 'Pago único',
    recurrente: 'Recurrente',
    incluye: 'Incluye',
    noIncluye: 'No incluye',
    elegido: 'Tu configuración',
    responsabilidades: 'Responsabilidades y condiciones',
    entrega: 'Plazo máximo de entrega',
    legacy: 'No hay una captura detallada del alcance para este pedido. El contrato firmado es el registro válido; no reconstruimos el alcance desde el catálogo actual.',
  },
  en: {
    eyebrow: 'Last step',
    titulo: 'Your project material',
    bajada: 'This is what I start with. Whatever you do not have at hand, leave for later: it saves '
      + 'itself and you can come back to this same link.',
    volver: 'Back to your order',
    sinFirmar: 'This step opens once the contract is signed.',
    alcance: 'Scope agreed in your order',
    pagoUnico: 'One-time',
    recurrente: 'Recurring',
    incluye: 'Included',
    noIncluye: 'Excluded',
    elegido: 'Your configuration',
    responsabilidades: 'Responsibilities and terms',
    entrega: 'Maximum delivery window',
    legacy: 'This order has no archived scope snapshot. The signed contract remains the source of truth; we do not rebuild its scope from the current catalog.',
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

  const verificado = tieneAcceso((await cookies()).get(COOKIE_ACCESO)?.value, id);

  // Never fetch private materials or the buyer's answers for an unverified request.
  if (!verificado || !pedido?.lead_id) return { pedido, lead: null, verificado, snapshot: null };

  const [{ data: venta }, { data: order }] = await Promise.all([
    db.from('leads')
      .select('contrato_firmado_at, kickoff_datos, kickoff_completado_at')
      .eq('id', pedido.lead_id)
      .maybeSingle(),
    db.from('pedidos')
      .select('configuracion_snapshot')
      .eq('id', pedido.id)
      .maybeSingle(),
  ]);

  return {
    pedido,
    verificado,
    lead: venta as {
      contrato_firmado_at: string | null;
      kickoff_datos: Record<string, unknown> | null;
      kickoff_completado_at: string | null;
    } | null,
    snapshot: parseConfigurationSnapshot(order?.configuracion_snapshot),
  };
}

export default async function DatosDelProyecto({ params }: { params: Params }) {
  const { locale, id } = await params;
  const currentLocale = resolveLocale(locale) as Locale;
  const labels = copy[currentLocale];

  const { pedido, lead, verificado, snapshot } = await cargar(id);
  if (!pedido) notFound();

  const paquete = paquetePorSlug(pedido.paquete);
  const plan = frozenKickoffPlan(snapshot) ?? (paquete
    ? planKickoff(paquete, pedido.extras ?? [], servicioPorSlug(paquete.servicio)?.extras ?? [], pedido.calificacion ?? {})
    : null);

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

      {verificado && lead?.contrato_firmado_at && (
        <section className="mt-8 max-w-3xl rounded-xl border border-outline-ghost/20 bg-surface-panel p-6" aria-labelledby="frozen-scope-title">
          <h2 id="frozen-scope-title" className="text-lg font-medium text-text-primary">
            {snapshot ? labels.alcance : labels.legacy}
          </h2>
          {snapshot && <>
            <p className="mt-2 text-sm text-text-secondary">{snapshot.package.label} · {snapshot.package.description} · {labels.entrega}: {snapshot.package.deliveryDays} {currentLocale === 'es' ? 'días hábiles' : 'business days'}</p>
            <p className="mt-2 text-sm text-text-secondary">
              {labels.pagoUnico}: USD {snapshot.charges.oneTimeUsd.toLocaleString(currentLocale === 'es' ? 'es-AR' : 'en-US')} ·
              {' '}{labels.recurrente}: USD {snapshot.charges.recurringUsd.toLocaleString(currentLocale === 'es' ? 'es-AR' : 'en-US')}
            </p>
            <h3 className="mt-5 text-sm font-medium text-text-primary">{labels.incluye}</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text-secondary">
              {snapshot.package.included.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <h3 className="mt-5 text-sm font-medium text-text-primary">{labels.noIncluye}</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text-secondary">
              {snapshot.package.excluded.map((item) => <li key={item}>{item}</li>)}
            </ul>
            {(snapshot.extras.length > 0 || snapshot.answers.length > 0) && (
              <>
                <h3 className="mt-5 text-sm font-medium text-text-primary">{labels.elegido}</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text-secondary">
                  {snapshot.extras.map((extra) => <li key={extra.id}>{extra.label}</li>)}
                  {snapshot.answers.map((answer) => <li key={answer.id}>{answer.question}: {answer.selectedOption}</li>)}
                </ul>
              </>
            )}
            {snapshot.responsibilities.length > 0 && <>
              <h3 className="mt-5 text-sm font-medium text-text-primary">{labels.responsabilidades}</h3>
              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-text-secondary">
                {snapshot.responsibilities.map((item, index) => <li key={index}>{item}</li>)}
              </ul>
            </>}
          </>}
        </section>
      )}

      <div className="mt-10 max-w-3xl">
        {!verificado ? (
          <AccesoGate pedidoId={pedido.id} verificado={false} locale={currentLocale} />
        ) : !lead?.contrato_firmado_at ? (
          <div className="surface-panel border border-outline-ghost/10 px-6 py-8">
            <p className="text-base leading-7 text-text-secondary">{labels.sinFirmar}</p>
          </div>
        ) : plan ? (
          <AccesoGate
            pedidoId={pedido.id}
            verificado={true}
            plan={plan}
            iniciales={(lead.kickoff_datos ?? {}) as Record<string, never>}
            yaCompletado={Boolean(lead.kickoff_completado_at)}
            locale={currentLocale}
          />
        ) : (
          <p className="text-sm text-text-secondary">{labels.legacy}</p>
        )}
      </div>
    </main>
  );
}
