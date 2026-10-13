/**
 * Diagramas del post "Después del deploy". Sin props, por la limitación de
 * next-mdx-remote/rsc con expresiones JS en el body del .mdx.
 */

import { Diagram } from '../PostRich';
import { ACCENT, CARD, INK, LINE, MUTED, PANEL } from './tech-logos';

const MONO = 'ui-monospace,monospace';
const WARN = '#f0a868';

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: MONO, fontSize: '12px', letterSpacing: '.16em', color: MUTED }}>
      {children}
    </div>
  );
}

function Frame({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        boxSizing: 'border-box',
        width: '880px',
        background: CARD,
        border: '1px solid #1a2230',
        borderRadius: '14px',
        padding: '32px 30px',
      }}
    >
      <div style={{ marginBottom: '22px' }}>
        <Eyebrow>{eyebrow}</Eyebrow>
      </div>
      {children}
    </div>
  );
}

/* ── 1. Cuatro preguntas, de la más barata a la que importa ─────── */

/*
 * Cada nivel contesta algo que el anterior no puede. El último es la tesis:
 * la única señal que confirma que el producto funciona es que el negocio se
 * mueve, y ninguna herramienta de la plataforma la mide por vos.
 */
const NIVELES: { question: string; check: string; misses: string }[] = [
  {
    question: '¿La web abre?',
    check: 'Un chequeo externo pide la home cada pocos minutos',
    misses: 'No ve un formulario que falla al enviar',
  },
  {
    question: '¿Las rutas críticas responden?',
    check: 'Errores y latencia de la API, por ruta',
    misses: 'No ve un mail que nunca salió',
  },
  {
    question: '¿El flujo se completa?',
    check: 'Un recorrido de punta a punta: entrar, comprar, recibir',
    misses: 'No ve que hace tres días nadie compra',
  },
  {
    question: '¿El negocio se mueve?',
    check: 'Pedidos, contactos o publicaciones contra lo esperado',
    misses: 'Es la que confirma que las otras tres alcanzan',
  },
];

function Escalera() {
  return (
    <Frame eyebrow="QUÉ CONTESTA CADA SEÑAL">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {NIVELES.map((nivel, index) => {
          const last = index === NIVELES.length - 1;
          return (
            <div
              key={nivel.question}
              style={{
                display: 'grid',
                gridTemplateColumns: '40px 230px 1fr 1fr',
                gap: '12px',
                alignItems: 'center',
                background: last ? 'rgba(34,211,211,.06)' : PANEL,
                border: `1px solid ${last ? ACCENT : LINE}`,
                borderRadius: '8px',
                padding: '12px 14px',
                marginLeft: `${index * 18}px`,
              }}
            >
              <div style={{ fontFamily: MONO, fontSize: '13px', color: last ? ACCENT : MUTED }}>0{index + 1}</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: INK }}>{nivel.question}</div>
              <div style={{ fontSize: '12.5px', color: MUTED, lineHeight: '1.5' }}>{nivel.check}</div>
              <div style={{ fontSize: '12.5px', color: last ? INK : WARN, lineHeight: '1.5' }}>{nivel.misses}</div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: `1px dashed ${LINE}`,
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: MONO,
          fontSize: '12px',
          color: MUTED,
        }}
      >
        <span>más arriba: más barato de medir</span>
        <span style={{ color: INK }}>más abajo: más cerca de lo que importa</span>
      </div>
    </Frame>
  );
}

export function SignalLadderBlock() {
  return (
    <Diagram w={880} caption="Cada señal contesta una pregunta distinta. Ninguna reemplaza a la de abajo">
      <Escalera />
    </Diagram>
  );
}

/* ── 2. Ruido frente a alerta útil ───────────────────────────────── */

const PARTES: { label: string; noise: string; useful: string }[] = [
  { label: 'Qué pasó', noise: 'CPU al 85%', useful: 'Hay un lead nuevo sin respuesta hace 48 h' },
  { label: 'Por qué importa', noise: 'No queda claro', useful: 'Un contacto frío se pierde' },
  { label: 'Quién la recibe', noise: 'Todo el equipo, por las dudas', useful: 'Quien responde los contactos' },
  { label: 'Qué hago ahora', noise: 'Mirar un gráfico y esperar', useful: 'Abrir el lead y contestar' },
];

function Cell({ children, tone }: { children: React.ReactNode; tone: 'noise' | 'useful' }) {
  const useful = tone === 'useful';
  return (
    <div
      style={{
        background: useful ? 'rgba(34,211,211,.06)' : PANEL,
        border: `1px solid ${useful ? ACCENT : LINE}`,
        borderRadius: '6px',
        padding: '10px 12px',
        fontSize: '13px',
        color: useful ? INK : MUTED,
        lineHeight: '1.45',
      }}
    >
      {children}
    </div>
  );
}

function Contraste() {
  const columns = '160px 1fr 1fr';
  return (
    <Frame eyebrow="RUIDO FRENTE A ALERTA ÚTIL">
      <div style={{ display: 'grid', gridTemplateColumns: columns, gap: '8px', marginBottom: '10px' }}>
        <div />
        <div style={{ fontSize: '15px', fontWeight: '700', color: MUTED }}>Ruido</div>
        <div style={{ fontSize: '15px', fontWeight: '700', color: INK }}>Alerta útil</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {PARTES.map((parte) => (
          <div key={parte.label} style={{ display: 'grid', gridTemplateColumns: columns, gap: '8px', alignItems: 'stretch' }}>
            <div style={{ fontFamily: MONO, fontSize: '12px', color: MUTED, display: 'flex', alignItems: 'center' }}>
              {parte.label}
            </div>
            <Cell tone="noise">{parte.noise}</Cell>
            <Cell tone="useful">{parte.useful}</Cell>
          </div>
        ))}
      </div>
    </Frame>
  );
}

export function UsefulAlertBlock() {
  return (
    <Diagram w={880} caption="Si después de leer la alerta no sabés qué hacer, no es una alerta: es ruido">
      <Contraste />
    </Diagram>
  );
}
