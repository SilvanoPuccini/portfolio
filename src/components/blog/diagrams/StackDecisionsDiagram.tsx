/**
 * Diagramas del post "Mi stack no es una lista de tecnologías. Es una
 * arquitectura de decisiones". Viven en .tsx (no en el .mdx) por la misma
 * razón que EntornoDiagrams.tsx: next-mdx-remote/rsc pierde cualquier prop
 * pasado como expresión JS en el body de un .mdx.
 */

import { Diagram } from '../PostRich';

const INK = '#eef2f5';
const MUTED = '#8b94a3';
const LINE = '#1e2937';
const PANEL = '#0c1219';
const ACCENT = '#22d3d3';

const DECISIONS = [
  { n: '01', q: '¿Cómo llega el usuario\nal producto?', decides: 'Next.js · React + Vite' },
  { n: '02', q: '¿Dónde vive la\nlógica de negocio?', decides: 'Django · Go' },
  { n: '03', q: '¿Qué garantías\nnecesitan los datos?', decides: 'PostgreSQL' },
  { n: '04', q: '¿Quién va a mantener\nel sistema?', decides: 'convenciones · pruebas' },
  { n: '05', q: '¿Cómo va a llegar\na producción?', decides: 'servidor · contenedor · export' },
];

/** Un renglón: pregunta -> lo que decide. La flecha es el paso, no un adorno. */
function DecisionRow({ n, q, decides }: { n: string; q: string; decides: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', gap: '0' }}>
      <div
        style={{
          width: '54px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'ui-monospace,monospace',
          fontSize: '13px',
          color: ACCENT,
          borderLeft: `2px solid ${LINE}`,
        }}
      >
        {n}
      </div>

      <div
        style={{
          flex: '1',
          display: 'flex',
          alignItems: 'center',
          gap: '18px',
          padding: '18px 22px',
          margin: '6px 0',
          background: PANEL,
          border: `1px solid ${LINE}`,
          borderRadius: '10px',
        }}
      >
        <div
          style={{
            flex: '1',
            fontSize: '19px',
            fontWeight: '700',
            color: INK,
            lineHeight: '1.35',
            whiteSpace: 'pre-line',
          }}
        >
          {q}
        </div>

        <div style={{ color: ACCENT, fontSize: '18px', flexShrink: 0 }}>→</div>

        <div
          style={{
            width: '230px',
            flexShrink: 0,
            fontSize: '14px',
            color: MUTED,
            lineHeight: '1.5',
          }}
        >
          {decides}
        </div>
      </div>
    </div>
  );
}

function StackDecisionsFlow() {
  return (
    <div
      style={{
        boxSizing: 'border-box',
        width: '880px',
        background: '#0a0e14',
        border: `1px solid #1a2230`,
        borderRadius: '14px',
        padding: '40px 44px',
      }}
    >
      <div
        style={{
          padding: '14px 22px',
          background: '#0d1c22',
          border: `1px solid ${ACCENT}`,
          borderRadius: '10px',
          fontSize: '17px',
          fontWeight: '700',
          color: INK,
        }}
      >
        El problema, antes que cualquier herramienta
      </div>

      <div style={{ height: '16px', width: '2px', background: ACCENT, marginLeft: '26px', opacity: '.55' }} />

      {DECISIONS.map((d) => (
        <DecisionRow key={d.n} {...d} />
      ))}

      <div style={{ height: '16px', width: '2px', background: ACCENT, marginLeft: '26px', opacity: '.55' }} />

      <div
        style={{
          padding: '14px 22px',
          background: PANEL,
          border: `1px solid ${LINE}`,
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'baseline',
          gap: '14px',
        }}
      >
        <span style={{ fontSize: '17px', fontWeight: '700', color: INK }}>El stack</span>
        <span style={{ fontSize: '14px', color: MUTED }}>
          es el resultado de las cinco respuestas, no el punto de partida
        </span>
      </div>
    </div>
  );
}

export function FiveDecisionsDiagramBlock() {
  return (
    <Diagram w={880} caption="La tecnología entra después de definir qué debe sostener el sistema">
      <StackDecisionsFlow />
    </Diagram>
  );
}

const STACK_AS_LIST = ['React', 'Next.js', 'Django', 'Go', 'TypeScript', 'PostgreSQL'];

const STACK_AS_ARCHITECTURE = [
  { layer: 'Entrada', pick: 'Next.js', why: 'SEO y primera carga' },
  { layer: 'Negocio', pick: 'Django', why: 'reglas, roles, permisos' },
  { layer: 'Datos', pick: 'PostgreSQL', why: 'integridad y transacciones' },
  { layer: 'Operación', pick: 'contenedor', why: 'cómo llega y se recupera' },
];

/** Hero del post: la misma lista de nombres, leída de dos maneras distintas. */
function StackListVsArchitecture() {
  return (
    <div
      style={{
        boxSizing: 'border-box',
        width: '880px',
        background: '#0a0e14',
        border: '1px solid #1a2230',
        borderRadius: '14px',
        padding: '40px 44px',
        display: 'flex',
        gap: '28px',
        alignItems: 'stretch',
      }}
    >
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            fontFamily: 'ui-monospace,monospace',
            fontSize: '12px',
            letterSpacing: '.16em',
            color: MUTED,
            marginBottom: '18px',
          }}
        >
          UNA LISTA
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '18px' }}>
          {STACK_AS_LIST.map((tech) => (
            <span
              key={tech}
              style={{
                padding: '7px 13px',
                background: PANEL,
                border: `1px solid ${LINE}`,
                borderRadius: '999px',
                fontSize: '14px',
                color: MUTED,
              }}
            >
              {tech}
            </span>
          ))}
        </div>

        <div style={{ fontSize: '14px', color: MUTED, lineHeight: '1.6', marginTop: 'auto' }}>
          Se puede escribir en un CV. No dice nada sobre cómo llegaste a elegir cada una.
        </div>
      </div>

      <div style={{ width: '1px', background: LINE, flexShrink: 0 }} />

      <div style={{ flex: '1.15', display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            fontFamily: 'ui-monospace,monospace',
            fontSize: '12px',
            letterSpacing: '.16em',
            color: ACCENT,
            marginBottom: '18px',
          }}
        >
          UNA ARQUITECTURA DE DECISIONES
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {STACK_AS_ARCHITECTURE.map((row) => (
            <div
              key={row.layer}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '12px',
                padding: '10px 14px',
                background: PANEL,
                border: `1px solid ${LINE}`,
                borderRadius: '8px',
              }}
            >
              <span
                style={{
                  width: '78px',
                  flexShrink: 0,
                  fontFamily: 'ui-monospace,monospace',
                  fontSize: '11px',
                  color: MUTED,
                }}
              >
                {row.layer}
              </span>
              <span style={{ fontSize: '15px', fontWeight: '700', color: INK, width: '110px', flexShrink: 0 }}>
                {row.pick}
              </span>
              <span style={{ fontSize: '13px', color: MUTED }}>{row.why}</span>
            </div>
          ))}
        </div>

        <div style={{ fontSize: '14px', color: '#a9e8e8', lineHeight: '1.6', marginTop: '18px' }}>
          Cada pieza entra con una responsabilidad, y con un motivo que se puede discutir.
        </div>
      </div>
    </div>
  );
}

export function StackHeroBlock() {
  return (
    <Diagram w={880} caption="Los mismos nombres, leídos de dos maneras distintas">
      <StackListVsArchitecture />
    </Diagram>
  );
}
