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
    items: [],
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

function AdversarialBridge({ mobile = false }: { mobile?: boolean }) {
  return (
    <section
      className={`cierre-map__bridge cierre-map__bridge--adversarial${mobile ? " cierre-map__mobile-module" : " cierre-map__desktop-module"}`}
      aria-label="Intercambio de control adversarial entre Implementación y Testing"
    >
      <span className="cierre-map__connector cierre-map__connector--left" aria-hidden="true">↖</span>
      <div>
        <span className="cierre-map__module-label">Control adversarial</span>
        <h5>Testing Adversarial</h5>
      </div>
      <ul>
        <li>claude</li>
        <li>2-3 GPT</li>
      </ul>
      <span className="cierre-map__connector cierre-map__connector--right" aria-hidden="true">↘</span>
    </section>
  );
}

function DesignSystem({ mobile = false }: { mobile?: boolean }) {
  return (
    <section
      className={`cierre-map__design-system${mobile ? " cierre-map__mobile-module" : " cierre-map__desktop-module"}`}
      aria-label="Design System conectado con Testing"
    >
      <span className="cierre-map__module-label">Gobernanza técnica</span>
      <h5>Design System</h5>
      <ul>
        <li>Contenedor</li>
        <li>Redes y seg.</li>
        <li>CI/CD | Budget</li>
      </ul>
      <span className="cierre-map__vertical-link" aria-hidden="true">↓</span>
    </section>
  );
}

function MethodologyBridge({ mobile = false }: { mobile?: boolean }) {
  return (
    <section
      className={`cierre-map__bridge cierre-map__bridge--methodology${mobile ? " cierre-map__mobile-module" : " cierre-map__desktop-module"}`}
      aria-label="Intercambio continuo entre Claude Code y Frameworks Testing mediante TDD"
    >
      <span className="cierre-map__connector cierre-map__connector--left" aria-hidden="true">↔</span>
      <div className="cierre-map__methodology-words">
        <strong>TDD</strong>
        <span>TEST</span>
        <span>DRIVEN</span>
        <span>DEVELOPMENT</span>
      </div>
      <span className="cierre-map__connector cierre-map__connector--right" aria-hidden="true">↔</span>
    </section>
  );
}

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
            radial-gradient(circle at 13% 4%, rgb(var(--brand-glow) / 0.12), transparent 27rem),
            radial-gradient(circle at 84% 24%, rgb(var(--accent-warm) / 0.075), transparent 22rem),
            rgb(var(--surface-dim) / 0.9);
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
          mask-image: linear-gradient(to bottom, black, transparent 90%);
        }
        .cierre-map__header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          padding: 1.35rem 1rem 1.05rem;
          border-bottom: 1px solid rgb(var(--outline-ghost) / 0.12);
        }
        .cierre-map__eyebrow,
        .cierre-map__status,
        .cierre-map__module-label,
        .cierre-map__stage-code,
        .cierre-map__support-title,
        .cierre-map__feedback-label {
          font-family: var(--font-mono, monospace);
          text-transform: uppercase;
        }
        .cierre-map__eyebrow {
          margin: 0 0 0.4rem;
          color: var(--cierre-cyan);
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.16em;
        }
        .cierre-map__title {
          margin: 0;
          max-width: 28ch;
          font-size: clamp(1.2rem, 4.5vw, 1.65rem);
          font-weight: 680;
          line-height: 1.18;
          letter-spacing: -0.025em;
        }
        .cierre-map__status {
          display: none;
          align-items: center;
          flex: none;
          gap: 0.45rem;
          color: rgb(var(--text-tertiary));
          font-size: 0.68rem;
          letter-spacing: 0.13em;
          white-space: nowrap;
        }
        .cierre-map__status-dot {
          width: 0.5rem;
          height: 0.5rem;
          border-radius: 999px;
          background: var(--cierre-cyan);
          box-shadow: 0 0 12px rgb(var(--brand-glow) / 0.7);
        }
        .cierre-map__body {
          min-width: 0;
          padding: 1.15rem 1rem 1.35rem;
        }
        .cierre-map__desktop-module { display: none; }
        .cierre-map__mobile-module { display: grid; }
        .cierre-map__pipeline {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 0;
          margin: 0;
          padding: 0;
          list-style: none;
        }
        .cierre-map__stage {
          position: relative;
          min-width: 0;
          padding-bottom: 1.8rem;
        }
        .cierre-map__stage:last-child { padding-bottom: 0; }
        .cierre-map__stage-card {
          position: relative;
          min-width: 0;
          overflow: hidden;
          border: 1px solid rgb(var(--outline-ghost) / 0.18);
          border-radius: var(--radius-soft, 12px);
          background: linear-gradient(145deg, rgb(var(--surface-elevated) / 0.96), rgb(var(--surface-dim) / 0.82));
          box-shadow: inset 0 1px rgb(255 255 255 / 0.04), 0 12px 35px rgb(0 0 0 / 0.08);
        }
        .cierre-map__stage-card::before {
          position: absolute;
          inset: 0 auto 0 0;
          width: 3px;
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
          padding: 0.9rem;
          border-bottom: 1px solid rgb(var(--outline-ghost) / 0.1);
        }
        .cierre-map__stage-number {
          display: grid;
          width: 2rem;
          height: 2rem;
          place-items: center;
          border: 1px solid color-mix(in srgb, var(--stage-color) 48%, transparent);
          border-radius: 999px;
          color: var(--stage-color);
          font-family: var(--font-mono, monospace);
          font-size: 0.72rem;
          font-weight: 750;
        }
        .cierre-map__stage-name {
          margin: 0;
          min-width: 0;
          font-size: 1.05rem;
          font-weight: 700;
          line-height: 1.15;
          overflow-wrap: anywhere;
        }
        .cierre-map__stage-code {
          color: rgb(var(--text-tertiary));
          font-size: 0.62rem;
          letter-spacing: 0.11em;
        }
        .cierre-map__support { padding: 0.9rem 0.9rem 1rem; }
        .cierre-map__support-title {
          display: block;
          margin-bottom: 0.7rem;
          color: var(--stage-color);
          font-size: 0.74rem;
          font-weight: 750;
          letter-spacing: 0.09em;
          line-height: 1.35;
          overflow-wrap: anywhere;
        }
        .cierre-map__stage:nth-child(2) .cierre-map__support-title,
        .cierre-map__stage:nth-child(3) .cierre-map__support-title {
          font-size: 0.84rem;
        }
        .cierre-map__support-items,
        .cierre-map__design-system ul,
        .cierre-map__bridge ul {
          margin: 0;
          padding: 0;
          list-style: none;
        }
        .cierre-map__support-items {
          display: flex;
          flex-wrap: wrap;
          gap: 0.42rem;
        }
        .cierre-map__support-items li {
          min-width: 0;
          padding: 0.36rem 0.48rem;
          border: 1px solid rgb(var(--outline-ghost) / 0.13);
          border-radius: 0.4rem;
          background: rgb(var(--surface-dim) / 0.6);
          color: rgb(var(--text-secondary));
          font-family: var(--font-mono, monospace);
          font-size: 0.72rem;
          line-height: 1.4;
          overflow-wrap: anywhere;
        }
        .cierre-map__stage-link {
          position: absolute;
          bottom: 0.3rem;
          left: 50%;
          display: grid;
          width: 1.2rem;
          height: 1.2rem;
          place-items: center;
          translate: -50% 0;
          color: var(--cierre-cyan);
          font-family: var(--font-mono, monospace);
          font-size: 1rem;
          opacity: 0.8;
        }
        .cierre-map__bridge,
        .cierre-map__design-system {
          position: relative;
          min-width: 0;
          border: 1px solid rgb(var(--outline-ghost) / 0.2);
          background: rgb(var(--surface-elevated) / 0.9);
          box-shadow: inset 0 1px rgb(255 255 255 / 0.04), 0 12px 30px rgb(0 0 0 / 0.09);
        }
        .cierre-map__bridge {
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          gap: 0.75rem;
          margin: 0.9rem 0 0;
          padding: 0.75rem 0.85rem;
          border-radius: 999px 1.1rem 999px 1.1rem;
        }
        .cierre-map__bridge--adversarial { border-color: color-mix(in srgb, var(--cierre-fuchsia) 38%, transparent); }
        .cierre-map__bridge h5,
        .cierre-map__design-system h5 {
          margin: 0.18rem 0 0;
          color: rgb(var(--text-primary));
          font-family: var(--font-mono, monospace);
          font-size: 0.86rem;
          font-weight: 750;
          line-height: 1.2;
          overflow-wrap: anywhere;
          text-transform: uppercase;
        }
        .cierre-map__module-label {
          display: block;
          color: rgb(var(--text-tertiary));
          font-size: 0.64rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          line-height: 1.3;
        }
        .cierre-map__bridge ul { display: flex; gap: 0.4rem; }
        .cierre-map__bridge li,
        .cierre-map__design-system li {
          color: rgb(var(--text-secondary));
          font-family: var(--font-mono, monospace);
          font-size: 0.72rem;
          line-height: 1.35;
        }
        .cierre-map__bridge li {
          padding: 0.26rem 0.4rem;
          border: 1px solid rgb(var(--outline-ghost) / 0.13);
          border-radius: 999px;
          white-space: nowrap;
        }
        .cierre-map__connector { display: none; }
        .cierre-map__design-system {
          margin: 0.9rem 0;
          padding: 0.85rem;
          border-color: color-mix(in srgb, var(--cierre-cyan) 34%, transparent);
          border-radius: 0.65rem 1.8rem 0.65rem 1.2rem;
        }
        .cierre-map__design-system ul {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem 0.75rem;
          margin-top: 0.6rem;
        }
        .cierre-map__vertical-link {
          position: absolute;
          bottom: -1.4rem;
          left: 50%;
          color: var(--cierre-cyan);
          font-size: 1rem;
          translate: -50% 0;
        }
        .cierre-map__bridge--methodology {
          grid-template-columns: minmax(0, 1fr);
          justify-items: center;
          border-color: color-mix(in srgb, var(--cierre-warm) 42%, transparent);
          border-radius: 1.3rem 0.55rem 1.3rem 0.55rem;
        }
        .cierre-map__methodology-words {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, auto));
          gap: 0.18rem 0.7rem;
          color: rgb(var(--text-secondary));
          font-family: var(--font-mono, monospace);
          font-size: 0.76rem;
          line-height: 1.2;
          text-align: center;
        }
        .cierre-map__methodology-words strong { color: var(--cierre-warm); }
        .cierre-map__feedback {
          position: relative;
          display: grid;
          justify-items: center;
          gap: 0.65rem;
          margin-top: 2.25rem;
          padding: 1.15rem 1rem 1.25rem;
          border: 1px dashed rgb(var(--brand-primary) / 0.42);
          border-radius: 1rem 2rem 1rem 2rem;
          background: linear-gradient(90deg, rgb(var(--brand-glow) / 0.045), rgb(var(--brand-glow) / 0.1), rgb(var(--brand-glow) / 0.045));
          text-align: center;
        }
        .cierre-map__feedback-icon {
          display: grid;
          width: 2.15rem;
          height: 2.15rem;
          place-items: center;
          border-radius: 999px;
          background: rgb(var(--brand-primary) / 0.14);
          color: var(--cierre-cyan);
          font-size: 1.2rem;
        }
        .cierre-map__feedback-label {
          display: block;
          margin-bottom: 0.35rem;
          color: var(--cierre-cyan);
          font-size: 0.67rem;
          font-weight: 750;
          letter-spacing: 0.15em;
        }
        .cierre-map__feedback p {
          margin: 0;
          color: rgb(var(--text-secondary));
          font-size: 0.82rem;
          line-height: 1.5;
        }
        .cierre-map__feedback-route {
          color: var(--cierre-cyan);
          font-family: var(--font-mono, monospace);
          font-size: clamp(1.08rem, 5.8vw, 1.55rem);
          font-weight: 800;
          letter-spacing: -0.035em;
          line-height: 1.1;
        }
        @media (min-width: 640px) {
          .cierre-map__header { padding: 1.55rem 1.5rem 1.2rem; }
          .cierre-map__status { display: flex; }
          .cierre-map__body { padding: 1.3rem 1.5rem 1.6rem; }
        }
        @media (min-width: 768px) {
          .cierre-map__mobile-module { display: none; }
          .cierre-map__desktop-module { display: grid; }
          .cierre-map__body { padding-top: 1.5rem; }
          .cierre-map__topology,
          .cierre-map__pipeline,
          .cierre-map__methodology-row {
            display: grid;
            grid-template-columns:
              minmax(0, 1.3fr)
              minmax(0, 1.95fr)
              minmax(0, 1.55fr)
              minmax(0, 1.05fr)
              minmax(0, 0.78fr);
            gap: clamp(0.35rem, 0.9vw, 0.7rem);
          }
          .cierre-map__topology {
            align-items: end;
            min-height: 7.6rem;
            margin-bottom: 1.15rem;
          }
          .cierre-map__bridge--adversarial {
            grid-column: 2 / 4;
            grid-template-columns: minmax(0, 1fr) auto;
            justify-self: start;
            width: min(66%, 13rem);
            margin: 0 0 0 31%;
            padding: 0.58rem 0.7rem;
            border-radius: 999px 1rem 999px 1rem;
          }
          .cierre-map__bridge h5 { font-size: 0.76rem; }
          .cierre-map__module-label { font-size: 0.6rem; }
          .cierre-map__bridge li { padding: 0.2rem 0.34rem; font-size: 0.66rem; }
          .cierre-map__connector {
            position: absolute;
            z-index: -1;
            display: block;
            color: rgb(var(--text-tertiary));
            font-family: var(--font-mono, monospace);
            font-size: 1.05rem;
            opacity: 0.9;
          }
          .cierre-map__bridge--adversarial .cierre-map__connector {
            top: 50%;
            bottom: auto;
            width: 1rem;
            height: 10rem;
            padding-top: 8.7rem;
            border-left: 1px solid rgb(var(--outline-ghost) / 0.42);
            pointer-events: none;
            transform-origin: top center;
          }
          .cierre-map__bridge--adversarial .cierre-map__connector--left {
            left: 0;
            rotate: 18deg;
            text-align: left;
          }
          .cierre-map__bridge--adversarial .cierre-map__connector--right {
            right: 0;
            rotate: -18deg;
            text-align: right;
          }
          .cierre-map__design-system {
            grid-column: 3;
            align-self: end;
            width: 100%;
            margin: 0;
            padding: 0.72rem;
            border-radius: 0.55rem 1.55rem 0.55rem 1rem;
          }
          .cierre-map__design-system h5 { font-size: 0.78rem; }
          .cierre-map__design-system ul {
            display: grid;
            grid-template-columns: minmax(0, 1fr);
            gap: 0.2rem;
            margin-top: 0.45rem;
          }
          .cierre-map__design-system li { font-size: 0.67rem; }
          .cierre-map__vertical-link { bottom: -1.35rem; }
          .cierre-map__stage {
            display: flex;
            min-width: 0;
            padding: 0;
          }
          .cierre-map__stage-card {
            width: 100%;
            align-self: center;
          }
          .cierre-map__stage:nth-child(1) .cierre-map__stage-card {
            min-height: 15.5rem;
            border-radius: 0.65rem 1.8rem 0.65rem 1.1rem;
          }
          .cierre-map__stage:nth-child(2) .cierre-map__stage-card {
            min-height: 18rem;
            border-radius: 0.7rem 2.5rem 0.7rem 1.6rem;
            background: linear-gradient(150deg, rgb(var(--accent-warm) / 0.1), rgb(var(--surface-elevated) / 0.98) 42%, rgb(var(--surface-dim) / 0.84));
            box-shadow: inset 0 1px rgb(255 255 255 / 0.045), 0 18px 45px rgb(0 0 0 / 0.13);
          }
          .cierre-map__stage:nth-child(3) .cierre-map__stage-card {
            min-height: 16.5rem;
            border-radius: 2rem 0.65rem 1.25rem 0.65rem;
          }
          .cierre-map__stage:nth-child(4) .cierre-map__stage-card {
            min-height: 13.5rem;
            border-radius: 0.55rem 1.4rem 0.55rem 1.4rem;
          }
          .cierre-map__stage:nth-child(5) .cierre-map__stage-card {
            min-height: 11.25rem;
            border-radius: 1.25rem 0.5rem 1.25rem 0.5rem;
          }
          .cierre-map__stage-card::before {
            inset: 0 0 auto;
            width: auto;
            height: 3px;
          }
          .cierre-map__stage-heading {
            grid-template-columns: auto minmax(0, 1fr);
            align-items: start;
            gap: 0.42rem;
            padding: 0.78rem 0.58rem 0.68rem;
          }
          .cierre-map__stage-number {
            width: 1.65rem;
            height: 1.65rem;
            font-size: 0.65rem;
          }
          .cierre-map__stage-name { font-size: 0.9rem; line-height: 1.08; }
          .cierre-map__stage-code {
            grid-column: 1 / -1;
            padding-left: 2.08rem;
            font-size: 0.58rem;
          }
          .cierre-map__support { padding: 0.78rem 0.58rem 0.9rem; }
          .cierre-map__support-title { font-size: 0.69rem; letter-spacing: 0.06em; }
          .cierre-map__stage:nth-child(2) .cierre-map__support-title,
          .cierre-map__stage:nth-child(3) .cierre-map__support-title { font-size: 0.78rem; }
          .cierre-map__support-items { gap: 0.3rem; }
          .cierre-map__support-items li {
            width: 100%;
            padding: 0.3rem 0.35rem;
            font-size: 0.67rem;
          }
          .cierre-map__stage:nth-child(5) .cierre-map__stage-heading,
          .cierre-map__stage:nth-child(5) .cierre-map__support { padding-inline: 0.45rem; }
          .cierre-map__stage:nth-child(5) .cierre-map__stage-number { display: none; }
          .cierre-map__stage:nth-child(5) .cierre-map__stage-name { font-size: 0.95rem; }
          .cierre-map__stage:nth-child(5) .cierre-map__stage-code { padding-left: 0; }
          .cierre-map__stage-link {
            top: 50%;
            right: calc(clamp(0.35rem, 0.9vw, 0.7rem) * -0.82);
            bottom: auto;
            left: auto;
            z-index: 2;
            translate: 50% -50%;
            transform: rotate(-90deg);
            text-shadow: 0 0 8px rgb(var(--surface-dim));
          }
          .cierre-map__methodology-row { margin-top: 1rem; }
          .cierre-map__bridge--methodology {
            grid-column: 2 / 4;
            grid-template-columns: 2.6rem minmax(0, auto) 2.6rem;
            justify-self: start;
            width: min(58%, 12rem);
            margin: 0 0 0 36%;
            padding: 0.62rem 0.35rem;
          }
          .cierre-map__bridge--methodology .cierre-map__connector {
            position: static;
            width: 100%;
            color: var(--cierre-warm);
            font-size: 1rem;
            text-align: center;
          }
          .cierre-map__methodology-words {
            gap: 0.14rem 0.45rem;
            font-size: 0.68rem;
          }
          .cierre-map__feedback {
            grid-template-columns: auto minmax(0, 1fr);
            justify-items: start;
            align-items: center;
            gap: 0.9rem 1rem;
            margin-top: 2.75rem;
            padding: 1.35rem clamp(1rem, 3vw, 2rem);
            text-align: left;
          }
          .cierre-map__feedback-route {
            grid-column: 1 / -1;
            justify-self: center;
            width: min(100%, 28ch);
            padding-top: 0.35rem;
            border-top: 1px solid rgb(var(--brand-primary) / 0.2);
            font-size: clamp(1.35rem, 3.2vw, 2rem);
            text-align: center;
          }
          .cierre-map__feedback p { font-size: 0.88rem; }
        }
        @media (min-width: 1024px) {
          .cierre-map__topology { min-height: 8.25rem; }
          .cierre-map__stage-heading { padding: 0.88rem 0.72rem 0.72rem; }
          .cierre-map__support { padding: 0.85rem 0.72rem 1rem; }
          .cierre-map__stage-name { font-size: 1rem; }
          .cierre-map__support-title { font-size: 0.74rem; }
          .cierre-map__support-items li { font-size: 0.71rem; }
          .cierre-map__design-system { padding: 0.8rem; }
          .cierre-map__design-system ul {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0.25rem 0.45rem;
          }
          .cierre-map__design-system li:last-child { grid-column: 1 / -1; }
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
        <div className="cierre-map__topology cierre-map__desktop-module">
          <AdversarialBridge />
          <DesignSystem />
        </div>

        <ol className="cierre-map__pipeline" aria-label="Pipeline principal de desarrollo">
          {pipeline.map((stage, index) => (
            <li key={stage.name} className="cierre-map__stage" data-tone={stage.tone}>
              {index === 2 ? <DesignSystem mobile /> : null}
              <article className="cierre-map__stage-card">
                <header className="cierre-map__stage-heading">
                  <span className="cierre-map__stage-number" aria-hidden="true">{stage.number}</span>
                  <h4 className="cierre-map__stage-name">{stage.name}</h4>
                  <span className="cierre-map__stage-code" aria-hidden="true">{stage.code}</span>
                </header>
                <div className="cierre-map__support">
                  <strong className="cierre-map__support-title">{stage.support}</strong>
                  {stage.items.length > 0 ? (
                    <ul className="cierre-map__support-items">
                      {stage.items.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  ) : null}
                </div>
              </article>
              {index === 1 ? (
                <>
                  <AdversarialBridge mobile />
                  <MethodologyBridge mobile />
                </>
              ) : null}
              {index < pipeline.length - 1 ? (
                <span className="cierre-map__stage-link" aria-hidden="true">↓</span>
              ) : null}
            </li>
          ))}
        </ol>

        <div className="cierre-map__methodology-row cierre-map__desktop-module">
          <MethodologyBridge />
        </div>

        <aside className="cierre-map__feedback" aria-label="Bucle de retroalimentación continua">
          <span className="cierre-map__feedback-icon" aria-hidden="true">↶</span>
          <div>
            <span className="cierre-map__feedback-label">Iteración continua</span>
            <p>Monitoring convierte los hallazgos de QA en nuevas decisiones de planificación.</p>
          </div>
          <strong className="cierre-map__feedback-route">QA → Planificación</strong>
        </aside>
      </div>
    </figure>
  );
}
