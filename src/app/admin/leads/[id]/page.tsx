'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { s } from '@/components/admin/AdminShell';

type Lead = {
  id: string;
  created_at: string;
  nombre: string;
  email: string;
  telefono: string | null;
  tipo_proyecto: string | null;
  que_construir: string | null;
  secciones: string | null;
  tiene_login: boolean | null;
  tiene_pagos: boolean | null;
  tiene_admin: string | null;
  integraciones: string[] | null;
  idiomas: number | null;
  tiene_marca: boolean | null;
  tiene_contenido: boolean | null;
  problema: string | null;
  presupuesto_rango: string | null;
  plazo: string | null;
  canal_llamada: string | null;
  estado: string;
  titular: string | null;
  localidad: string | null;
  pais: string | null;
  notas_llamada: string | null;
  diagnostico_objetivo: string | null;
  diagnostico_situacion: string | null;
  diagnostico_requerimiento: string | null;
};

const ESTADOS = ['nuevo', 'en conversación', 'presupuestado', 'cerrado', 'descartado'] as const;

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function bool(v: boolean | null) {
  return v === true ? 'Sí' : v === false ? 'No' : '—';
}

function ReadField({ label, value, accent }: { label: string; value: string | null | undefined; accent?: boolean }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <p style={{ ...s.label, marginBottom: 3 }}>{label}</p>
      <p style={{
        fontSize: 14, color: '#e2e8f0', margin: 0, lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        ...(accent ? { borderLeft: '3px solid #00d4d4', paddingLeft: 12 } : {}),
      }}>
        {value || '—'}
      </p>
    </div>
  );
}

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);

  // Editable client fields
  const [titular, setTitular] = useState('');
  const [localidad, setLocalidad] = useState('');
  const [pais, setPais] = useState('');
  const [estado, setEstado] = useState('');
  const [notasLlamada, setNotasLlamada] = useState('');
  const [clientSaved, setClientSaved] = useState(false);

  // Editable diagnosis fields
  const [diagObjetivo, setDiagObjetivo] = useState('');
  const [diagSituacion, setDiagSituacion] = useState('');
  const [diagRequerimiento, setDiagRequerimiento] = useState('');
  const [diagSaved, setDiagSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/leads/${id}`);
    const data = await res.json() as { lead: Lead };
    const l = data.lead;
    setLead(l);
    setTitular(l.titular ?? '');
    setLocalidad(l.localidad ?? '');
    setPais(l.pais ?? '');
    setEstado(l.estado ?? 'nuevo');
    setNotasLlamada(l.notas_llamada ?? '');
    setDiagObjetivo(l.diagnostico_objetivo ?? '');
    setDiagSituacion(l.diagnostico_situacion ?? '');
    setDiagRequerimiento(l.diagnostico_requerimiento ?? '');
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function saveClient() {
    setClientSaved(false);
    await fetch(`/api/admin/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titular, localidad, pais, estado, notas_llamada: notasLlamada }),
    });
    setClientSaved(true);
    setTimeout(() => setClientSaved(false), 3000);
  }

  async function saveDiagnosis() {
    setDiagSaved(false);
    await fetch(`/api/admin/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        diagnostico_objetivo: diagObjetivo,
        diagnostico_situacion: diagSituacion,
        diagnostico_requerimiento: diagRequerimiento,
      }),
    });
    setDiagSaved(true);
    setTimeout(() => setDiagSaved(false), 3000);
  }

  if (loading) return <p style={{ color: '#475569', fontSize: 13 }}>Cargando...</p>;
  if (!lead) return <p style={s.errorText}>Lead no encontrado.</p>;

  return (
    <div>
      {/* Back button */}
      <button onClick={() => router.push('/admin/leads')}
        style={{ ...s.btnGhost, marginBottom: 20 }}>
        ← Volver a Leads
      </button>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <p style={s.eyebrow}>Lead</p>
        <h1 style={{ ...s.heading, fontSize: 24, marginBottom: 4 }}>{lead.nombre}</h1>
        <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
          {lead.email}{lead.telefono ? ` · ${lead.telefono}` : ''}
        </p>
        <p style={{ fontSize: 12, color: '#475569', margin: '4px 0 0' }}>{fmt(lead.created_at)}</p>
      </div>

      {/* Read-only: Formulario */}
      <div style={{ ...s.card, marginBottom: 20 }}>
        <p style={s.sectionTitle}>Formulario</p>

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
      </div>

      {/* Editable: Datos del cliente */}
      <div style={{ ...s.card, marginBottom: 20 }}>
        <p style={s.sectionTitle}>Datos del cliente</p>

        <div style={{ marginBottom: 14 }}>
          <label style={s.label}>Titular</label>
          <input style={s.input} value={titular} onChange={(e) => setTitular(e.target.value)} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={s.label}>Localidad</label>
          <input style={s.input} value={localidad} onChange={(e) => setLocalidad(e.target.value)} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={s.label}>País</label>
          <input style={s.input} value={pais} onChange={(e) => setPais(e.target.value)} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={s.label}>Estado</label>
          <select value={estado} onChange={(e) => setEstado(e.target.value)}
            style={{ ...s.input, appearance: 'auto' as React.CSSProperties['appearance'] }}>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={s.label}>Notas de llamada</label>
          <textarea style={{ ...s.input, minHeight: 100, resize: 'vertical' as React.CSSProperties['resize'] }}
            value={notasLlamada} onChange={(e) => setNotasLlamada(e.target.value)} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button style={s.btn} onClick={saveClient}>Guardar</button>
          {clientSaved && <p style={s.successText}>Guardado</p>}
        </div>
      </div>

      {/* Editable: Diagnóstico */}
      <div style={{ ...s.card, marginBottom: 20 }}>
        <p style={s.sectionTitle}>Diagnóstico de la llamada</p>

        <div style={{ marginBottom: 14 }}>
          <label style={s.label}>Objetivo — ¿Cómo se ve en 6 meses?</label>
          <textarea style={{ ...s.input, minHeight: 80, resize: 'vertical' as React.CSSProperties['resize'] }}
            value={diagObjetivo} onChange={(e) => setDiagObjetivo(e.target.value)} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={s.label}>Situación — Dolor detectado</label>
          <textarea style={{ ...s.input, minHeight: 80, resize: 'vertical' as React.CSSProperties['resize'] }}
            value={diagSituacion} onChange={(e) => setDiagSituacion(e.target.value)} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={s.label}>Requerimiento — Mi traducción a solución</label>
          <textarea style={{ ...s.input, minHeight: 80, resize: 'vertical' as React.CSSProperties['resize'] }}
            value={diagRequerimiento} onChange={(e) => setDiagRequerimiento(e.target.value)} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button style={s.btn} onClick={saveDiagnosis}>Guardar</button>
          {diagSaved && <p style={s.successText}>Guardado</p>}
        </div>
      </div>
    </div>
  );
}
