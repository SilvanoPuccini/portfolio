/**
 * Diagramas del post "Docker como contrato de ejecución". Sin props, por la
 * limitación de next-mdx-remote/rsc con expresiones JS en el body del .mdx.
 */

import { Diagram } from '../PostRich';
import { ACCENT, CARD, INK, LINE, LOGOS, MUTED, PANEL, TechLogo } from './tech-logos';

const MONO = 'ui-monospace,monospace';
const DOCKER_BLUE = '#2496ed';
const PERSIST = '#f0a868';
const EXTERNAL = '#a78bfa';

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: MONO,
        fontSize: '12px',
        letterSpacing: '.16em',
        color: MUTED,
      }}
    >
      {children}
    </div>
  );
}

function Arrow({ label }: { label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        padding: '0 10px',
        flexShrink: 0,
      }}
    >
      <div style={{ fontFamily: MONO, fontSize: '11px', color: ACCENT }}>{label}</div>
      <div style={{ color: ACCENT, fontSize: '18px', lineHeight: '1' }}>→</div>
    </div>
  );
}

/* ── 1. Del archivo al proceso, y lo que llega desde afuera ──────── */

const CAPAS = ['Sistema base fijado', 'Dependencias con versión', 'Código de la aplicación'];

const AFUERA = [
  { name: 'Configuración', note: 'Cambia por entorno sin tocar la imagen' },
  { name: 'Secretos', note: 'Se entregan al ejecutar, nunca quedan en una capa' },
  { name: 'Datos', note: 'En un volumen o un servicio, no en el contenedor' },
];

function PiezaCard({
  title,
  kicker,
  children,
  color = LINE,
}: {
  title: string;
  kicker: string;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <div
      style={{
        flex: '1',
        background: PANEL,
        border: `1px solid ${LINE}`,
        borderTop: `2px solid ${color}`,
        borderRadius: '10px',
        padding: '18px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        minHeight: '220px',
      }}
    >
      <div>
        <div style={{ fontSize: '16px', fontWeight: '700', color: INK }}>{title}</div>
        <div style={{ fontSize: '12.5px', color: MUTED, marginTop: '4px' }}>{kicker}</div>
      </div>
      {children}
    </div>
  );
}

function ContratoPiezas() {
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '22px',
        }}
      >
        <Eyebrow>DEL ARCHIVO AL PROCESO</Eyebrow>
        <TechLogo logo={LOGOS.docker} size={28} />
      </div>

      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        <PiezaCard title="Dockerfile" kicker="La receta, versionada con el código" color={MUTED}>
          <div
            style={{
              fontFamily: MONO,
              fontSize: '11.5px',
              lineHeight: '1.8',
              color: MUTED,
              background: CARD,
              border: `1px solid ${LINE}`,
              borderRadius: '6px',
              padding: '10px 12px',
            }}
          >
            <div>
              <span style={{ color: DOCKER_BLUE }}>FROM</span> base@sha256:…
            </div>
            <div>
              <span style={{ color: DOCKER_BLUE }}>COPY</span> lockfile .
            </div>
            <div>
              <span style={{ color: DOCKER_BLUE }}>RUN</span> instalar deps
            </div>
            <div>
              <span style={{ color: DOCKER_BLUE }}>COPY</span> . .
            </div>
            <div>
              <span style={{ color: DOCKER_BLUE }}>CMD</span> iniciar proceso
            </div>
          </div>
        </PiezaCard>

        <Arrow label="build" />

        <PiezaCard title="Imagen" kicker="El artefacto que se prueba y se promueve" color={DOCKER_BLUE}>
          <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: '5px' }}>
            {CAPAS.map((c) => (
              <div
                key={c}
                style={{
                  fontSize: '12px',
                  color: INK,
                  background: 'rgba(36,150,237,.08)',
                  border: '1px solid rgba(36,150,237,.35)',
                  borderRadius: '5px',
                  padding: '7px 10px',
                }}
              >
                {c}
              </div>
            ))}
          </div>
          <div style={{ fontFamily: MONO, fontSize: '11px', color: DOCKER_BLUE, marginTop: 'auto' }}>
            CAPAS INMUTABLES
          </div>
        </PiezaCard>

        <Arrow label="run" />

        <PiezaCard title="Contenedores" kicker="Instancias de la misma imagen" color={ACCENT}>
          {['api', 'worker'].map((name) => (
            <div
              key={name}
              style={{
                border: `1px solid ${LINE}`,
                borderRadius: '6px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: '12px',
                  color: INK,
                  padding: '6px 10px',
                  background: CARD,
                }}
              >
                {name}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: ACCENT,
                  padding: '5px 10px',
                  borderTop: `1px dashed ${LINE}`,
                }}
              >
                capa escribible, se va con él
              </div>
            </div>
          ))}
        </PiezaCard>
      </div>

      <div
        style={{
          marginTop: '20px',
          border: `1px dashed ${LINE}`,
          borderRadius: '10px',
          padding: '16px 18px',
        }}
      >
        <div style={{ fontSize: '10.5px', color: MUTED, letterSpacing: '.1em', marginBottom: '12px' }}>
          LLEGA DESDE AFUERA, AL EJECUTAR
        </div>
        <div style={{ display: 'flex', gap: '14px' }}>
          {AFUERA.map((a) => (
            <div key={a.name} style={{ flex: '1', borderLeft: `2px solid ${PERSIST}`, paddingLeft: '12px' }}>
              <div style={{ fontSize: '13.5px', fontWeight: '600', color: INK }}>{a.name}</div>
              <div style={{ fontSize: '12px', color: MUTED, lineHeight: '1.5', marginTop: '3px' }}>
                {a.note}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DockerContractBlock() {
  return (
    <Diagram w={880} caption="La imagen fija cómo se ejecuta. Lo que cambia entre entornos entra recién al arrancar">
      <ContratoPiezas />
    </Diagram>
  );
}

/* ── 2. Qué se reemplaza y qué tiene que sobrevivir ──────────────── */

function Servicio({
  name,
  detail,
  tag,
  color,
}: {
  name: string;
  detail: string;
  tag: string;
  color: string;
}) {
  return (
    <div
      style={{
        background: PANEL,
        border: `1px solid ${LINE}`,
        borderLeft: `2px solid ${color}`,
        borderRadius: '8px',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontFamily: MONO, fontSize: '13.5px', color: INK }}>{name}</div>
        <div style={{ fontFamily: MONO, fontSize: '10.5px', color }}>{tag}</div>
      </div>
      <div style={{ fontSize: '12px', color: MUTED, lineHeight: '1.5' }}>{detail}</div>
    </div>
  );
}

const LEYENDA = [
  { color: ACCENT, label: 'Se reemplaza en cada entrega' },
  { color: PERSIST, label: 'Tiene que sobrevivir al contenedor' },
  { color: EXTERNAL, label: 'Tiene que sobrevivir al servidor' },
];

function FronterasServicios() {
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
      <Eyebrow>DÓNDE TERMINA CADA RESPONSABILIDAD</Eyebrow>
      <div style={{ fontSize: '14px', color: MUTED, margin: '8px 0 22px' }}>
        Caso didáctico: una API, un proceso de tareas y una base de datos.
      </div>

      <div style={{ display: 'flex', gap: '16px', alignItems: 'stretch' }}>
        <div
          style={{
            flex: '1',
            border: `1px solid ${LINE}`,
            borderRadius: '12px',
            padding: '14px',
          }}
        >
          <div style={{ fontSize: '10.5px', color: MUTED, letterSpacing: '.1em', marginBottom: '10px' }}>
            SERVIDOR
          </div>
          <div
            style={{
              border: `1px dashed ${LINE}`,
              borderRadius: '10px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '10.5px', color: MUTED, letterSpacing: '.1em' }}>RED DE COMPOSE</div>
              <TechLogo logo={LOGOS.docker} size={20} />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: '1' }}>
                <Servicio
                  name="api"
                  tag="REEMPLAZABLE"
                  color={ACCENT}
                  detail="Imagen de la app. Comando: atender solicitudes"
                />
              </div>
              <div style={{ flex: '1' }}>
                <Servicio
                  name="worker"
                  tag="REEMPLAZABLE"
                  color={ACCENT}
                  detail="Misma imagen. Comando: procesar tareas"
                />
              </div>
            </div>

            <div
              style={{
                fontFamily: MONO,
                fontSize: '11.5px',
                color: MUTED,
                textAlign: 'center',
              }}
            >
              se conectan a <span style={{ color: ACCENT }}>db:5432</span>, no a{' '}
              <span style={{ textDecoration: 'line-through' }}>localhost</span>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch' }}>
              <div style={{ flex: '1.2' }}>
                <Servicio
                  name="db"
                  tag="HEALTHCHECK"
                  color={ACCENT}
                  detail="El proceso se reemplaza. Arrancado no es lo mismo que listo"
                />
              </div>
              <div style={{ flex: '1' }}>
                <Servicio
                  name="volumen"
                  tag="PERSISTE"
                  color={PERSIST}
                  detail="Sobrevive al contenedor. Muere con el disco"
                />
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', color: MUTED, fontSize: '18px' }}>→</div>

        <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '10.5px', color: MUTED, letterSpacing: '.1em', marginTop: '14px' }}>
            FUERA DEL SERVIDOR
          </div>
          <Servicio
            name="backup"
            tag="RECUPERA"
            color={EXTERNAL}
            detail="Copia en otro lugar. Es lo que queda si se pierde el disco"
          />
          <Servicio
            name="secretos"
            tag="SE INYECTAN"
            color={EXTERNAL}
            detail="Viven en la plataforma o en un gestor, no en la imagen"
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '22px', marginTop: '20px', flexWrap: 'wrap' }}>
        {LEYENDA.map((l) => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: l.color }} />
            <div style={{ fontSize: '12px', color: MUTED }}>{l.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DockerBoundariesBlock() {
  return (
    <Diagram w={880} caption="Reemplazar un contenedor no debería llevarse nada que el negocio necesite después">
      <FronterasServicios />
    </Diagram>
  );
}
