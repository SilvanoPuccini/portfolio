"use client";

import { useId } from "react";

const phases = [
  {
    name: "Planificación",
    abbr: "PLAN.",
    spec: "Spec Principal 70%",
    items: [
      "ecommerce [1/40]",
      "opus5-gpt5.6sol",
      "Specs markdown [70%]",
      "spec: crea la auth...",
    ],
  },
  {
    name: "Implementación",
    abbr: "IMPL.",
    spec: "Claude Code",
    items: ["TDD", "TEST", "DRIVEN", "DEVELOPEMENT"],
  },
  {
    name: "Testing",
    abbr: "TEST",
    spec: "Frameworks",
    items: ["TEST", "DRIVEN"],
  },
  {
    name: "Despliegue",
    abbr: "DEPLOY",
    spec: "CLI Skills",
    items: ["Monitoring"],
  },
  {
    name: "QA",
    abbr: "QA",
    spec: "Monitoring",
    items: ["Feedback → Planificación"],
  },
];

export function CierreDiagram() {
  const id = useId().replaceAll(":", "");

  return (
    <figure
      className="cierre-diagram"
      aria-labelledby={`${id}-title`}
    >
      <style>{`
        .cierre-diagram {
          background: linear-gradient(180deg, #0A0E14 0%, #0D1117 100%);
          border: 1px solid #1F2937;
          border-radius: var(--radius-surface, 16px);
          padding: 24px 20px;
          margin: 2rem 0;
          font-family: var(--font-body, system-ui, sans-serif);
          color: #FFFFFF;
        }
        .cierre-top {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 24px;
        }
        .cierre-top-card {
          background: #111820;
          border: 1px dashed #2DD4BF;
          border-radius: 10px;
          padding: 14px 16px;
        }
        .cierre-top-card h4 {
          font-family: var(--font-mono, monospace);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #2DD4BF;
          margin: 0 0 8px 0;
        }
        .cierre-top-card p {
          font-family: var(--font-mono, monospace);
          font-size: 11px;
          color: #9CA3AF;
          margin: 0;
          line-height: 1.6;
        }
        .cierre-flow {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }
        .cierre-phase-wrap {
          display: flex;
          align-items: center;
        }
        .cierre-phase {
          background: #111820;
          border: 1px solid #1F2937;
          border-radius: 10px;
          padding: 14px 12px;
          min-width: 100px;
          text-align: center;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          cursor: default;
        }
        .cierre-phase:hover {
          border-color: #2DD4BF;
          box-shadow: 0 0 16px rgba(45, 212, 191, 0.12);
        }
        .cierre-phase-name {
          font-family: var(--font-mono, monospace);
          font-size: 13px;
          font-weight: 700;
          color: #FFFFFF;
          margin-bottom: 4px;
        }
        .cierre-phase-abbr {
          font-family: var(--font-mono, monospace);
          font-size: 9px;
          letter-spacing: 0.12em;
          color: #6B7280;
          text-transform: uppercase;
        }
        .cierre-arrow {
          color: #2DD4BF;
          font-size: 18px;
          font-weight: 300;
          margin: 0 4px;
          opacity: 0.6;
          user-select: none;
        }
        .cierre-tools {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 8px;
          margin-bottom: 16px;
        }
        .cierre-tools-col {
          background: #0F1620;
          border: 1px solid #1F2937;
          border-radius: 8px;
          padding: 10px 8px;
          text-align: center;
        }
        .cierre-tools-label {
          font-family: var(--font-mono, monospace);
          font-size: 9px;
          letter-spacing: 0.08em;
          color: #2DD4BF;
          text-transform: uppercase;
          margin-bottom: 6px;
        }
        .cierre-tool-item {
          font-family: var(--font-mono, monospace);
          font-size: 10px;
          color: #9CA3AF;
          line-height: 1.7;
          margin: 0;
        }
        .cierre-feedback {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 16px;
          font-family: var(--font-mono, monospace);
          font-size: 11px;
          color: #2DD4BF;
          letter-spacing: 0.06em;
        }
        .cierre-feedback svg {
          flex-shrink: 0;
        }
        @media (max-width: 768px) {
          .cierre-top {
            grid-template-columns: 1fr;
          }
          .cierre-flow {
            gap: 0;
          }
          .cierre-phase {
            min-width: 60px;
            padding: 10px 6px;
          }
          .cierre-phase-name {
            font-size: 10px;
          }
          .cierre-arrow {
            font-size: 14px;
          }
          .cierre-tools {
            grid-template-columns: repeat(5, 1fr);
            gap: 4px;
          }
          .cierre-tools-col {
            padding: 8px 4px;
          }
          .cierre-tool-item {
            font-size: 8px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .cierre-phase {
            transition: none;
          }
        }
      `}</style>

      {/* Top concept cards */}
      <div className="cierre-top">
        <div className="cierre-top-card">
          <h4>Testing Adversarial</h4>
          <p>Claude 2-3 GPT · 2-3 agents</p>
        </div>
        <div className="cierre-top-card">
          <h4>Design System</h4>
          <p>Contenedor · Redes y seg. · CI/CD / Budget</p>
        </div>
      </div>

      {/* Phase flow */}
      <div className="cierre-flow" role="list" aria-label="Ciclo de desarrollo">
        {phases.map((phase, index) => (
          <div key={phase.name} className="cierre-phase-wrap" role="listitem">
            <div className="cierre-phase" aria-label={phase.name}>
              <div className="cierre-phase-name">{phase.name}</div>
              <div className="cierre-phase-abbr">{phase.abbr}</div>
            </div>
            {index < phases.length - 1 && (
              <span className="cierre-arrow" aria-hidden="true">→</span>
            )}
          </div>
        ))}
      </div>

      {/* Tools per phase */}
      <div className="cierre-tools" aria-label="Herramientas por fase">
        {phases.map((phase) => (
          <div key={phase.name} className="cierre-tools-col">
            <div className="cierre-tools-label">{phase.spec}</div>
            {phase.items.map((item) => (
              <p key={item} className="cierre-tool-item">{item}</p>
            ))}
          </div>
        ))}
      </div>

      {/* Feedback loop: QA → Planificación */}
      <div className="cierre-feedback" aria-label="Bucle de retroalimentación">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 14V8" stroke="#2DD4BF" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M4 10L8 6L12 10" stroke="#2DD4BF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>QA → Planificación: aprender y volver a empezar</span>
      </div>
    </figure>
  );
}