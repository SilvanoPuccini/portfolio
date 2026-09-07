/**
 * Diagramas del post "Deploy no es subir una carpeta". Sin props, por la
 * limitación de next-mdx-remote/rsc con expresiones JS en el body del .mdx.
 */

import { Diagram } from '../PostRich';
import { ACCENT, CARD, INK, LINE, MUTED, PANEL } from './tech-logos';

/* ── 1. Las cuatro etapas que la palabra deploy tapa ──────────── */

const ETAPAS = [
  {
    n: '01',
    name: 'Build',
    que: 'Convertir el repositorio en algo ejecutable',
    falla: 'Dependencias y versiones',
    color: '#22d3d3',
  },
  {
    n: '02',
    name: 'Configuración',
    que: 'Lo que cambia entre entornos sin cambiar el código',
    falla: 'Variables y secretos',
    color: '#7dd3fc',
  },
  {
    n: '03',
    name: 'Despliegue',
    que: 'Poner esa versión a atender pedidos reales',
    falla: 'Migraciones y arranque',
    color: '#a78bfa',
  },
  {
    n: '04',
    name: 'Verificación',
    que: 'Comprobar que el sistema hace su trabajo',
    falla: 'Lo que nadie miró',
    color: '#4ade80',
  },
];

function PipelineEtapas() {
  return (
    <div
      style={{
        boxSizing: 'border-box',
        width: '880px',
        background: CARD,
        border: '1px solid #1a2230',
        borderRadius: '14px',
        padding: '34px 30px',
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
        CUATRO COSAS, NO UNA
      </div>

      <div style={{ display: 'flex', alignItems: 'stretch', gap: '0' }}>
        {ETAPAS.map((e, i) => (
          <div key={e.name} style={{ display: 'flex', alignItems: 'center', flex: '1' }}>
            <div
              style={{
                flex: '1',
                background: PANEL,
                border: `1px solid ${LINE}`,
                borderTop: `2px solid ${e.color}`,
                borderRadius: '10px',
                padding: '18px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '11px',
                minHeight: '190px',
              }}
            >
              <div
                style={{
                  fontFamily: 'ui-monospace,monospace',
                  fontSize: '12px',
                  color: e.color,
                }}
              >
                {e.n}
              </div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: INK }}>{e.name}</div>
              <div style={{ fontSize: '12.5px', color: MUTED, lineHeight: '1.5' }}>{e.que}</div>

              <div
                style={{
                  marginTop: 'auto',
                  paddingTop: '11px',
                  borderTop: `1px solid ${LINE}`,
                }}
              >
                <div style={{ fontSize: '10.5px', color: MUTED, marginBottom: '3px' }}>
                  ACÁ FALLA
                </div>
                <div style={{ fontSize: '12.5px', color: e.color, lineHeight: '1.4' }}>
                  {e.falla}
                </div>
              </div>
            </div>

            {i < ETAPAS.length - 1 ? (
              <div style={{ color: LINE, fontSize: '18px', padding: '0 8px', flexShrink: 0 }}>
                →
              </div>
            ) : null}
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
        Si no sabés en cuál de las cuatro estás parado, terminás cambiando código para arreglar un
        problema de configuración.
      </div>
    </div>
  );
}

export function DeliveryStagesBlock() {
  return (
    <Diagram w={880} caption="Cada etapa falla por un motivo distinto y se arregla de forma distinta">
      <PipelineEtapas />
    </Diagram>
  );
}

/* ── 2. Volver atrás son tres cosas distintas ─────────────────── */

const VUELTAS = [
  {
    name: 'Revertir la aplicación',
    alcance: 'Solo el código',
    cuando: 'La versión nueva se comporta mal y la anterior andaba',
    riesgo: 'Bajo. Casi siempre reversible',
    pierde: 'Nada',
    color: '#4ade80',
  },
  {
    name: 'Recuperar datos',
    alcance: 'Registros afectados',
    cuando: 'Una versión escribió información incorrecta',
    riesgo: 'Medio. Depende de poder identificar qué quedó mal',
    pierde: 'Nada, si se acota bien',
    color: '#f0a868',
  },
  {
    name: 'Restaurar un backup',
    alcance: 'La base entera',
    cuando: 'Último recurso, cuando lo anterior no alcanza',
    riesgo: 'Alto. Vuelve todo a un momento previo',
    pierde: 'Todo lo que pasó desde ese punto',
    color: '#f87171',
  },
];

function TresVueltas() {
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
        NO SON INTERCAMBIABLES
      </div>
      <div style={{ fontSize: '15px', color: INK, marginBottom: '22px' }}>
        Confundirlas lleva a restaurar un backup para arreglar algo que se resolvía revirtiendo el
        código.
      </div>

      <div style={{ display: 'flex', gap: '16px' }}>
        {VUELTAS.map((v) => (
          <div
            key={v.name}
            style={{
              flex: '1',
              background: PANEL,
              border: `1px solid ${LINE}`,
              borderTop: `2px solid ${v.color}`,
              borderRadius: '10px',
              padding: '20px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '13px',
            }}
          >
            <div style={{ fontSize: '16px', fontWeight: '700', color: INK, lineHeight: '1.3' }}>
              {v.name}
            </div>

            <div
              style={{
                fontFamily: 'ui-monospace,monospace',
                fontSize: '11px',
                letterSpacing: '.1em',
                color: v.color,
              }}
            >
              {v.alcance.toUpperCase()}
            </div>

            {[
              ['Cuándo', v.cuando],
              ['Riesgo', v.riesgo],
              ['Qué perdés', v.pierde],
            ].map(([label, value]) => (
              <div key={label} style={{ borderTop: `1px solid ${LINE}`, paddingTop: '11px' }}>
                <div style={{ fontSize: '10.5px', color: MUTED, marginBottom: '4px' }}>
                  {label.toUpperCase()}
                </div>
                <div style={{ fontSize: '12.5px', color: INK, lineHeight: '1.5' }}>{value}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function RollbackOptionsBlock() {
  return (
    <Diagram w={880} caption="Tres formas de volver atrás con tres costos que no se parecen">
      <TresVueltas />
    </Diagram>
  );
}
