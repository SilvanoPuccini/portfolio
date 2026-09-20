import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getSupabaseAdmin } from '@/lib/supabase';
import { ProposalDecision } from '@/components/propuesta/ProposalDecision';
import type { DiagnosisDoc } from '@/lib/leads/diagnosis-doc';

/**
 * El diagnóstico y la propuesta, como los ve el cliente.
 *
 * Antes esto era un .docx adjunto: el cliente lo abría en el celular, lo veía
 * deformado y lo perdía en el correo. Una página se lee en cualquier lado, se
 * puede corregir sin reenviar nada, y termina donde tiene que terminar: en la
 * decisión.
 *
 * Muestra la FOTO guardada al enviarla, no el estado actual del presupuesto.
 * Lo que el cliente leyó y lo que acepta tienen que ser lo mismo.
 */

export const dynamic = 'force-dynamic';

type Params = Promise<{ token: string }>;

export const metadata: Metadata = {
  title: 'Tu propuesta | Silvano Puccini',
  robots: { index: false, follow: false },
};

const money = (value: number) => `USD ${Math.round(value).toLocaleString('es-AR')}`;

async function loadProposal(token: string) {
  const { data } = await getSupabaseAdmin()
    .from('leads')
    .select('propuesta_snapshot, propuesta_respuesta')
    .eq('propuesta_token', token)
    .maybeSingle();

  if (!data?.propuesta_snapshot) return null;
  return {
    doc: data.propuesta_snapshot as DiagnosisDoc,
    answered: (data.propuesta_respuesta as string | null) ?? null,
  };
}

export default async function PropuestaPage({ params }: { params: Params }) {
  const { token } = await params;
  const proposal = await loadProposal(token);

  // Un link vencido o inventado no dice qué pasó: no hay nada que filtrar.
  if (!proposal) notFound();

  const { doc, answered } = proposal;

  return (
    <main className="site-container max-w-3xl py-12 sm:py-16">
      <header className="border-b border-outline-ghost/10 pb-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand-primary">
          Propuesta de trabajo
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
          {doc.cliente}, esto es lo que propongo
        </h1>
        <p className="mt-3 text-sm text-text-tertiary">
          Preparada a partir de lo que hablamos. Si algo no coincide con lo que necesitás, decímelo y lo ajusto.
        </p>
      </header>

      {doc.problema && (
        <section className="mt-10">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-tertiary">
            Lo que detectamos
          </h2>
          <p className="mt-3 text-lg leading-8 text-text-primary">{doc.problema}</p>
        </section>
      )}

      {doc.solucion && (
        <section className="mt-9">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-tertiary">
            Lo que propongo
          </h2>
          <p className="mt-3 text-lg leading-8 text-text-primary">{doc.solucion}</p>
        </section>
      )}

      {doc.incluye.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold text-text-primary">Qué incluye</h2>
          <ul className="mt-5 space-y-3">
            {doc.incluye.map((item) => (
              <li
                key={item.titulo}
                className="surface-panel flex flex-wrap items-baseline justify-between gap-3 border border-outline-ghost/10 px-5 py-4"
              >
                <div className="max-w-xl">
                  <p className="text-base font-medium text-text-primary">{item.titulo}</p>
                  {item.detalle && (
                    <p className="mt-1 text-sm leading-6 text-text-secondary">{item.detalle}</p>
                  )}
                </div>
                <span className="font-mono text-sm text-text-tertiary">{item.horas} h</span>
              </li>
            ))}
          </ul>
          {doc.horas > 0 && (
            <p className="mt-3 text-sm text-text-tertiary">{doc.horas} horas de trabajo estimadas en total.</p>
          )}
        </section>
      )}

      {doc.masAdelante.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold text-text-primary">Para más adelante</h2>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            Esto no entra ahora, a propósito: primero resolvemos lo que te está costando plata hoy.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {doc.masAdelante.map((item) => (
              <li
                key={item}
                className="rounded-full border border-outline-ghost/15 px-4 py-1.5 text-sm text-text-secondary"
              >{item}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-text-primary">La inversión</h2>

        <div className="surface-panel mt-5 border border-brand-primary/20 bg-brand-primary/5 px-6 py-7">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-tertiary">Total del proyecto</p>
          <p className="mt-1 font-mono text-4xl font-semibold text-brand-primary">{money(doc.inversion.total)}</p>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-text-tertiary">Para arrancar ({doc.inversion.pct}%)</dt>
              <dd className="mt-1 font-mono text-lg text-text-primary">{money(doc.inversion.sena)}</dd>
            </div>
            {doc.inversion.saldo > 0 && (
              <div>
                <dt className="text-sm text-text-tertiary">Contra entrega</dt>
                <dd className="mt-1 font-mono text-lg text-text-primary">{money(doc.inversion.saldo)}</dd>
              </div>
            )}
          </dl>

          {doc.mantenimiento != null && (
            <p className="mt-6 border-t border-outline-ghost/10 pt-5 text-sm leading-6 text-text-secondary">
              <strong className="text-text-primary">Mantenimiento: {money(doc.mantenimiento)} por mes.</strong>{' '}
              Incluye hosting, actualizaciones de seguridad, copias de respaldo y cambios chicos. Es opcional y se
              puede dar de baja cuando quieras.
            </p>
          )}
        </div>
      </section>

      <section className="mt-12">
        <ProposalDecision token={token} answered={answered} />
      </section>

      <footer className="mt-10 border-t border-outline-ghost/10 pt-6 text-sm text-text-tertiary">
        ¿Dudas antes de decidir? Respondé el correo o escribime a{' '}
        <a href="mailto:hola@silvanopuccini.dev" className="text-brand-primary">hola@silvanopuccini.dev</a>.
      </footer>
    </main>
  );
}
