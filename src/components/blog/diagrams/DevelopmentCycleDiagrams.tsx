"use client";

import { useId, useState } from "react";

const stages = [
  {
    name: "Planificación",
    position: "left-1/2 top-[2%] -translate-x-1/2",
    decision: "Convertir una necesidad ambigua en objetivo, alcance y criterios verificables.",
    ai: "Ordenar preguntas, redactar historias y detectar vacíos.",
    evidence: "Especificación revisada y definición de terminado.",
  },
  {
    name: "Diseño",
    position: "right-[1%] top-[24%]",
    decision: "Elegir arquitectura, datos, límites, seguridad y costo.",
    ai: "Comparar alternativas, exponer trade-offs y producir diagramas.",
    evidence: "Arquitectura aprobada y decisiones registradas.",
  },
  {
    name: "Código",
    position: "right-[1%] bottom-[24%]",
    decision: "Dirigir y revisar la implementación dentro del contexto.",
    ai: "Implementar tareas acotadas, refactorizar y documentar.",
    evidence: "Diff revisable, dependencias justificadas y criterios cumplidos.",
  },
  {
    name: "Test",
    position: "bottom-[2%] left-1/2 -translate-x-1/2",
    decision: "Definir el comportamiento esperado y los casos límite.",
    ai: "Generar pruebas, ejecutarlas y buscar supuestos incorrectos.",
    evidence: "Resultados reproducibles contra criterios independientes del código.",
  },
  {
    name: "Deploy",
    position: "bottom-[24%] left-[1%]",
    decision: "Aprobar entornos, secretos, migraciones, costos y rollback.",
    ai: "Preparar pipelines, configuración e infraestructura automatizada.",
    evidence: "Release trazable, monitoreable y recuperable.",
  },
  {
    name: "QA",
    position: "left-[1%] top-[24%]",
    decision: "Evaluar la calidad operativa y decidir el aprendizaje.",
    ai: "Agrupar logs, detectar patrones y priorizar incidentes.",
    evidence: "Feedback real que actualiza planificación, diseño y especificación.",
  },
] as const;

function ArrowMarker({ id, color }: { id: string; color: string }) {
  return (
    <marker id={id} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
    </marker>
  );
}

export function DevelopmentCycleDiagram() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const idPrefix = useId().replaceAll(":", "");
  const cycleArrowId = `${idPrefix}-cycle-arrow`;
  const returnArrowId = `${idPrefix}-return-arrow`;
  const haloId = `${idPrefix}-cycle-halo`;
  const selected = stages[selectedIndex];

  return (
    <figure className="not-prose my-10" aria-labelledby="development-cycle-title">
      <style>{`@media (prefers-reduced-motion: reduce) { :root { scroll-behavior: auto; } }`}</style>
      <div className="overflow-hidden rounded-[var(--radius-surface)] border border-outline-ghost/15 bg-surface-dim/80 p-3 shadow-ambient sm:p-7">
        <div className="flex items-center justify-between gap-4 px-1">
          <figcaption id="development-cycle-title" className="font-mono text-[10px] uppercase tracking-[0.2em] text-brand-primary sm:text-xs">
            Ciclo de desarrollo asistido por IA
          </figcaption>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-text-tertiary sm:block">
            Seleccioná una etapa
          </span>
        </div>

        <div className="relative mx-auto mt-5 aspect-square w-full max-w-[620px]">
          <div className="pointer-events-none absolute inset-[14%] rounded-full border border-brand-primary/15 shadow-[0_0_55px_rgb(var(--brand-glow)/0.08)]" />
          <div className="pointer-events-none absolute inset-[26%] rounded-full border border-dashed border-outline-ghost/15" />

          <svg className="pointer-events-none absolute inset-[9%] h-[82%] w-[82%]" viewBox="0 0 500 500" aria-hidden="true">
            <defs>
              <ArrowMarker id={cycleArrowId} color="rgb(var(--brand-primary))" />
              <ArrowMarker id={returnArrowId} color="rgb(var(--accent-warm))" />
              <radialGradient id={haloId}>
                <stop offset="0" stopColor="rgb(var(--brand-secondary))" stopOpacity="0.16" />
                <stop offset="1" stopColor="rgb(var(--brand-secondary))" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="250" cy="250" r="112" fill={`url(#${haloId})`} />
            <path d="M282 53 A202 202 0 0 1 421 154" fill="none" stroke="rgb(var(--brand-primary))" strokeOpacity="0.52" strokeWidth="2" markerEnd={`url(#${cycleArrowId})`} />
            <path d="M447 196 A202 202 0 0 1 447 348" fill="none" stroke="rgb(var(--brand-primary))" strokeOpacity="0.52" strokeWidth="2" markerEnd={`url(#${cycleArrowId})`} />
            <path d="M421 387 A202 202 0 0 1 282 447" fill="none" stroke="rgb(var(--brand-primary))" strokeOpacity="0.52" strokeWidth="2" markerEnd={`url(#${cycleArrowId})`} />
            <path d="M218 447 A202 202 0 0 1 79 348" fill="none" stroke="rgb(var(--brand-primary))" strokeOpacity="0.52" strokeWidth="2" markerEnd={`url(#${cycleArrowId})`} />
            <path d="M53 304 A202 202 0 0 1 79 154" fill="none" stroke="rgb(var(--brand-primary))" strokeOpacity="0.52" strokeWidth="2" markerEnd={`url(#${cycleArrowId})`} />
            <path d="M96 112 Q166 25 226 51" fill="none" stroke="rgb(var(--accent-warm))" strokeWidth="3" markerEnd={`url(#${returnArrowId})`} />
            <text x="89" y="72" fill="rgb(var(--accent-warm))" fontSize="11" fontFamily="monospace" letterSpacing="1">RETORNO</text>
          </svg>

          <div className="absolute left-1/2 top-1/2 flex h-[27%] w-[27%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-brand-secondary/35 bg-surface-elevated/95 text-center shadow-[0_0_35px_rgb(var(--brand-secondary)/0.16)]">
            <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-text-tertiary sm:text-[10px]">Origen</span>
            <strong className="mt-1 max-w-[8ch] text-[11px] leading-tight text-text-primary sm:text-base">Problema real</strong>
          </div>

          {stages.map((stage, index) => (
            <button
              key={stage.name}
              type="button"
              aria-pressed={selectedIndex === index}
              aria-controls="cycle-stage-detail"
              onClick={() => setSelectedIndex(index)}
              className={`absolute z-10 flex min-h-11 w-[31%] max-w-[132px] items-center justify-center rounded-full border px-1 py-2 text-center font-mono text-[10px] font-semibold uppercase leading-tight tracking-[0.04em] transition duration-200 motion-reduce:duration-0 motion-reduce:transition-none sm:min-h-14 sm:w-[29%] sm:px-3 sm:text-xs sm:tracking-[0.08em] ${stage.position} ${
                selectedIndex === index
                  ? "border-brand-primary bg-brand-primary text-slate-950 shadow-[0_0_24px_rgb(var(--brand-glow)/0.22)]"
                  : "border-outline-ghost/25 bg-surface-elevated text-text-secondary hover:border-brand-primary/55 hover:text-text-primary"
              }`}
            >
              {stage.name}
            </button>
          ))}
        </div>

        <div className="mx-auto -mt-1 flex w-fit items-center gap-2 rounded-full border border-outline-ghost/15 bg-surface-elevated/70 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-text-secondary sm:text-[11px]">
          <span className="h-2 w-2 rounded-full bg-brand-primary shadow-[0_0_10px_rgb(var(--brand-glow)/0.7)]" aria-hidden="true" />
          La IA asiste en todo el circuito
        </div>

        <div id="cycle-stage-detail" aria-live="polite" className="mt-5 rounded-[var(--radius-soft)] border border-outline-ghost/15 bg-surface-elevated/65 p-4 sm:p-5">
          <div className="flex items-center gap-3 border-b border-outline-ghost/10 pb-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-brand-primary">Etapa {selectedIndex + 1}/6</span>
            <strong className="text-sm text-text-primary sm:text-base">{selected.name}</strong>
          </div>
          <dl className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-amber-400">Decisión humana</dt>
              <dd className="mt-1.5 text-sm leading-6 text-text-secondary">{selected.decision}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-primary">Cómo ayuda la IA</dt>
              <dd className="mt-1.5 text-sm leading-6 text-text-secondary">{selected.ai}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-fuchsia-300">Evidencia</dt>
              <dd className="mt-1.5 text-sm leading-6 text-text-secondary">{selected.evidence}</dd>
            </div>
          </dl>
        </div>

        <p className="mb-0 mt-4 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-text-secondary">
          La IA acelera. El criterio humano decide.
        </p>
      </div>
    </figure>
  );
}

function FlowArrow({ vertical = false }: { vertical?: boolean }) {
  return (
    <div className={`relative shrink-0 ${vertical ? "h-12 w-px md:hidden" : "hidden h-px w-12 md:block"}`} aria-hidden="true">
      <span className="absolute inset-0 bg-gradient-to-r from-amber-400/70 to-fuchsia-400/70" />
      <span className={`absolute border-amber-300 ${vertical ? "-bottom-0.5 -left-[3px] border-x-4 border-t-8 border-x-transparent" : "-right-0.5 -top-[3px] border-y-4 border-l-8 border-y-transparent"}`} />
    </div>
  );
}

export function TestingQaDiagram() {
  return (
    <figure className="not-prose my-10" aria-labelledby="testing-qa-title">
      <div className="overflow-hidden rounded-[var(--radius-surface)] border border-outline-ghost/15 bg-surface-dim/80 p-4 shadow-ambient sm:p-7">
        <figcaption id="testing-qa-title" className="font-mono text-[10px] uppercase tracking-[0.2em] text-brand-primary sm:text-xs">
          De comprobar a aprender
        </figcaption>

        <div className="mt-6 flex flex-col items-center md:flex-row">
          <section className="relative w-full flex-1 overflow-hidden rounded-[var(--radius-soft)] border border-amber-400/30 bg-surface-elevated/80 p-5 sm:p-6">
            <div className="absolute inset-y-0 left-0 w-1 bg-amber-400" aria-hidden="true" />
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber-400">Testing</p>
            <h3 className="mt-3 text-lg font-semibold leading-snug text-text-primary">¿La implementación cumple lo especificado?</h3>
            <dl className="mt-5 space-y-4">
              <div>
                <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-text-tertiary">Contexto</dt>
                <dd className="mt-1 text-sm leading-6 text-text-secondary">Comportamiento, criterios, unidades, integraciones y flujos.</dd>
              </div>
              <div>
                <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-text-tertiary">Resultado</dt>
                <dd className="mt-1 text-sm font-medium leading-6 text-amber-200">Evidencia antes de confiar.</dd>
              </div>
            </dl>
          </section>

          <FlowArrow vertical />
          <FlowArrow />

          <section className="relative w-full flex-1 overflow-hidden rounded-[var(--radius-soft)] border border-fuchsia-400/30 bg-surface-elevated/80 p-5 sm:p-6">
            <div className="absolute inset-y-0 left-0 w-1 bg-fuchsia-400" aria-hidden="true" />
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-fuchsia-300">QA</p>
            <h3 className="mt-3 text-lg font-semibold leading-snug text-text-primary">¿El producto puede operar con calidad en un contexto real?</h3>
            <dl className="mt-5 space-y-4">
              <div>
                <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-text-tertiary">Contexto</dt>
                <dd className="mt-1 text-sm leading-6 text-text-secondary">Usuarios, datos inesperados, latencia, seguridad, costos, logs y experiencia.</dd>
              </div>
              <div>
                <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-text-tertiary">Resultado</dt>
                <dd className="mt-1 text-sm font-medium leading-6 text-fuchsia-200">Aprendizaje que vuelve a planificación.</dd>
              </div>
            </dl>
          </section>
        </div>

        <div className="mx-auto mt-5 flex w-fit items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-amber-200">
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true">
            <path d="M15 2H5a4 4 0 0 0-4 4 4 4 0 0 0 4 4h3" stroke="currentColor" strokeWidth="1.5" />
            <path d="m6 7 3 3-3 3" transform="translate(0 -3)" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          Nueva planificación
        </div>
      </div>
    </figure>
  );
}
