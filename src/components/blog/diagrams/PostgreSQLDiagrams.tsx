import type { ReactNode } from 'react';
import { Diagram } from '../PostRich';
import { ACCENT, CARD, INK, LINE, LOGOS, MUTED, PANEL, TechLogo } from './tech-logos';

function ModelFrame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ width: 880, boxSizing: 'border-box', padding: 30, background: CARD, border: `1px solid ${LINE}`, borderRadius: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <TechLogo logo={LOGOS.postgres} size={34} />
        <div style={{ color: INK, fontSize: 18, fontWeight: 700 }}>{title}</div>
      </div>
      {children}
    </div>
  );
}

function Entity({ name, fields }: { name: string; fields: string[] }) {
  return (
    <div style={{ flex: 1, background: PANEL, border: `1px solid ${LINE}`, borderRadius: 10, padding: 20 }}>
      <div style={{ color: ACCENT, fontFamily: 'ui-monospace,monospace', fontSize: 15, marginBottom: 16 }}>{name}</div>
      {fields.map((field) => <div key={field} style={{ color: INK, fontSize: 14, lineHeight: 1.9 }}>{field}</div>)}
    </div>
  );
}

export function PriceHistoryBlock() {
  return (
    <Diagram w={880} caption="Ejemplo didáctico: el catálogo conserva el presente; la línea del pedido conserva el valor acordado.">
      <ModelFrame title="Una identidad, dos momentos">
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 20 }}>
          <Entity name="producto" fields={['id: producto A', 'precio actual: editable', 'Describe el catálogo de hoy']} />
          <div style={{ alignSelf: 'center', color: ACCENT, fontSize: 28 }} aria-hidden="true">←</div>
          <Entity name="línea del pedido" fields={['producto_id: producto A', 'precio acordado: capturado', 'Describe la venta confirmada']} />
        </div>
        <div style={{ marginTop: 20, padding: 16, borderLeft: `2px solid ${ACCENT}`, color: MUTED, fontSize: 14, lineHeight: 1.6 }}>
          Confirmar la venta fija el valor acordado. Editar el catálogo después no debería reescribir ese hecho.
        </div>
      </ModelFrame>
    </Diagram>
  );
}

export function MembershipModelBlock() {
  return (
    <Diagram w={880} caption="Ejemplo didáctico: el rol pertenece a la membresía. La relación no concede permisos por sí sola.">
      <ModelFrame title="La participación tiene datos propios">
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 12 }}>
          <Entity name="persona" fields={['id', 'Identidad de la cuenta']} />
          <div style={{ alignSelf: 'center', color: ACCENT, fontFamily: 'ui-monospace,monospace' }}>1:N</div>
          <Entity name="membresía" fields={['persona_id', 'organización_id', 'rol en esta organización']} />
          <div style={{ alignSelf: 'center', color: ACCENT, fontFamily: 'ui-monospace,monospace' }}>N:1</div>
          <Entity name="organización" fields={['id', 'Ámbito de participación']} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20, fontSize: 14, lineHeight: 1.6 }}>
          <div style={{ color: MUTED }}>Integridad: una combinación única de persona y organización evita membresías duplicadas.</div>
          <div style={{ color: INK }}>Autorización: el backend verifica qué acciones permite cada participación.</div>
        </div>
      </ModelFrame>
    </Diagram>
  );
}
