/**
 * Diagrama del post "Mi stack no es una lista de tecnologías. Es una
 * arquitectura de decisiones". Vive en .tsx (no en el .mdx) por la misma
 * razón que EntornoDiagrams.tsx: next-mdx-remote/rsc pierde cualquier prop
 * pasado como expresión JS en el body de un .mdx.
 */

import { Diagram } from '../PostRich';

const DECISIONS = [
  { n: '01', q: '¿Cómo llega el usuario al producto?', a: 'Next.js o React con Vite' },
  { n: '02', q: '¿Dónde vive la lógica de negocio?', a: 'Django o Go' },
  { n: '03', q: '¿Qué garantías necesitan los datos?', a: 'PostgreSQL' },
  { n: '04', q: '¿Quién va a mantener el sistema?', a: 'el equipo, no la moda' },
  { n: '05', q: '¿Cómo va a llegar a producción?', a: 'servidor, contenedor o export' },
];

function StackDecisionsDiagram() {
  return (
    <div
      style={{
        boxSizing: 'border-box',
        width: '1200px',
        background: '#0a0e14',
        border: '1px solid #1a2230',
        borderRadius: '14px',
        padding: '56px 64px',
      }}
    >
      <div
        style={{
          fontFamily: 'ui-monospace,monospace',
          fontSize: '13px',
          letterSpacing: '.16em',
          color: '#8b94a3',
          marginBottom: '34px',
        }}
      >
        CINCO DECISIONES ANTES DE ELEGIR EL STACK
      </div>

      {DECISIONS.map((d, i) => (
        <div key={d.n}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '26px',
              padding: '20px 26px',
              background: '#0c1219',
              border: '1px solid #1e2937',
              borderRadius: '10px',
            }}
          >
            <div
              style={{
                fontFamily: 'ui-monospace,monospace',
                fontSize: '13px',
                color: '#22d3d3',
                width: '34px',
              }}
            >
              {d.n}
            </div>
            <div style={{ fontSize: '22px', fontWeight: '700', flex: '1', color: '#eef2f5' }}>{d.q}</div>
            <div style={{ fontSize: '15px', color: '#a9e8e8', whiteSpace: 'nowrap' }}>{d.a}</div>
          </div>
          {i < DECISIONS.length - 1 && (
            <div
              style={{
                height: '18px',
                width: '2px',
                background: '#22d3d3',
                marginLeft: '48px',
                opacity: '.55',
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export function FiveDecisionsDiagramBlock() {
  return (
    <Diagram w={1200} caption="La tecnología entra después de definir qué debe sostener el sistema">
      <StackDecisionsDiagram />
    </Diagram>
  );
}
