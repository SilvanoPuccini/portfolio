"use client";

import { useId } from "react";

const phases = [
  {
    name: "Planificación",
    abbr: "PLAN.",
    width: 190,
    items: ["Spec Principal 70%", "ecommerce [1/40]", "Specs [70%]", "spec: crea la auth..."],
  },
  {
    name: "Implementación",
    abbr: "IMPL.",
    width: 250,
    items: ["CLAUDE CODE", "TDD", "TEST", "DRIVEN", "DEVELOPMENT"],
  },
  {
    name: "Testing",
    abbr: "TEST",
    width: 220,
    items: ["Frameworks", "TEST", "DRIVEN"],
  },
  {
    name: "Despliegue",
    abbr: "DEPLOY",
    width: 180,
    items: ["CLI Skills"],
  },
  {
    name: "QA",
    abbr: "QA",
    width: 130,
    items: ["Monitoring"],
  },
];

const centerItems = ["TDD", "TEST", "DRIVEN", "DEVELOPMENT"];

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
          padding: 28px 20px 16px;
          margin: 2rem 0;
          font-family: var(--font-body, system-ui, sans-serif);
          color: #FFFFFF;
          overflow-x: auto;
        }
        .cierre-title {
          font-family: var(--font-mono, monospace);
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #2DD4BF;
          text-align: center;
          margin: 0 0 22px;
          padding-bottom: 12px;
          border-bottom: 1px solid #1F2937;
          white-space: nowrap;
        }
        .cierre-track {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          gap: 0;
          position: relative;
          min-width: 900px;
        }
        .cierre-phase-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
          position: relative;
        }
        .cierre-phase-box {
          background: #111820;
          border: 1px solid #1F2937;
          border-radius: 10px;
          padding: 14px 10px 10px;
          text-align: center;
          transition: border-color 0.25s ease, box-shadow 0.25s ease;
          cursor: default;
        }
        .cierre-phase-box:hover {
          border-color: #2DD4BF;
          box-shadow: 0 0 20px rgba(45, 212, 191, 0.14);
        }
        .cierre-phase-name {
          font-family: var(--font-mono, monospace);
          font-size: 13px;
          font-weight: 700;
          color: #FFFFFF;
          margin-bottom: 2px;
          white-space: nowrap;
        }
        .cierre-phase-abbr {
          font-family: var(--font-mono, monospace);
          font-size: 9px;
          letter-spacing: 0.12em;
          color: #6B7280;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .cierre-phase-items {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 3px 5px;
          border-top: 1px solid #1F2937;
          padding-top: 8px;
        }
        .cierre-item {
          font-family: var(--font-mono, monospace);
          font-size: 9px;
          color: #9CA3AF;
          line-height: 1.5;
          white-space: nowrap;
        }
        .cierre-item-spec {
          font-size: 8px;
          color: #6B7280;
        }
        .cierre-arrow {
          color: #2DD4BF;
          font-size: 20px;
          font-weight: 300;
          margin: 0 4px;
          opacity: 0.5;
          user-select: none;
          flex-shrink: 0;
          align-self: center;
          padding-top: 14px;
        }
        .cierre-overlay {
          position: absolute;
          z-index: 2;
          background: #0F1620;
          border: 1px dashed #2DD4BF;
          border-radius: 8px;
          padding: 9px 12px;
          box-shadow: 0 0 24px rgba(45, 212, 191, 0.08);
          transition: border-color 0.25s ease;
          top: -38px;
        }
        .cierre-overlay:hover {
          border-color: #5EEAD4;
        }
        .cierre-overlay h4 {
          font-family: var(--font-mono, monospace);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #2DD4BF;
          margin: 0 0 5px 0;
        }
        .cierre-overlay p {
          font-family: var(--font-mono, monospace);
          font-size: 10px;
          color: #9CA3AF;
          margin: 0;
          line-height: 1.5;
        }
        .cierre-connector {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 18px;
          padding-top: 12px;
          border-top: 1px dashed #1F2937;
        }
        .cierre-connector-label {
          font-family: var(--font-mono, monospace);
          font-size: 9px;
          letter-spacing: 0.1em;
          color: #6B7280;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .cierre-connector-flow {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .cierre-connector-arrow {
          color: #2DD4BF;
          font-size: 16px;
          opacity: 0.6;
          user-select: none;
        }
        .cierre-connector-item {
          font-family: var(--font-mono, monospace);
          font-size: 10px;
          font-weight: 600;
          color: #FFFFFF;
          background: #111820;
          border: 1px solid #1F2937;
          border-radius: 6px;
          padding: 5px 10px;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .cierre-connector-item:hover {
          border-color: #2DD4BF;
          box-shadow: 0 0 10px rgba(45, 212, 191, 0.12);
        }
        .cierre-feedback {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 10px;
          font-family: var(--font-mono, monospace);
          font-size: 11px;
          color: #2DD4BF;
          letter-spacing: 0.06em;
        }
        .cierre-feedback svg {
          flex-shrink: 0;
        }
        @media (max-width: 1100px) {
          .cierre-track {
            flex-wrap: wrap;
            justify-content: center;
            gap: 10px;
            min-width: unset;
          }
          .cierre-arrow {
            display: none;
          }
          .cierre-overlay {
            position: static;
            margin-bottom: 8px;
            width: auto;
          }
          .cierre-phase-box {
            min-width: 140px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .cierre-phase-box,
          .cierre-connector-item,
          .cierre-overlay {
            transition: none;
          }
        }
      `}</style>

      <h3 id={`${id}-title`}>Pipeline y Arquitectura de Agentes IA</h3>

      <div className="cierre-track" role="list" aria-label="Pipeline de desarrollo">

        {/* Especificaciones */}
        <div className="cierre-phase-col" role="listitem">
          <div className="cierre-phase-box" style={{ width: 170 }}>
            <div className="cierre-phase-name">Especificaciones</div>
            <div className="cierre-phase-abbr">INPUT</div>
            <div className="cierre-phase-items">
              <span className="cierre-item cierre-item-spec">Spec Principal 70%</span>
              <span className="cierre-item cierre-item-spec">ecommerce [1/40]</span>
              <span className="cierre-item cierre-item-spec">Specs [70%]</span>
              <span className="cierre-item cierre-item-spec">spec: crea auth...</span>
            </div>
          </div>
        </div>

        <span className="cierre-arrow" aria-hidden="true">→</span>

        {/* Planificación */}
        <div className="cierre-phase-col" role="listitem">
          <div className="cierre-phase-box" style={{ width: phases[0].width }}>
            <div className="cierre-phase-name">{phases[0].name}</div>
            <div className="cierre-phase-abbr">{phases[0].abbr}</div>
            <div className="cierre-phase-items">
              {phases[0].items.map((item) => (
                <span key={item} className="cierre-item">{item}</span>
              ))}
            </div>
          </div>
        </div>

        <span className="cierre-arrow" aria-hidden="true">→</span>

        {/* Implementación */}
        <div className="cierre-phase-col" role="listitem">
          <div className="cierre-phase-box" style={{ width: phases[1].width }}>
            <div className="cierre-phase-name">{phases[1].name}</div>
            <div className="cierre-phase-abbr">{phases[1].abbr}</div>
            <div className="cierre-phase-items">
              {phases[1].items.map((item) => (
                <span key={item} className="cierre-item">{item}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Testing Adversarial overlay between Implementación y Testing */}
        <div className="cierre-overlay" aria-label="Testing Adversarial">
          <h4>Testing Adversarial</h4>
          <p>Claude 2-3 GPT · 2-3 agents</p>
        </div>

        <span className="cierre-arrow" aria-hidden="true">→</span>

        {/* Testing */}
        <div className="cierre-phase-col" role="listitem">
          <div className="cierre-phase-box" style={{ width: phases[2].width }}>
            <div className="cierre-phase-name">{phases[2].name}</div>
            <div className="cierre-phase-abbr">{phases[2].abbr}</div>
            <div className="cierre-phase-items">
              {phases[2].items.map((item) => (
                <span key={item} className="cierre-item">{item}</span>
              ))}
            </div>
          </div>
        </div>

        <span className="cierre-arrow" aria-hidden="true">→</span>

        {/* Despliegue */}
        <div className="cierre-phase-col" role="listitem">
          <div className="cierre-phase-box" style={{ width: phases[3].width }}>
            <div className="cierre-phase-name">{phases[3].name}</div>
            <div className="cierre-phase-abbr">{phases[3].abbr}</div>
            <div className="cierre-phase-items">
              {phases[3].items.map((item) => (
                <span key={item} className="cierre-item">{item}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Design System overlay above Despliegue */}
        <div className="cierre-overlay" style={{ top: -38 }} aria-label="Design System">
          <h4>Design System</h4>
          <p>Contenedor · Redes y seg. · CI/CD / Budget</p>
        </div>

        <span className="cierre-arrow" aria-hidden="true">→</span>

        {/* QA */}
        <div className="cierre-phase-col" role="listitem">
          <div className="cierre-phase-box" style={{ width: phases[4].width }}>
            <div className="cierre-phase-name">{phases[4].name}</div>
            <div className="cierre-phase-abbr">{phases[4].abbr}</div>
            <div className="cierre-phase-items">
              {phases[4].items.map((item) => (
                <span key={item} className="cierre-item">{item}</span>
              ))}
            </div>
          </div>
        </div>

        <span className="cierre-arrow" aria-hidden="true">→</span>

        {/* Monitoring */}
        <div className="cierre-phase-col" role="listitem">
          <div className="cierre-phase-box" style={{ width: 100 }}>
            <div className="cierre-phase-name">Monitoring</div>
          </div>
        </div>
      </div>

      {/* Center connector: TDD / TEST / DRIVEN / DEVELOPMENT with bidirectional arrows */}
      <div className="cierre-connector" aria-label="Flujo bidireccional de metodologías">
        <div className="cierre-connector-label">Flujo ida y vuelta</div>
        <div className="cierre-connector-flow">
          <span className="cierre-connector-item">CLAUDE CODE</span>
          <span className="cierre-connector-arrow" aria-hidden="true">⟷</span>
          {centerItems.map((item) => (
            <span key={item} className="cierre-connector-item">{item}</span>
          ))}
          <span className="cierre-connector-arrow" aria-hidden="true">⟷</span>
          <span className="cierre-connector-item">FRAMEWORKS</span>
        </div>
      </div>

      {/* Feedback loop: QA → Planificación */}
      <div className="cierre-feedback" aria-label="Bucle de retroalimentación">
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 14V8" stroke="#2DD4BF" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M4 10L8 6L12 10" stroke="#2DD4BF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>QA → Planificación: aprender y volver a empezar</span>
      </div>
    </figure>
  );
}