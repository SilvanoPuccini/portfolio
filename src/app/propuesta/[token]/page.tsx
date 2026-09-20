import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getSupabaseAdmin } from '@/lib/supabase';
import Reveal, { RevealGroup } from '@/components/site/Reveal';
import { ProposalDecision } from '@/components/propuesta/ProposalDecision';
import { ContractStep } from '@/components/propuesta/ContractStep';
import type { DiagnosisDoc } from '@/lib/leads/diagnosis-doc';

/**
 * El diagnóstico y la propuesta, como los ve el cliente.
 *
 * Antes era un .docx adjunto: se abría deformado en el celular y se perdía en
 * el correo. Esto es una página del sitio —mismo tipo, mismo motion, mismos
 * colores—, porque el documento que cierra una venta de software es la primera
 * muestra del trabajo. Si la propuesta se ve mal, el argumento ya perdió.
 *
 * Muestra la FOTO guardada al enviarla, no el estado actual del presupuesto:
 * lo que el cliente leyó y lo que acepta tienen que ser lo mismo.
 */

export const dynamic = 'force-dynamic';

type Params = Promise<{ token: string }>;

export const metadata: Metadata = {
  title: 'Tu propuesta | Silvano Puccini',
  robots: { index: false, follow: false },
};

const money = (value: number) => `USD ${Math.round(value).toLocaleString('es-AR')}`;

/** Los cuatro pasos, para que se vea desde el principio lo que falta. */
const STEPS = ['Leer', 'Firmar', 'Pagar la seña', 'Arrancamos'];

async function loadProposal(token: string) {
  const { data } = await getSupabaseAdmin()
    .from('leads')
    .select('propuesta_snapshot, propuesta_respuesta, contrato_firma_token, contrato_signing_url')
    .eq('propuesta_token', token)
    .maybeSingle();

  if (!data?.propuesta_snapshot) return null;
  return {
    doc: data.propuesta_snapshot as DiagnosisDoc,
    answered: (data.propuesta_respuesta as string | null) ?? null,
    firma: {
      token: (data.contrato_firma_token as string | null) ?? null,
      url: (data.contrato_signing_url as string | null) ?? null,
    },
  };
}

export default async function PropuestaPage({ params }: { params: Params }) {
  const { token } = await params;
  const proposal = await loadProposal(token);

  // Un link vencido o inventado no dice qué pasó: no hay nada que filtrar.
  if (!proposal) notFound();

  const { doc, answered, firma } = proposal;
  const firmado = answered === 'aceptada';
  // El paso encendido sale del estado real, no de haber scrolleado.
  const pasoActual = firmado ? 1 : 0;

  return (
    <main className="pb-24">
      {/* ── Portada ───────────────────────────────────────────────── */}
      <header className="relative overflow-hidden border-b border-outline-ghost/10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-40 h-[26rem] bg-[radial-gradient(60%_60%_at_50%_50%,rgb(var(--brand-glow)/0.16),transparent_70%)]"
        />
        <div className="site-container relative max-w-4xl py-16 sm:py-20">
          <RevealGroup>
            <Reveal as="p" className="eyebrow">Propuesta de trabajo</Reveal>
            <Reveal className="mt-4">
              <h1 className="text-balance font-display text-4xl leading-[1.06] tracking-editorial text-text-primary sm:text-5xl lg:text-6xl">
                {doc.cliente}, esto es lo que propongo
              </h1>
            </Reveal>
            <Reveal as="p" className="mt-5 max-w-2xl text-base leading-8 text-text-secondary sm:text-lg">
              Salió de lo que hablamos en la llamada. Si algo no coincide con lo que necesitás, decímelo y lo ajusto:
              todavía estamos a tiempo de cambiarlo.
            </Reveal>

            {/* Los pasos, para que sepa desde el principio qué sigue. */}
            <Reveal as="ul" className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-2">
              {STEPS.map((step, i) => (
                <li key={step} className="flex items-center gap-3">
                  <span
                    className={`flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] ${
                      i === pasoActual ? 'text-brand-primary' : 'text-text-tertiary'
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${
                        i === pasoActual ? 'border-brand-primary/50 bg-brand-primary/10'
                          : i < pasoActual ? 'border-brand-primary/25 text-brand-primary/70'
                          : 'border-outline-ghost/20'
                      }`}
                    >{i + 1}</span>
                    {step}
                  </span>
                  {i < STEPS.length - 1 && <span aria-hidden className="text-outline-ghost/40">·</span>}
                </li>
              ))}
            </Reveal>
          </RevealGroup>
        </div>
      </header>

      <div className="site-container max-w-4xl">
        {/* ── El diagnóstico ──────────────────────────────────────── */}
        {(doc.problema || doc.solucion) && (
          <RevealGroup className="mt-16 grid gap-10 sm:mt-20 sm:grid-cols-2">
            {doc.problema && (
              <Reveal className="border-l-2 border-outline-ghost/20 pl-6">
                <p className="technical-label">Lo que detectamos</p>
                <p className="mt-4 text-xl leading-9 text-text-primary">{doc.problema}</p>
              </Reveal>
            )}
            {doc.solucion && (
              <Reveal className="border-l-2 border-brand-primary/60 pl-6">
                <p className="technical-label text-brand-primary">Lo que propongo</p>
                <p className="mt-4 text-xl leading-9 text-text-primary">{doc.solucion}</p>
              </Reveal>
            )}
          </RevealGroup>
        )}

        {/* ── Qué incluye ─────────────────────────────────────────── */}
        {doc.incluye.length > 0 && (
          <section className="mt-20 sm:mt-24">
            <Reveal><h2 className="section-title-sm">Qué incluye</h2></Reveal>
            <RevealGroup className="mt-8 grid gap-3">
              {doc.incluye.map((item) => (
                <Reveal
                  key={item.titulo}
                  as="article"
                  className="surface-panel group flex flex-wrap items-baseline justify-between gap-4 border border-outline-ghost/10 px-6 py-5 transition-colors hover:border-brand-primary/30"
                >
                  <div className="max-w-xl">
                    <h3 className="text-lg font-medium text-text-primary">{item.titulo}</h3>
                    {item.detalle && (
                      <p className="mt-1.5 text-sm leading-6 text-text-secondary">{item.detalle}</p>
                    )}
                  </div>
                  <span className="font-mono text-sm text-text-tertiary">{item.horas} h</span>
                </Reveal>
              ))}
            </RevealGroup>
            {doc.horas > 0 && (
              <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-text-tertiary">
                {doc.horas} horas de trabajo estimadas
              </p>
            )}
          </section>
        )}

        {/* ── Para más adelante ───────────────────────────────────── */}
        {doc.masAdelante.length > 0 && (
          <section className="mt-16">
            <Reveal>
              <h2 className="section-title-sm">Para más adelante</h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-text-secondary">
                Esto queda afuera a propósito. Primero resolvemos lo que te está costando plata hoy; lo demás se suma
                cuando el sistema ya esté funcionando.
              </p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {doc.masAdelante.map((item) => (
                  <li
                    key={item}
                    className="rounded-full border border-outline-ghost/15 px-4 py-1.5 text-sm text-text-secondary"
                  >{item}</li>
                ))}
              </ul>
            </Reveal>
          </section>
        )}

        {/* ── La inversión ────────────────────────────────────────── */}
        <section className="mt-20 sm:mt-24">
          <Reveal><h2 className="section-title-sm">La inversión</h2></Reveal>

          <Reveal className="surface-panel relative mt-8 overflow-hidden border border-brand-primary/25 px-7 py-9 sm:px-10">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgb(var(--brand-primary)/0.6),transparent)]"
            />
            <p className="technical-label">Total del proyecto</p>
            <p className="mt-2 font-mono text-5xl font-semibold tracking-tight text-brand-primary sm:text-6xl">
              {money(doc.inversion.total)}
            </p>

            <dl className="mt-9 grid gap-6 border-t border-outline-ghost/10 pt-7 sm:grid-cols-2">
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-tertiary">
                  Para arrancar · {doc.inversion.pct}%
                </dt>
                <dd className="mt-2 font-mono text-2xl text-text-primary">{money(doc.inversion.sena)}</dd>
              </div>
              {doc.inversion.saldo > 0 && (
                <div>
                  <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-tertiary">
                    Contra entrega
                  </dt>
                  <dd className="mt-2 font-mono text-2xl text-text-primary">{money(doc.inversion.saldo)}</dd>
                </div>
              )}
            </dl>

            {doc.mantenimiento != null && (
              <p className="mt-7 border-t border-outline-ghost/10 pt-6 text-sm leading-7 text-text-secondary">
                <strong className="font-medium text-text-primary">
                  Mantenimiento: {money(doc.mantenimiento)} por mes.
                </strong>{' '}
                Hosting, actualizaciones de seguridad, copias de respaldo y cambios chicos. Es opcional y se da de baja
                cuando quieras.
              </p>
            )}
          </Reveal>
        </section>

        {/* ── La decisión ─────────────────────────────────────────── */}
        {/* Aceptó: lo que toca ya no es decidir, es firmar. */}
        <section id="decidir" className="mt-20 scroll-mt-10 sm:mt-24">
          {firmado
            ? <ContractStep token={firma.token} signingUrl={firma.url} />
            : <ProposalDecision token={token} answered={answered} />}
        </section>

        <footer className="mt-14 border-t border-outline-ghost/10 pt-7 text-sm leading-7 text-text-tertiary">
          ¿Dudas antes de decidir? Respondé el correo o escribime a{' '}
          <a href="mailto:hola@silvanopuccini.dev" className="text-brand-primary hover:underline">
            hola@silvanopuccini.dev
          </a>
          . Prefiero una pregunta ahora que un malentendido en la entrega.
        </footer>
      </div>

      {/* Barra fija: el precio y el botón siempre a mano, sin scrollear. */}
      {!firmado && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-outline-ghost/10 bg-[rgb(var(--background)/0.92)] backdrop-blur">
          <div className="site-container flex max-w-4xl items-center justify-between gap-4 py-3">
            <span className="font-mono text-sm text-text-secondary">
              {money(doc.inversion.total)}
              <span className="hidden text-text-tertiary sm:inline"> · seña {money(doc.inversion.sena)}</span>
            </span>
            <a href="#decidir" className="button-primary px-5 py-2 text-sm">Decidir</a>
          </div>
        </div>
      )}
    </main>
  );
}
