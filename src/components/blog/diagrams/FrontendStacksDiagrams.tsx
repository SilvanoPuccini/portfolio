/**
 * Diagramas del post "Next.js, React con Vite o Angular: la herramienta
 * correcta depende del problema".
 *
 * Viven en .tsx y no en el .mdx porque next-mdx-remote/rsc pierde cualquier
 * prop pasado como expresión JS en el body de un .mdx. Por eso se exportan
 * como bloques sin props.
 */

import { Diagram } from '../PostRich';
import { ACCENT, CARD, INK, LINE, LOGOS, MUTED, PANEL, TechLogo } from './tech-logos';

/* ── 1. Las cuatro piezas no están en el mismo nivel ──────────── */

const LINEUP = [
  {
    logo: LOGOS.react,
    name: 'React',
    kind: 'Biblioteca',
    scope: 'Solo la interfaz',
    gives: 'Componentes y estado',
    youAdd: 'Rutas, datos, build',
    color: '#61dafb',
  },
  {
    logo: LOGOS.vite,
    name: 'Vite',
    kind: 'Herramienta',
    scope: 'Desarrollo y build',
    gives: 'Servidor local y bundle',
    youAdd: 'Toda la arquitectura',
    color: '#a855f7',
  },
  {
    logo: LOGOS.next,
    name: 'Next.js',
    kind: 'Framework',
    scope: 'Aplicación completa',
    gives: 'Rutas, render, caché, servidor',
    youAdd: 'Saber qué corre dónde',
    color: '#e5e7eb',
  },
  {
    logo: LOGOS.angular,
    name: 'Angular',
    kind: 'Framework',
    scope: 'Aplicación y convenciones',
    gives: 'DI, módulos, CLI, plantillas',
    youAdd: 'Aprender su modelo',
    color: '#dd0031',
  },
];

function LineupGrid() {
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
        NO ESTÁN EN EL MISMO NIVEL
      </div>

      <div style={{ display: 'flex', gap: '14px' }}>
        {LINEUP.map((t) => (
          <div
            key={t.name}
            style={{
              flex: '1',
              background: PANEL,
              border: `1px solid ${LINE}`,
              borderTop: `2px solid ${t.color}`,
              borderRadius: '10px',
              padding: '20px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <TechLogo logo={t.logo} />
              <span style={{ fontSize: '17px', fontWeight: '700', color: INK }}>{t.name}</span>
            </div>

            <div
              style={{
                fontFamily: 'ui-monospace,monospace',
                fontSize: '11px',
                letterSpacing: '.12em',
                color: t.color,
              }}
            >
              {t.kind.toUpperCase()}
            </div>

            <div style={{ fontSize: '14px', color: INK, lineHeight: '1.4' }}>{t.scope}</div>

            <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: '12px' }}>
              <div style={{ fontSize: '11px', color: MUTED, marginBottom: '4px' }}>Te da</div>
              <div style={{ fontSize: '13px', color: INK, lineHeight: '1.4' }}>{t.gives}</div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: MUTED, marginBottom: '4px' }}>Ponés vos</div>
              <div style={{ fontSize: '13px', color: ACCENT, lineHeight: '1.4' }}>{t.youAdd}</div>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: '20px',
          padding: '14px 18px',
          background: PANEL,
          border: `1px solid ${LINE}`,
          borderLeft: `2px solid ${ACCENT}`,
          borderRadius: '8px',
          fontSize: '14px',
          color: MUTED,
        }}
      >
        Elegir <span style={{ color: INK }}>React con Vite</span> es elegir dejar afuera lo que
        Next.js trae adentro, y asumir vos esas decisiones.
      </div>
    </div>
  );
}

export function FrontendLineupBlock() {
  return (
    <Diagram w={880} caption="Una biblioteca, una herramienta y dos frameworks puestos en la misma comparación">
      <LineupGrid />
    </Diagram>
  );
}

/* ── 2. Matriz cualitativa de seis criterios ──────────────────── */

type Nivel = 'alto' | 'medio' | 'bajo';

const NIVEL_COLOR: Record<Nivel, string> = {
  alto: '#22d3d3',
  medio: '#6b7a8f',
  bajo: '#3a4553',
};

const CRITERIOS: { criterio: string; vite: [Nivel, string]; next: [Nivel, string]; ng: [Nivel, string] }[] = [
  {
    criterio: 'Descubrimiento público',
    vite: ['bajo', 'lo resolvés aparte'],
    next: ['alto', 'HTML servido de fábrica'],
    ng: ['medio', 'requiere SSR aparte'],
  },
  {
    criterio: 'Arranque del proyecto',
    vite: ['alto', 'inmediato'],
    next: ['medio', 'más conceptos antes'],
    ng: ['bajo', 'curva más larga'],
  },
  {
    criterio: 'Convenciones dadas',
    vite: ['bajo', 'las definís vos'],
    next: ['medio', 'rutas y render'],
    ng: ['alto', 'estructura completa'],
  },
  {
    criterio: 'Modelo mental',
    vite: ['alto', 'todo en el navegador'],
    next: ['bajo', 'servidor y cliente'],
    ng: ['medio', 'un solo entorno'],
  },
  {
    criterio: 'Onboarding de equipo',
    vite: ['bajo', 'depende de tu disciplina'],
    next: ['medio', 'convención parcial'],
    ng: ['alto', 'una forma correcta'],
  },
  {
    criterio: 'Superficie de operación',
    vite: ['alto', 'un estático'],
    next: ['medio', 'hay servidor'],
    ng: ['alto', 'un estático'],
  },
];

function Celda({ nivel, texto }: { nivel: Nivel; texto: string }) {
  return (
    <div style={{ flex: '1', padding: '14px 16px', borderLeft: `1px solid ${LINE}` }}>
      <div style={{ display: 'flex', gap: '3px', marginBottom: '7px' }}>
        {(['bajo', 'medio', 'alto'] as Nivel[]).map((n, i) => (
          <span
            key={n}
            style={{
              width: '22px',
              height: '4px',
              borderRadius: '2px',
              background:
                (nivel === 'alto' && i <= 2) ||
                (nivel === 'medio' && i <= 1) ||
                (nivel === 'bajo' && i === 0)
                  ? NIVEL_COLOR[nivel]
                  : '#18202c',
            }}
          />
        ))}
      </div>
      <div style={{ fontSize: '13px', color: MUTED, lineHeight: '1.4' }}>{texto}</div>
    </div>
  );
}

function MatrizCriterios() {
  return (
    <div
      style={{
        boxSizing: 'border-box',
        width: '880px',
        background: CARD,
        border: '1px solid #1a2230',
        borderRadius: '14px',
        padding: '30px 28px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: '10px' }}>
        <div
          style={{
            width: '210px',
            flexShrink: 0,
            fontFamily: 'ui-monospace,monospace',
            fontSize: '11px',
            letterSpacing: '.14em',
            color: MUTED,
          }}
        >
          CRITERIO
        </div>
        {[
          { logo: LOGOS.react, extra: LOGOS.vite, label: 'React + Vite' },
          { logo: LOGOS.next, label: 'Next.js' },
          { logo: LOGOS.angular, label: 'Angular' },
        ].map((c) => (
          <div
            key={c.label}
            style={{
              flex: '1',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              paddingLeft: '16px',
            }}
          >
            <TechLogo logo={c.logo} size={20} />
            {c.extra ? <TechLogo logo={c.extra} size={20} /> : null}
            <span style={{ fontSize: '14px', fontWeight: '700', color: INK }}>{c.label}</span>
          </div>
        ))}
      </div>

      {CRITERIOS.map((row, i) => (
        <div
          key={row.criterio}
          style={{
            display: 'flex',
            alignItems: 'stretch',
            background: i % 2 === 0 ? PANEL : 'transparent',
            border: `1px solid ${LINE}`,
            borderRadius: '8px',
            marginBottom: '6px',
          }}
        >
          <div
            style={{
              width: '210px',
              flexShrink: 0,
              padding: '14px 16px',
              fontSize: '14px',
              fontWeight: '600',
              color: INK,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {row.criterio}
          </div>
          <Celda nivel={row.vite[0]} texto={row.vite[1]} />
          <Celda nivel={row.next[0]} texto={row.next[1]} />
          <Celda nivel={row.ng[0]} texto={row.ng[1]} />
        </div>
      ))}

      <div style={{ marginTop: '14px', fontSize: '12px', color: MUTED }}>
        Comparación cualitativa. Las barras indican cuánto trae resuelto cada opción en ese
        criterio, no un puntaje ni una medición.
      </div>
    </div>
  );
}

export function FrontendMatrixBlock() {
  return (
    <Diagram w={880} caption="Seis criterios, tres opciones y ningún ganador declarado">
      <MatrizCriterios />
    </Diagram>
  );
}

/* ── 3. Tres tipos de producto, tres arquitecturas mínimas ────── */

const ESCENARIOS = [
  {
    tipo: 'Sitio público',
    ejemplo: 'Blog, landing, catálogo, documentación',
    pieza: 'El contenido tiene que ser encontrado y compartido',
    piezas: ['Navegador', 'Servidor que arma el HTML', 'Contenido o CMS'],
    pick: LOGOS.next,
    pickName: 'Next.js',
    color: '#e5e7eb',
    porque: 'El HTML servido y las vistas previas por página no son opcionales acá',
  },
  {
    tipo: 'Aplicación interna',
    ejemplo: 'Panel, herramienta de gestión, back office',
    pieza: 'Todo vive detrás de un login',
    piezas: ['Navegador', 'API o servicio de datos'],
    pick: LOGOS.react,
    pickName: 'React + Vite',
    color: '#61dafb',
    porque: 'Nadie llega desde un buscador, así que el render en servidor no compra nada',
  },
  {
    tipo: 'Producto mixto',
    ejemplo: 'Parte pública y parte con sesión',
    pieza: 'Conviven descubrimiento y trabajo interno',
    piezas: ['Navegador', 'Servidor para lo público', 'API para lo privado'],
    pick: LOGOS.angular,
    pickName: 'Angular o Next.js',
    color: '#dd0031',
    porque: 'Acá pesa más quién lo mantiene que qué renderiza más rápido',
  },
];

function EscenariosFila() {
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
          marginBottom: '20px',
        }}
      >
        LA RESTRICCIÓN DECIDE, NO LA PREFERENCIA
      </div>

      <div style={{ display: 'flex', gap: '16px' }}>
        {ESCENARIOS.map((e) => (
          <div
            key={e.tipo}
            style={{
              flex: '1',
              background: PANEL,
              border: `1px solid ${LINE}`,
              borderRadius: '10px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '13px',
            }}
          >
            <div style={{ fontSize: '17px', fontWeight: '700', color: INK }}>{e.tipo}</div>
            <div style={{ fontSize: '12px', color: MUTED, lineHeight: '1.45' }}>{e.ejemplo}</div>

            <div
              style={{
                padding: '10px 12px',
                background: CARD,
                borderLeft: `2px solid ${ACCENT}`,
                borderRadius: '6px',
                fontSize: '13px',
                color: INK,
                lineHeight: '1.45',
              }}
            >
              {e.pieza}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {e.piezas.map((p, i) => (
                <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontFamily: 'ui-monospace,monospace',
                      fontSize: '11px',
                      color: ACCENT,
                      width: '14px',
                    }}
                  >
                    {i + 1}
                  </span>
                  <span
                    style={{
                      flex: '1',
                      padding: '7px 10px',
                      background: CARD,
                      border: `1px solid ${LINE}`,
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: MUTED,
                    }}
                  >
                    {p}
                  </span>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 'auto',
                paddingTop: '13px',
                borderTop: `1px solid ${LINE}`,
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
              }}
            >
              <TechLogo logo={e.pick} size={22} />
              <span style={{ fontSize: '14px', fontWeight: '700', color: e.color }}>
                {e.pickName}
              </span>
            </div>

            <div style={{ fontSize: '12px', color: MUTED, lineHeight: '1.45' }}>{e.porque}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FrontendScenariosBlock() {
  return (
    <Diagram w={880} caption="El mismo equipo puede elegir distinto en tres productos y acertar las tres veces">
      <EscenariosFila />
    </Diagram>
  );
}
