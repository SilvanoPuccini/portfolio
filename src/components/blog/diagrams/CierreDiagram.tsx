const pipeline = [
  {
    number: "01",
    name: "Planificación",
    code: "PLAN",
    support: "Especificaciones",
    tone: "cyan",
    items: [
      "Spec Principal 70%",
      "ecommerce [1/40]",
      "plan fable5",
      "opus5-gpt5.6sol",
      "Specs markdown files [70%]",
      "spec: crea la auth...",
    ],
  },
  {
    number: "02",
    name: "Implementación",
    code: "BUILD",
    support: "Claude Code",
    tone: "warm",
    items: ["TDD", "TEST", "DRIVEN", "DEVELOPMENT"],
  },
  {
    number: "03",
    name: "Testing",
    code: "VERIFY",
    support: "Frameworks Testing",
    tone: "fuchsia",
    items: ["Pruebas automatizadas", "Evidencia verificable"],
  },
  {
    number: "04",
    name: "Despliegue",
    code: "SHIP",
    support: "CLI Skills",
    tone: "cyan",
    items: ["Entrega controlada", "Infraestructura reproducible"],
  },
  {
    number: "05",
    name: "QA",
    code: "LEARN",
    support: "Monitoring",
    tone: "warm",
    items: ["Señales reales", "Hallazgos a planificación"],
  },
] as const;

export function CierreDiagram() {
  return (
    <figure className="cierre-map not-prose" aria-labelledby="cierre-map-title">
      <style>{`
        .cierre-map {
          --cierre-cyan: rgb(var(--brand-primary));
          --cierre-warm: rgb(var(--accent-warm));
          --cierre-fuchsia: #f0abfc;
          position: relative;
          isolation: isolate;
          width: 100%;
          min-width: 0;
          overflow: hidden;
          margin: 2.5rem 0;
          border: 1px solid rgb(var(--outline-ghost) / 0.18);
          border-radius: var(--radius-surface, 16px);
          background:
            radial-gradient(circle at 12% 0%, rgb(var(--brand-glow) / 0.11), transparent 28rem),
            radial-gradient(circle at 92% 22%, rgb(var(--accent-warm) / 0.07), transparent 22rem),
            rgb(var(--surface-dim) / 0.88);
          box-shadow: var(--shadow-ambient);
          color: rgb(var(--text-primary));
        }
        .cierre-map::before {
          position: absolute;
          inset: 0;
          z-index: -1;
          content: "";
          background-image:
            linear-gradient(rgb(var(--outline-ghost) / 0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgb(var(--outline-ghost) / 0.035) 1px, transparent 1px);
          background-size: 28px 28px;
          mask-image: linear-gradient(to bottom, black, transparent 88%);
        }
        .cierre-map__header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          padding: 1.25rem 1rem 1rem;
          border-bottom: 1px solid rgb(var(--outline-ghost) / 0.12);
        }
        .cierre-map__eyebrow,
        .cierre-map__status,
        .cierre-map__governance-label,
        .cierre-map__stage-code,
        .cierre-map__support-title,
        .cierre-map__feedback-label {
          font-family: var(--font-mono, monospace);
          text-transform: uppercase;
        }
        .cierre-map__eyebrow {
          margin: 0 0 0.35rem;
          color: var(--cierre-cyan);
          font-size: 0.625rem;
          font-weight: 700;
          letter-spacing: 0.2em;
        }
        .cierre-map__title {
          margin: 0;
          max-width: 25ch;
          font-size: clamp(1.05rem, 3.8vw, 1.45rem);
          font-weight: 650;
          line-height: 1.2;
          letter-spacing: -0.025em;
        }
        .cierre-map__status {
          display: none;
          align-items: center;
          flex: none;
          gap: 0.45rem;
          color: rgb(var(--text-tertiary));
          font-size: 0.625rem;
          letter-spacing: 0.14em;
          white-space: nowrap;
        }
        .cierre-map__status-dot {
          width: 0.45rem;
          height: 0.45rem;
          border-radius: 999px;
          background: var(--cierre-cyan);
          box-shadow: 0 0 12px rgb(var(--brand-glow) / 0.7);
        }
        .cierre-map__body {
          padding: 1rem;
        }
        .cierre-map__governance {
          position: relative;
          display: grid;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        .cierre-map__governance::after {
          position: absolute;
          bottom: -1rem;
          left: 50%;
          width: 1px;
          height: 1rem;
          content: "";
          background: linear-gradient(var(--cierre-cyan), transparent);
          opacity: 0.65;
        }
        .cierre-map__governance-card {
          min-width: 0;
          padding: 0.85rem;
          border: 1px solid rgb(var(--outline-ghost) / 0.17);
          border-radius: var(--radius-soft, 12px);
          background: rgb(var(--surface-elevated) / 0.72);
          box-shadow: inset 0 1px rgb(255 255 255 / 0.025);
        }
        .cierre-map__governance-card--adversarial {
          border-left: 2px solid var(--cierre-fuchsia);
        }
        .cierre-map__governance-card--system {
          border-left: 2px solid var(--cierre-cyan);
        }
        .cierre-map__governance-label {
          display: block;
          margin-bottom: 0.35rem;
          color: rgb(var(--text-tertiary));
          font-size: 0.5625rem;
          letter-spacing: 0.16em;
        }
        .cierre-map__governance-title {
          margin: 0;
          color: rgb(var(--text-primary));
          font-family: var(--font-mono, monospace);
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .cierre-map__governance-items {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          margin: 0.6rem 0 0;
          padding: 0;
          list-style: none;
        }
        .cierre-map__governance-items li {
          min-width: 0;
          padding: 0.3rem 0.45rem;
          border: 1px solid rgb(var(--outline-ghost) / 0.13);
          border-radius: 0.35rem;
          background: rgb(var(--surface-dim) / 0.68);
          color: rgb(var(--text-secondary));
          font-family: var(--font-mono, monospace);
          font-size: 0.6875rem;
          line-height: 1.35;
          overflow-wrap: anywhere;
        }
        .cierre-map__deployment-link {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          margin-top: 0.65rem;
          color: var(--cierre-cyan);
          font-family: var(--font-mono, monospace);
          font-size: 0.625rem;
          line-height: 1.4;
        }
        .cierre-map__deployment-link::before {
          width: 1.2rem;
          height: 1px;
          flex: none;
          content: "";
          background: currentColor;
          opacity: 0.65;
        }
        .cierre-map__pipeline {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 0;
          margin: 0;
          padding: 0;
          list-style: none;
          counter-reset: cierre-stage;
        }
        .cierre-map__stage {
          position: relative;
          min-width: 0;
          padding-bottom: 1.6rem;
        }
        .cierre-map__stage:last-child {
          padding-bottom: 0;
        }
        .cierre-map__stage-card {
          position: relative;
          min-width: 0;
          overflow: hidden;
          border: 1px solid rgb(var(--outline-ghost) / 0.17);
          border-radius: var(--radius-soft, 12px);
          background: linear-gradient(145deg, rgb(var(--surface-elevated) / 0.94), rgb(var(--surface-dim) / 0.8));
          box-shadow: inset 0 1px rgb(255 255 255 / 0.035);
        }
        .cierre-map__stage-card::before {
          position: absolute;
          inset: 0 auto 0 0;
          width: 2px;
          content: "";
          background: var(--stage-color);
        }
        .cierre-map__stage[data-tone="cyan"] { --stage-color: var(--cierre-cyan); }
        .cierre-map__stage[data-tone="warm"] { --stage-color: var(--cierre-warm); }
        .cierre-map__stage[data-tone="fuchsia"] { --stage-color: var(--cierre-fuchsia); }
        .cierre-map__stage-heading {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 0.7rem;
          padding: 0.8rem 0.85rem;
          border-bottom: 1px solid rgb(var(--outline-ghost) / 0.1);
        }
        .cierre-map__stage-number {
          display: grid;
          width: 1.8rem;
          height: 1.8rem;
          place-items: center;
          border: 1px solid color-mix(in srgb, var(--stage-color) 45%, transparent);
          border-radius: 999px;
          color: var(--stage-color);
          font-family: var(--font-mono, monospace);
          font-size: 0.625rem;
          font-weight: 700;
        }
        .cierre-map__stage-name {
          margin: 0;
          min-width: 0;
          font-size: 0.875rem;
          font-weight: 650;
          line-height: 1.2;
          overflow-wrap: anywhere;
        }
        .cierre-map__stage-code {
          color: rgb(var(--text-tertiary));
          font-size: 0.5rem;
          letter-spacing: 0.12em;
        }
        .cierre-map__support {
          padding: 0.8rem 0.85rem 0.9rem;
        }
        .cierre-map__support-title {
          display: block;
          margin-bottom: 0.65rem;
          color: var(--stage-color);
          font-size: 0.625rem;
          font-weight: 700;
          letter-spacing: 0.11em;
          line-height: 1.35;
          overflow-wrap: anywhere;
        }
        .cierre-map__support-items {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
          margin: 0;
          padding: 0;
          list-style: none;
        }
        .cierre-map__support-items li {
          min-width: 0;
          padding: 0.3rem 0.42rem;
          border: 1px solid rgb(var(--outline-ghost) / 0.12);
          border-radius: 0.35rem;
          background: rgb(var(--surface-dim) / 0.58);
          color: rgb(var(--text-secondary));
          font-family: var(--font-mono, monospace);
          font-size: 0.625rem;
          line-height: 1.35;
          overflow-wrap: anywhere;
        }
        .cierre-map__stage-link {
          position: absolute;
          bottom: 0.25rem;
          left: 50%;
          display: grid;
          width: 1.1rem;
          height: 1.1rem;
          place-items: center;
          translate: -50% 0;
          color: var(--cierre-cyan);
          font-family: var(--font-mono, monospace);
          font-size: 0.85rem;
          opacity: 0.72;
        }
        .cierre-map__feedback {
          position: relative;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          gap: 0.8rem;
          margin-top: 1rem;
          padding: 0.85rem;
          border: 1px dashed rgb(var(--brand-primary) / 0.34);
          border-radius: var(--radius-soft, 12px);
          background: rgb(var(--brand-glow) / 0.055);
        }
        .cierre-map__feedback-icon {
          display: grid;
          width: 1.8rem;
          height: 1.8rem;
          place-items: center;
          border-radius: 999px;
          background: rgb(var(--brand-primary) / 0.12);
          color: var(--cierre-cyan);
          font-size: 1rem;
        }
        .cierre-map__feedback-label {
          display: block;
          margin-bottom: 0.25rem;
          color: var(--cierre-cyan);
          font-size: 0.5625rem;
          font-weight: 700;
          letter-spacing: 0.16em;
        }
        .cierre-map__feedback p {
          margin: 0;
          color: rgb(var(--text-secondary));
          font-size: 0.75rem;
          line-height: 1.55;
        }
        @media (min-width: 640px) {
          .cierre-map__header { padding: 1.5rem 1.5rem 1.15rem; }
          .cierre-map__status { display: flex; }
          .cierre-map__body { padding: 1.25rem 1.5rem 1.5rem; }
          .cierre-map__governance { grid-template-columns: minmax(0, 0.82fr) minmax(0, 1.18fr); }
        }
        @media (min-width: 768px) {
          .cierre-map__body { padding-top: 1.5rem; }
          .cierre-map__governance {
            grid-template-columns: repeat(5, minmax(0, 1fr));
            align-items: stretch;
            gap: 0.55rem;
            margin-bottom: 1.3rem;
          }
          .cierre-map__governance::after {
            right: 30%;
            left: auto;
            bottom: -1.3rem;
            height: 1.3rem;
          }
          .cierre-map__governance-card--adversarial { grid-column: 2 / span 2; }
          .cierre-map__governance-card--system { grid-column: 4 / span 2; }
          .cierre-map__pipeline {
            grid-template-columns: repeat(5, minmax(0, 1fr));
            gap: 0.55rem;
          }
          .cierre-map__stage,
          .cierre-map__stage:last-child {
            display: flex;
            min-width: 0;
            padding: 0;
          }
          .cierre-map__stage-card {
            width: 100%;
          }
          .cierre-map__stage-card::before {
            inset: 0 0 auto;
            width: auto;
            height: 2px;
          }
          .cierre-map__stage-heading {
            grid-template-columns: auto minmax(0, 1fr);
            gap: 0.45rem;
            padding: 0.75rem 0.6rem 0.65rem;
          }
          .cierre-map__stage-number {
            width: 1.55rem;
            height: 1.55rem;
            font-size: 0.5625rem;
          }
          .cierre-map__stage-name { font-size: 0.75rem; }
          .cierre-map__stage-code {
            grid-column: 1 / -1;
            padding-left: 2rem;
          }
          .cierre-map__support { padding: 0.7rem 0.6rem 0.8rem; }
          .cierre-map__support-title {
            min-height: 2.6em;
            font-size: 0.625rem;
          }
          .cierre-map__support-items { gap: 0.3rem; }
          .cierre-map__support-items li {
            width: 100%;
            padding: 0.28rem 0.35rem;
            font-size: 0.625rem;
          }
          .cierre-map__stage-link {
            top: 50%;
            right: -0.83rem;
            bottom: auto;
            left: auto;
            z-index: 2;
            translate: 0 -50%;
            transform: rotate(-90deg);
            text-shadow: 0 0 8px rgb(var(--surface-dim));
          }
          .cierre-map__feedback {
            grid-template-columns: auto minmax(0, 1fr) auto;
            align-items: center;
          }
          .cierre-map__feedback::after {
            content: "05 QA  →  01 PLANIFICACIÓN";
            color: var(--cierre-cyan);
            font-family: var(--font-mono, monospace);
            font-size: 0.5625rem;
            letter-spacing: 0.12em;
          }
        }
        @media (min-width: 1024px) {
          .cierre-map__pipeline,
          .cierre-map__governance { gap: 0.7rem; }
          .cierre-map__stage-heading { padding-inline: 0.75rem; }
          .cierre-map__support { padding-inline: 0.75rem; }
          .cierre-map__stage-name { font-size: 0.8125rem; }
        }
        @media (prefers-reduced-motion: reduce) {
          .cierre-map *,
          .cierre-map *::before,
          .cierre-map *::after {
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>

      <header className="cierre-map__header">
        <div>
          <p className="cierre-map__eyebrow">Sistema de entrega continua</p>
          <h3 id="cierre-map-title" className="cierre-map__title">
            Del plan a producción, con evidencia en cada etapa
          </h3>
        </div>
        <span className="cierre-map__status" aria-hidden="true">
          <span className="cierre-map__status-dot" />
          Ciclo activo
        </span>
      </header>

      <div className="cierre-map__body">
        <section className="cierre-map__governance" aria-label="Gobernanza y revisión transversal">
          <article className="cierre-map__governance-card cierre-map__governance-card--adversarial">
            <span className="cierre-map__governance-label">Control adversarial</span>
            <h4 className="cierre-map__governance-title">Testing Adversarial</h4>
            <ul className="cierre-map__governance-items">
              <li>claude</li>
              <li>2-3 GPT</li>
            </ul>
          </article>

          <article className="cierre-map__governance-card cierre-map__governance-card--system">
            <span className="cierre-map__governance-label">Gobernanza técnica</span>
            <h4 className="cierre-map__governance-title">Design System</h4>
            <ul className="cierre-map__governance-items">
              <li>Contenedor</li>
              <li>Redes y seg.</li>
              <li>CI/CD | Budget</li>
            </ul>
            <div className="cierre-map__deployment-link">Conecta con 04 · Despliegue</div>
          </article>
        </section>

        <ol className="cierre-map__pipeline" aria-label="Pipeline principal de desarrollo">
          {pipeline.map((stage, index) => (
            <li key={stage.name} className="cierre-map__stage" data-tone={stage.tone}>
              <article className="cierre-map__stage-card">
                <header className="cierre-map__stage-heading">
                  <span className="cierre-map__stage-number" aria-hidden="true">{stage.number}</span>
                  <h4 className="cierre-map__stage-name">{stage.name}</h4>
                  <span className="cierre-map__stage-code" aria-hidden="true">{stage.code}</span>
                </header>
                <div className="cierre-map__support">
                  <strong className="cierre-map__support-title">{stage.support}</strong>
                  <ul className="cierre-map__support-items">
                    {stage.items.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              </article>
              {index < pipeline.length - 1 ? (
                <span className="cierre-map__stage-link" aria-hidden="true">↓</span>
              ) : null}
            </li>
          ))}
        </ol>

        <aside className="cierre-map__feedback" aria-label="Bucle de retroalimentación continua">
          <span className="cierre-map__feedback-icon" aria-hidden="true">↶</span>
          <div>
            <span className="cierre-map__feedback-label">Iteración continua</span>
            <p>Monitoring convierte los hallazgos de QA en nuevas decisiones de planificación.</p>
          </div>
        </aside>
      </div>
    </figure>
  );
}
