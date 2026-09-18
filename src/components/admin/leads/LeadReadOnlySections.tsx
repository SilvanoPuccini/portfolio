'use client';

import { s } from '@/components/admin/AdminShell';
import { c } from '@/components/admin/tokens';

/**
 * Lo que el lead contó de su lado: el formulario y, si vino por un servicio
 * concreto, los datos de ese intake. Nada de esto se edita — es el registro de
 * lo que pidió, y reescribirlo perdería la versión original.
 */

export interface LeadFormData {
  que_construir: string | null;
  problema: string | null;
  tipo_proyecto: string | null;
  secciones: string | null;
  tiene_login: boolean | null;
  tiene_pagos: boolean | null;
  tiene_admin: string | null;
  integraciones: string[] | null;
  idiomas: number | null;
  tiene_marca: boolean | null;
  tiene_contenido: boolean | null;
  presupuesto_rango: string | null;
  plazo: string | null;
  canal_llamada: string | null;
}

/** «Sí» / «No» / «—»: sin dato no es lo mismo que «no». */
export function bool(value: boolean | null) {
  return value === true ? 'Sí' : value === false ? 'No' : '—';
}

export function ReadField({ label, value, accent }: {
  label: string; value: string | null | undefined; accent?: boolean;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <p style={{ ...s.label, marginBottom: 3 }}>{label}</p>
      <p style={{
        fontSize: 14, color: c.text, margin: 0, lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        ...(accent ? { borderLeft: `3px solid ${c.ready}`, paddingLeft: 12 } : {}),
      }}>
        {value || '—'}
      </p>
    </div>
  );
}

export function LeadFormFields({ lead }: { lead: LeadFormData }) {
  return (
    <>
      <ReadField label="Negocio" value={lead.que_construir} />
      <ReadField label="Problema / Oportunidad" value={lead.problema} accent />
      <ReadField label="Tipo de proyecto" value={lead.tipo_proyecto} />
      <ReadField label="Secciones" value={lead.secciones} />
      <ReadField label="Login de usuarios" value={bool(lead.tiene_login)} />
      <ReadField label="Pagos" value={bool(lead.tiene_pagos)} />
      <ReadField label="Panel admin" value={lead.tiene_admin} />
      <ReadField label="Integraciones" value={lead.integraciones?.join(', ') || '—'} />
      <ReadField label="Idiomas" value={lead.idiomas?.toString() ?? '—'} />
      <ReadField label="Tiene marca" value={bool(lead.tiene_marca)} />
      <ReadField label="Tiene contenido" value={bool(lead.tiene_contenido)} />

      <div style={s.divider} />

      <ReadField label="Presupuesto" value={lead.presupuesto_rango} />
      <ReadField label="Plazo" value={lead.plazo} />
      <ReadField label="Canal de llamada" value={lead.canal_llamada} />
    </>
  );
}

export function LeadServiceDetails({ service, serviceData }: {
  service: string | null;
  serviceData: Record<string, unknown> | null;
}) {
  return (
    <>
      {service && (
        <div style={{ marginBottom: 14 }}>
          <p style={s.label}>Servicio</p>
          <p style={{ fontSize: 14, color: c.ready, margin: 0, fontFamily: 'monospace' }}>
            {service}
          </p>
        </div>
      )}
      {serviceData && (
        <div>
          <p style={{ ...s.label, marginBottom: 10 }}>Datos de intake</p>
          {Object.entries(serviceData).map(([key, value]) => (
            <div key={key} style={{ marginBottom: 10 }}>
              <p style={s.label}>{key}</p>
              <p style={{ fontSize: 13, color: c.textSoft, margin: 0, whiteSpace: 'pre-wrap' }}>
                {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value ?? '—')}
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
