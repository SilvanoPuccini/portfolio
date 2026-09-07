/**
 * Diagramas del post "Django, Node.js o Go: elegir backend es elegir dónde
 * pagar la complejidad". Sin props, por la limitación de next-mdx-remote/rsc.
 */

import { Diagram } from '../PostRich';
import { ACCENT, CARD, INK, LINE, LOGOS, MUTED, PANEL, TechLogo } from './tech-logos';

/* ── 1. Qué es cada uno y qué te da resuelto ──────────────────── */

const OPCIONES = [
  {
    logo: LOGOS.django,
    name: 'Django',
    kind: 'Framework',
    lang: 'Python',
    color: '#44b78b',
    trae: ['ORM y migraciones', 'Autenticación y permisos', 'Panel administrativo', 'Formularios'],
    ponesVos: 'Tiempo real y concurrencia alta',
    brilla: 'Cuando el valor está en reglas de negocio, roles y datos',
  },
  {
    logo: LOGOS.node,
    name: 'Node.js',
    kind: 'Entorno de ejecución',
    lang: 'JavaScript',
    color: '#8cc84b',
    trae: ['Ejecutar JS en el servidor', 'Ecosistema npm', 'Modelo asíncrono nativo'],
    ponesVos: 'ORM, auth, permisos, estructura',
    brilla: 'Cuando el equipo ya escribe TypeScript y el backend orquesta servicios',
  },
  {
    logo: LOGOS.go,
    name: 'Go',
    kind: 'Lenguaje',
    lang: 'Go',
    color: '#00add8',
    trae: ['Concurrencia en el lenguaje', 'Binario único', 'Biblioteca estándar fuerte'],
    ponesVos: 'Casi toda la capa de aplicación',
    brilla: 'Cuando hay un servicio acotado con un requisito medible de carga',
  },
];

function OpcionesGrid() {
  return (
    <div
      style={{
        boxSizing: 'border-box',
        width: '880px',
        background: CARD,
        border: '1px solid #1a2230',
        borderRadius: '14px',
        padding: '34px 32px',
      }}
    >
      <div
        style={{
          fontFamily: 'ui-monospace,monospace',
          fontSize: '12px',
          letterSpacing: '.16em',
          color: MUTED,
          marginBottom: '22px',
        }}
      >
        UN FRAMEWORK, UN ENTORNO Y UN LENGUAJE
      </div>

      <div style={{ display: 'flex', gap: '16px' }}>
        {OPCIONES.map((o) => (
          <div
            key={o.name}
            style={{
              flex: '1',
              background: PANEL,
              border: `1px solid ${LINE}`,
              borderTop: `2px solid ${o.color}`,
              borderRadius: '10px',
              padding: '20px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <TechLogo logo={o.logo} size={26} />
              <span style={{ fontSize: '18px', fontWeight: '700', color: INK }}>{o.name}</span>
            </div>

            <div
              style={{
                fontFamily: 'ui-monospace,monospace',
                fontSize: '11px',
                letterSpacing: '.12em',
                color: o.color,
              }}
            >
              {o.kind.toUpperCase()} · {o.lang.toUpperCase()}
            </div>

            <div>
              <div style={{ fontSize: '11px', color: MUTED, marginBottom: '7px' }}>
                Viene resuelto
              </div>
              {o.trae.map((t) => (
                <div
                  key={t}
                  style={{
                    display: 'flex',
                    gap: '8px',
                    fontSize: '13px',
                    color: INK,
                    lineHeight: '1.6',
                  }}
                >
                  <span style={{ color: o.color }}>/</span>
                  <span>{t}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: '12px' }}>
              <div style={{ fontSize: '11px', color: MUTED, marginBottom: '4px' }}>Lo ponés vos</div>
              <div style={{ fontSize: '13px', color: ACCENT, lineHeight: '1.45' }}>{o.ponesVos}</div>
            </div>

            <div
              style={{
                marginTop: 'auto',
                padding: '11px 13px',
                background: CARD,
                borderLeft: `2px solid ${o.color}`,
                borderRadius: '6px',
                fontSize: '12px',
                color: MUTED,
                lineHeight: '1.5',
              }}
            >
              {o.brilla}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BackendLineupBlock() {
  return (
    <Diagram w={880} caption="Lo que cada opción trae resuelto y lo que deja de tu lado">
      <OpcionesGrid />
    </Diagram>
  );
}

/* ── 2. La complejidad no desaparece: cambia de lugar ─────────── */

const DESPLAZAMIENTO = [
  {
    logo: LOGOS.django,
    name: 'Django',
    color: '#44b78b',
    ahorra: 'Arranque, auth, permisos, panel, migraciones',
    paga: 'Convenciones del framework. Lo que no encaja con el ORM se escribe alrededor',
  },
  {
    logo: LOGOS.node,
    name: 'Node.js',
    color: '#8cc84b',
    ahorra: 'Un solo lenguaje en las dos puntas del producto',
    paga: 'Elegir y sostener cada pieza: ORM, validación, estructura, permisos',
  },
  {
    logo: LOGOS.go,
    name: 'Go',
    color: '#00add8',
    ahorra: 'Recursos, despliegue y comportamiento bajo carga simultánea',
    paga: 'Velocidad de desarrollo. Casi nada del dominio viene hecho',
  },
];

function BalanzaComplejidad() {
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
      <div
        style={{
          fontFamily: 'ui-monospace,monospace',
          fontSize: '12px',
          letterSpacing: '.16em',
          color: MUTED,
          marginBottom: '10px',
        }}
      >
        NINGUNO ELIMINA LA COMPLEJIDAD
      </div>
      <div style={{ fontSize: '15px', color: INK, marginBottom: '22px' }}>
        La mueve. Lo que elegís es en qué parte del proyecto vas a estar peleando.
      </div>

      <div style={{ display: 'flex', marginBottom: '10px' }}>
        <div style={{ width: '160px', flexShrink: 0 }} />
        <div
          style={{
            flex: '1',
            fontFamily: 'ui-monospace,monospace',
            fontSize: '11px',
            letterSpacing: '.14em',
            color: '#4ade80',
            paddingLeft: '18px',
          }}
        >
          TE AHORRA
        </div>
        <div
          style={{
            flex: '1',
            fontFamily: 'ui-monospace,monospace',
            fontSize: '11px',
            letterSpacing: '.14em',
            color: '#f0a868',
            paddingLeft: '18px',
          }}
        >
          TE COBRA
        </div>
      </div>

      {DESPLAZAMIENTO.map((d) => (
        <div
          key={d.name}
          style={{
            display: 'flex',
            alignItems: 'stretch',
            background: PANEL,
            border: `1px solid ${LINE}`,
            borderRadius: '10px',
            marginBottom: '8px',
          }}
        >
          <div
            style={{
              width: '160px',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '18px',
              borderLeft: `2px solid ${d.color}`,
              borderRadius: '10px 0 0 10px',
            }}
          >
            <TechLogo logo={d.logo} size={22} />
            <span style={{ fontSize: '15px', fontWeight: '700', color: INK }}>{d.name}</span>
          </div>

          <div
            style={{
              flex: '1',
              padding: '18px',
              borderLeft: `1px solid ${LINE}`,
              fontSize: '13px',
              color: INK,
              lineHeight: '1.5',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {d.ahorra}
          </div>

          <div
            style={{
              flex: '1',
              padding: '18px',
              borderLeft: `1px solid ${LINE}`,
              fontSize: '13px',
              color: MUTED,
              lineHeight: '1.5',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {d.paga}
          </div>
        </div>
      ))}

      <div
        style={{
          marginTop: '16px',
          padding: '14px 18px',
          background: PANEL,
          border: `1px solid ${LINE}`,
          borderLeft: `2px solid ${ACCENT}`,
          borderRadius: '8px',
          fontSize: '14px',
          color: MUTED,
        }}
      >
        El criterio que más se subestima es el de{' '}
        <span style={{ color: INK }}>operación</span>. Es el único que no se paga una vez: se paga
        todos los meses.
      </div>
    </div>
  );
}

export function BackendComplexityBlock() {
  return (
    <Diagram w={880} caption="Cada opción te ahorra en un lado y te cobra en otro">
      <BalanzaComplejidad />
    </Diagram>
  );
}
