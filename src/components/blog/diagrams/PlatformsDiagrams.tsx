/**
 * Diagramas del post "Vercel, Render, Railway y Supabase". Sin props, por la
 * limitación de next-mdx-remote/rsc con expresiones JS en el body del .mdx.
 */

import { Diagram } from '../PostRich';
import { ACCENT, CARD, INK, LINE, LOGOS, MUTED, PANEL, TechLogo, type Logo } from './tech-logos';

const MONO = 'ui-monospace,monospace';
const SECONDARY = '#5b8def';

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: MONO, fontSize: '12px', letterSpacing: '.16em', color: MUTED }}>
      {children}
    </div>
  );
}

/* ── 1. Dónde va cada pieza ──────────────────────────────────────── */

type Fit = 'natural' | 'posible' | 'no';

const PLATAFORMAS: { name: string; logo: Logo }[] = [
  { name: 'Vercel', logo: LOGOS.vercel },
  { name: 'Render', logo: { src: 'https://cdn.simpleicons.org/render/eef2f5', alt: 'Render' } },
  { name: 'Railway', logo: { src: 'https://cdn.simpleicons.org/railway/eef2f5', alt: 'Railway' } },
  { name: 'Supabase', logo: LOGOS.supabase },
];

/*
 * Encaje típico según la documentación de cada servicio, no un ranking.
 * "Disponible" significa que la capacidad existe, propia o por integración,
 * pero no es el centro del producto: hay condiciones de plan o de diseño.
 */
const PIEZAS: { name: string; detail: string; fits: [Fit, Fit, Fit, Fit] }[] = [
  { name: 'Interfaz web', detail: 'páginas, assets, render', fits: ['natural', 'natural', 'posible', 'no'] },
  { name: 'API de request corto', detail: 'responde y termina', fits: ['natural', 'natural', 'natural', 'posible'] },
  { name: 'Proceso siempre encendido', detail: 'worker, cola, websocket propio', fits: ['no', 'natural', 'natural', 'no'] },
  { name: 'Tarea programada', detail: 'cron, limpieza, publicación', fits: ['posible', 'natural', 'natural', 'posible'] },
  { name: 'Base de datos', detail: 'PostgreSQL y sus backups', fits: ['posible', 'posible', 'posible', 'natural'] },
  { name: 'Archivos de usuarios', detail: 'subidas, adjuntos, PDFs', fits: ['posible', 'posible', 'posible', 'natural'] },
  { name: 'Autenticación', detail: 'cuentas, sesiones, proveedores', fits: ['no', 'no', 'no', 'natural'] },
];

const FIT_STYLE: Record<Fit, { label: string; color: string }> = {
  natural: { label: 'Natural', color: ACCENT },
  posible: { label: 'Disponible', color: SECONDARY },
  no: { label: 'No es su lugar', color: LINE },
};

function FitCell({ fit }: { fit: Fit }) {
  const { label, color } = FIT_STYLE[fit];
  const natural = fit === 'natural';
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '7px',
        border: `1px solid ${natural ? color : LINE}`,
        background: natural ? 'rgba(34,211,211,.07)' : PANEL,
        borderRadius: '6px',
        padding: '9px 6px',
        fontFamily: MONO,
        fontSize: '11.5px',
        color: natural ? INK : MUTED,
        opacity: fit === 'no' ? 0.55 : 1,
      }}
    >
      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: color, flexShrink: 0 }} />
      {label}
    </div>
  );
}

function PiezasMatriz() {
  const columns = '220px repeat(4, 1fr)';
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
        <Eyebrow>DÓNDE ENCAJA CADA PIEZA</Eyebrow>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: columns, gap: '8px', marginBottom: '10px' }}>
        <div />
        {PLATAFORMAS.map((plataforma) => (
          <div
            key={plataforma.name}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', paddingBottom: '6px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', height: '26px' }}>
              <TechLogo logo={plataforma.logo} size={24} />
            </div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: INK }}>{plataforma.name}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {PIEZAS.map((pieza) => (
          <div
            key={pieza.name}
            style={{ display: 'grid', gridTemplateColumns: columns, gap: '8px', alignItems: 'center' }}
          >
            <div>
              <div style={{ fontSize: '13.5px', color: INK }}>{pieza.name}</div>
              <div style={{ fontFamily: MONO, fontSize: '11px', color: MUTED, marginTop: '2px' }}>{pieza.detail}</div>
            </div>
            {pieza.fits.map((fit, column) => (
              <FitCell key={PLATAFORMAS[column].name} fit={fit} />
            ))}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '20px', fontSize: '12.5px', color: MUTED, lineHeight: '1.6' }}>
        Encaje típico según la documentación de cada servicio. Los planes y las capacidades cambian: lo que vale es
        confirmarlo contra el servicio y el plan que vas a contratar.
      </div>
    </div>
  );
}

export function PlatformFitBlock() {
  return (
    <Diagram
      w={880}
      caption="Ninguna plataforma es la mejor para todo. Cada una es el lugar natural de algunas piezas"
    >
      <PiezasMatriz />
    </Diagram>
  );
}

/* ── 2. Una combinación posible ──────────────────────────────────── */

function Node({ title, where, children, accent = false }: {
  title: string;
  where: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        boxSizing: 'border-box',
        flex: '1',
        background: accent ? 'rgba(34,211,211,.06)' : PANEL,
        border: `1px solid ${accent ? ACCENT : LINE}`,
        borderRadius: '8px',
        padding: '12px 14px',
      }}
    >
      <div style={{ fontFamily: MONO, fontSize: '11px', color: accent ? ACCENT : MUTED, letterSpacing: '.08em' }}>
        {where}
      </div>
      <div style={{ fontSize: '14px', fontWeight: '700', color: INK, marginTop: '4px' }}>{title}</div>
      <div style={{ fontSize: '12.5px', color: MUTED, marginTop: '5px', lineHeight: '1.5' }}>{children}</div>
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
        padding: '0 8px',
        flexShrink: 0,
      }}
    >
      <div style={{ fontFamily: MONO, fontSize: '11px', color: ACCENT }}>{label}</div>
      <div style={{ color: ACCENT, fontSize: '18px', lineHeight: '1' }}>→</div>
    </div>
  );
}

function Combinacion() {
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
        <Eyebrow>UN PRODUCTO, TRES LUGARES</Eyebrow>
      </div>

      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        <Node title="Interfaz y API corta" where="VERCEL">
          Responde rápido y termina. Encola lo que tarda en vez de esperarlo.
        </Node>
        <Arrow label="encola" />
        <Node title="Worker de reportes" where="RENDER O RAILWAY">
          Proceso que sigue encendido. Toma el trabajo largo y reintenta si falla.
        </Node>
        <Arrow label="guarda" />
        <Node title="Datos, archivos y sesiones" where="SUPABASE" accent>
          La regla de quién puede ver qué vive acá, con políticas por fila.
        </Node>
      </div>

      <div
        style={{
          marginTop: '22px',
          paddingTop: '16px',
          borderTop: `1px dashed ${LINE}`,
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: MONO,
          fontSize: '12px',
          color: MUTED,
        }}
      >
        <span>tres paneles, tres facturas, tres lugares donde mirar</span>
        <span style={{ color: INK }}>una sola fuente de verdad: la base</span>
      </div>
    </div>
  );
}

export function PlatformComboBlock() {
  return (
    <Diagram
      w={880}
      caption="Combinar plataformas es válido cuando cada frontera responde a una necesidad que podés nombrar"
    >
      <Combinacion />
    </Diagram>
  );
}
