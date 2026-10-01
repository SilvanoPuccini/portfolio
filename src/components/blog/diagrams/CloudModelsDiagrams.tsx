/**
 * Diagramas del post "VPS, PaaS, BaaS y serverless". Sin props, por la
 * limitación de next-mdx-remote/rsc con expresiones JS en el body del .mdx.
 */

import { Diagram } from '../PostRich';
import { ACCENT, CARD, INK, LINE, MUTED, PANEL, TechLogo, type Logo } from './tech-logos';

const MONO = 'ui-monospace,monospace';
const PROVIDER = '#5b8def';
const SHARED = '#a78bfa';
const DUPLICATE = '#f0a868';

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: MONO, fontSize: '12px', letterSpacing: '.16em', color: MUTED }}>
      {children}
    </div>
  );
}

/* ── 1. Quién sostiene cada capa ─────────────────────────────────── */

type Owner = 'vos' | 'proveedor' | 'compartido';

const MODELOS: { name: string; logos: Logo[] }[] = [
  {
    name: 'VPS',
    logos: [{ src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/digitalocean/digitalocean-original.svg', alt: 'DigitalOcean' }],
  },
  {
    name: 'PaaS',
    logos: [{ src: 'https://cdn.simpleicons.org/render/eef2f5', alt: 'Render' }],
  },
  {
    name: 'BaaS',
    logos: [{ src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/supabase/supabase-original.svg', alt: 'Supabase' }],
  },
  {
    name: 'Serverless',
    logos: [{ src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg', alt: 'Azure Functions' }],
  },
];

/*
 * Reparto típico, no contractual: sale del modelo de responsabilidad compartida
 * y de los modelos de servicio de NIST que cita el post. Las dos últimas filas
 * son la tesis: no hay columna donde las sostenga el proveedor.
 */
const CAPAS: { name: string; owners: [Owner, Owner, Owner, Owner] }[] = [
  { name: 'Hardware, red y centro de datos', owners: ['proveedor', 'proveedor', 'proveedor', 'proveedor'] },
  { name: 'Sistema operativo y parches', owners: ['vos', 'proveedor', 'proveedor', 'proveedor'] },
  { name: 'Build, arranque y procesos', owners: ['vos', 'compartido', 'proveedor', 'compartido'] },
  { name: 'Autenticación, archivos y tiempo real', owners: ['vos', 'vos', 'proveedor', 'vos'] },
  { name: 'Escalar la ejecución', owners: ['vos', 'compartido', 'proveedor', 'proveedor'] },
  { name: 'Reglas de negocio y permisos', owners: ['vos', 'vos', 'vos', 'vos'] },
  { name: 'Qué datos guardar y cómo recuperarlos', owners: ['vos', 'vos', 'vos', 'vos'] },
];

const OWNER_STYLE: Record<Owner, { label: string; color: string }> = {
  proveedor: { label: 'Proveedor', color: PROVIDER },
  compartido: { label: 'Compartido', color: SHARED },
  vos: { label: 'Vos', color: ACCENT },
};

function OwnerCell({ owner }: { owner: Owner }) {
  const { label, color } = OWNER_STYLE[owner];
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '7px',
        border: `1px solid ${owner === 'vos' ? color : LINE}`,
        background: owner === 'vos' ? 'rgba(34,211,211,.07)' : PANEL,
        borderRadius: '6px',
        padding: '9px 6px',
        fontFamily: MONO,
        fontSize: '12px',
        color: owner === 'vos' ? INK : MUTED,
      }}
    >
      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: color, flexShrink: 0 }} />
      {label}
    </div>
  );
}

function ResponsabilidadMatriz() {
  const columns = '230px repeat(4, 1fr)';
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
        <Eyebrow>QUIÉN SOSTIENE CADA CAPA</Eyebrow>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: columns, gap: '8px', marginBottom: '10px' }}>
        <div />
        {MODELOS.map((modelo) => (
          <div
            key={modelo.name}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', paddingBottom: '6px' }}
          >
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', height: '26px' }}>
              {modelo.logos.map((logo) => (
                <TechLogo key={logo.alt} logo={logo} size={24} />
              ))}
            </div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: INK }}>{modelo.name}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {CAPAS.map((capa, index) => (
          <div
            key={capa.name}
            style={{
              display: 'grid',
              gridTemplateColumns: columns,
              gap: '8px',
              alignItems: 'center',
              paddingTop: index === CAPAS.length - 2 ? '12px' : undefined,
              borderTop: index === CAPAS.length - 2 ? `1px dashed ${LINE}` : undefined,
            }}
          >
            <div style={{ fontSize: '13.5px', color: INK }}>{capa.name}</div>
            {capa.owners.map((owner, column) => (
              <OwnerCell key={MODELOS[column].name} owner={owner} />
            ))}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '20px', fontSize: '12.5px', color: MUTED, lineHeight: '1.6' }}>
        Reparto típico de cada modelo. Un VPS con administración incluida o un plan particular lo cambian: lo que
        vale es leerlo en el servicio contratado.
      </div>
    </div>
  );
}

export function CloudResponsibilityBlock() {
  return (
    <Diagram
      w={880}
      caption="El proveedor sube por las capas según el modelo. Las dos de abajo no las sostiene en ninguno"
    >
      <ResponsabilidadMatriz />
    </Diagram>
  );
}

/* ── 2. Mismo evento, dos entregas ───────────────────────────────── */

function Box({
  title,
  children,
  color = LINE,
  width,
}: {
  title: string;
  children?: React.ReactNode;
  color?: string;
  width?: string;
}) {
  return (
    <div
      style={{
        boxSizing: 'border-box',
        width,
        background: PANEL,
        border: `1px solid ${LINE}`,
        borderLeft: `2px solid ${color}`,
        borderRadius: '8px',
        padding: '12px 14px',
      }}
    >
      <div style={{ fontSize: '14px', fontWeight: '700', color: INK }}>{title}</div>
      {children && (
        <div style={{ fontSize: '12.5px', color: MUTED, marginTop: '5px', lineHeight: '1.5' }}>{children}</div>
      )}
    </div>
  );
}

function FlowArrow({ label }: { label?: string }) {
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
      {label && <div style={{ fontFamily: MONO, fontSize: '11px', color: ACCENT }}>{label}</div>}
      <div style={{ color: ACCENT, fontSize: '18px', lineHeight: '1' }}>→</div>
    </div>
  );
}

function Entrega({ n, note }: { n: string; note: string }) {
  return (
    <div
      style={{
        background: PANEL,
        border: `1px solid ${LINE}`,
        borderRadius: '8px',
        padding: '10px 12px',
        fontFamily: MONO,
        fontSize: '12px',
        color: MUTED,
        lineHeight: '1.7',
      }}
    >
      <div style={{ color: INK }}>entrega {n}</div>
      <div>
        pago.aprobado <span style={{ color: DUPLICATE }}>evt_8F2</span>
      </div>
      <div style={{ fontSize: '11px' }}>{note}</div>
    </div>
  );
}

function IdempotenciaFlujo() {
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
        <Eyebrow>MISMO EVENTO, DOS ENTREGAS</Eyebrow>
      </div>

      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '170px' }}>
          <Entrega n="1" note="llega y se procesa" />
          <Entrega n="2" note="reintento del proveedor" />
        </div>

        <FlowArrow />

        <Box title="Función" width="150px">
          Se ejecuta una vez por entrega. Dos entregas, dos ejecuciones.
        </Box>

        <FlowArrow label="consulta" />

        <div
          style={{
            boxSizing: 'border-box',
            width: '170px',
            border: `1px solid ${ACCENT}`,
            borderRadius: '8px',
            padding: '12px 14px',
            background: 'rgba(34,211,211,.06)',
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: '700', color: INK }}>¿evt_8F2 ya se procesó?</div>
          <div style={{ fontSize: '12.5px', color: MUTED, marginTop: '5px', lineHeight: '1.5' }}>
            Contra un registro de eventos guardado en la base, no en la memoria de la función.
          </div>
        </div>

        <FlowArrow />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: '1' }}>
          <Box title="No: acreditar" color={ACCENT}>
            Acredita el pago y guarda evt_8F2 en la misma operación.
          </Box>
          <Box title="Sí: responder OK" color={MUTED}>
            No toca el saldo. Confirma para que el proveedor deje de reintentar.
          </Box>
        </div>
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
        <span>ejecuciones de la función: 2</span>
        <span style={{ color: INK }}>pagos acreditados: 1</span>
      </div>
    </div>
  );
}

export function IdempotentEventBlock() {
  return (
    <Diagram
      w={880}
      caption="Cuántas veces corre la función lo decide la plataforma. Cuántas veces se acredita, el diseño"
    >
      <IdempotenciaFlujo />
    </Diagram>
  );
}
