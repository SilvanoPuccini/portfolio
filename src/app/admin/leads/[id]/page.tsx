'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { s } from '@/components/admin/AdminShell';
import { autoSelectSlugs as computeAutoSelectSlugs } from '@/lib/auto-select-slugs';

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
  diagnostico_dolor: string | null;
  diagnostico_deseo: string | null;
  diagnostico_preocupaciones: string | null;
  monto_presupuestado: number | null;
  horas_calculadas: number | null;
  fecha_llamada: string | null;
  grabacion_url: string | null;
  transcripcion: string | null;
  pago_estado: string | null;
  service: string | null;
  service_data: Record<string, unknown> | null;
  proposal_sent_at: string | null;
  contract_sent_at: string | null;
};

type Module = {
  slug: string;
  label: string;
  horas_min: number;
  horas_max: number;
  categoria: string;
};

type RateConfig = { tarifa_hora: number; buffer_pct: number };

type PertRow = {
  slug: string;
  label: string;
  o: number;
  m: number;
  p: number;
  selected: boolean;
};

const ESTADOS = ['nuevo', 'llamada_agendada', 'no_show', 'en conversación', 'presupuestado', 'cerrado', 'descartado'] as const;

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function bool(v: boolean | null) {
  return v === true ? 'Sí' : v === false ? 'No' : '—';
}

function pertHours(o: number, m: number, p: number) {
  return (o + 4 * m + p) / 6;
}

function autoSelectSlugs(lead: Lead): Set<string> {
  return computeAutoSelectSlugs(lead);
}

function buildPertRows(modules: Module[], selectedSlugs: Set<string>): PertRow[] {
  return modules.map((mod) => ({
    slug: mod.slug,
    label: mod.label,
    o: mod.horas_min,
    m: Math.round((mod.horas_min + mod.horas_max) / 2),
    p: mod.horas_max,
    selected: selectedSlugs.has(mod.slug),
  }));
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
  const [diagDolor, setDiagDolor] = useState('');
  const [diagDeseo, setDiagDeseo] = useState('');
  const [diagPreocupaciones, setDiagPreocupaciones] = useState('');
  const [diagSaved, setDiagSaved] = useState(false);

  // Budget calculator
  const [allModules, setAllModules] = useState<Module[]>([]);
  const [rateConfig, setRateConfig] = useState<RateConfig>({ tarifa_hora: 35, buffer_pct: 20 });
  const [pertRows, setPertRows] = useState<PertRow[]>([]);
  const [budgetSaved, setBudgetSaved] = useState(false);
  const [budgetInit, setBudgetInit] = useState(false);

  // Contract generation
  const [contractLoading, setContractLoading] = useState(false);

  // Proposal DOCX download
  const [proposalLoading, setProposalLoading] = useState(false);

  // Send questionnaire
  const [questionnaireSending, setQuestionnaireSending] = useState(false);
  const [questionnaireSent, setQuestionnaireSent] = useState(false);
  const [questionnaireError, setQuestionnaireError] = useState('');

  // Send proposal email
  const [proposalSending, setProposalSending] = useState(false);
  const [proposalEmailSent, setProposalEmailSent] = useState(false);
  const [proposalEmailError, setProposalEmailError] = useState('');

  // Send contract email
  const [contractSending, setContractSending] = useState(false);
  const [contractEmailSent, setContractEmailSent] = useState(false);
  const [contractEmailError, setContractEmailError] = useState('');

  // Proposal prompt
  const [promptVisible, setPromptVisible] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);

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
    setDiagDolor(l.diagnostico_dolor ?? '');
    setDiagDeseo(l.diagnostico_deseo ?? '');
    setDiagPreocupaciones(l.diagnostico_preocupaciones ?? '');
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Fetch modules and config for budget calculator
  useEffect(() => {
    Promise.all([
      fetch('/api/admin/modulos').then((r) => r.json()) as Promise<{ modulos: Module[] }>,
      fetch('/api/admin/config').then((r) => r.json()) as Promise<{ config: RateConfig }>,
    ]).then(([modData, cfgData]) => {
      setAllModules(modData.modulos ?? []);
      if (cfgData.config) setRateConfig(cfgData.config);
      setBudgetInit(true);
    });
  }, []);

  // Auto-select modules when lead + modules are ready
  useEffect(() => {
    if (!lead || allModules.length === 0 || !budgetInit) return;
    // Only auto-build rows once
    const selected = autoSelectSlugs(lead);
    setPertRows(buildPertRows(allModules, selected));
    setBudgetInit(false); // prevent re-run
  }, [lead, allModules, budgetInit]);

  // Budget calculations
  const selectedRows = useMemo(() => pertRows.filter((r) => r.selected), [pertRows]);

  const totalPertHours = useMemo(
    () => selectedRows.reduce((sum, r) => sum + pertHours(r.o, r.m, r.p), 0),
    [selectedRows],
  );

  const bufferedHours = useMemo(
    () => totalPertHours * (1 + rateConfig.buffer_pct / 100),
    [totalPertHours, rateConfig.buffer_pct],
  );

  const totalPrice = useMemo(
    () => bufferedHours * rateConfig.tarifa_hora,
    [bufferedHours, rateConfig.tarifa_hora],
  );

  function updatePertRow(slug: string, field: keyof Pick<PertRow, 'o' | 'm' | 'p' | 'selected'>, value: number | boolean) {
    setPertRows((rows) =>
      rows.map((r) => (r.slug === slug ? { ...r, [field]: value } : r)),
    );
  }

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
        diagnostico_dolor: diagDolor,
        diagnostico_deseo: diagDeseo,
        diagnostico_preocupaciones: diagPreocupaciones,
      }),
    });
    setDiagSaved(true);
    setTimeout(() => setDiagSaved(false), 3000);
  }

  async function downloadContract() {
    if (!lead) return;
    setContractLoading(true);
    try {
      const res = await fetch(`/api/admin/contract/${id}`);
      if (!res.ok) throw new Error('Error al generar el contrato');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contrato-${lead.nombre.replace(/\s+/g, '-').toLowerCase()}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[downloadContract]', err);
    } finally {
      setContractLoading(false);
    }
  }

  function buildProposalPrompt(): string {
    if (!lead) return '';
    const modules = selectedRows.map((r) => `- ${r.label}: ${pertHours(r.o, r.m, r.p).toFixed(0)}h`).join('\n');
    return [
      '# BRIEF PARA PROPUESTA VISUAL',
      '',
      '## Cliente',
      `- Nombre: ${lead.titular || lead.nombre}`,
      lead.que_construir ? `- Negocio: ${lead.que_construir}` : null,
      lead.localidad || lead.pais ? `- Ubicación: ${[lead.localidad, lead.pais].filter(Boolean).join(', ')}` : null,
      '',
      '## Diagnóstico',
      diagObjetivo ? `**Objetivo:** ${diagObjetivo}` : null,
      diagSituacion ? `**Situación:** ${diagSituacion}` : null,
      diagRequerimiento ? `**Requerimiento:** ${diagRequerimiento}` : null,
      '',
      '## Alcance del proyecto',
      `- Tipo: ${lead.tipo_proyecto || 'No definido'}`,
      lead.secciones ? `- Secciones: ${lead.secciones}` : null,
      lead.tiene_login === true ? '- Login de usuarios: Sí' : null,
      lead.tiene_pagos === true ? '- Pagos online: Sí' : null,
      lead.tiene_admin === 'yes' ? '- Panel admin: Sí' : null,
      lead.integraciones?.length ? `- Integraciones: ${lead.integraciones.join(', ')}` : null,
      lead.idiomas && lead.idiomas > 1 ? `- Multi-idioma: ${lead.idiomas} idiomas` : null,
      '',
      '## Módulos incluidos',
      modules || '(ninguno seleccionado)',
      '',
      '## Presupuesto',
      `- Horas estimadas: ${bufferedHours.toFixed(1)}h (PERT + ${rateConfig.buffer_pct}% buffer)`,
      `- Tarifa: $${rateConfig.tarifa_hora}/hr`,
      `- Total: $${totalPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      lead.plazo ? `- Plazo deseado: ${lead.plazo}` : null,
      '',
      '## Instrucciones',
      'Generá una propuesta visual profesional para este cliente con:',
      '1. Portada con el nombre del proyecto y el logo de Silvano Puccini Dev',
      '2. Resumen del problema y la solución propuesta',
      '3. Desglose de módulos con horas estimadas',
      '4. Inversión total con condiciones de pago (50% inicio, 50% entrega)',
      '5. Timeline estimado en semanas',
      '6. Sección de garantía (30 días de corrección de bugs post-entrega)',
      '7. Diseño limpio, oscuro, minimalista, tipografía moderna',
    ].filter((line) => line !== null).join('\n');
  }

  async function copyPrompt() {
    const prompt = buildProposalPrompt();
    await navigator.clipboard.writeText(prompt);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 3000);
  }

  async function downloadProposal() {
    if (!lead) return;
    setProposalLoading(true);
    try {
      const res = await fetch(`/api/admin/proposal/${id}`);
      if (!res.ok) {
        const body = await res.json() as { error?: string };
        console.error('[downloadProposal]', body.error);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `propuesta-${lead.nombre.replace(/\s+/g, '-').toLowerCase()}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[downloadProposal]', err);
    } finally {
      setProposalLoading(false);
    }
  }

  async function sendQuestionnaire() {
    setQuestionnaireSending(true);
    setQuestionnaireSent(false);
    setQuestionnaireError('');
    try {
      const res = await fetch(`/api/admin/leads/${id}/questionnaire`, { method: 'POST' });
      if (res.ok) {
        setQuestionnaireSent(true);
        setTimeout(() => setQuestionnaireSent(false), 4000);
      } else {
        const body = await res.json() as { error?: string };
        setQuestionnaireError(body.error ?? 'Error al enviar el cuestionario.');
      }
    } catch {
      setQuestionnaireError('Error de conexión.');
    } finally {
      setQuestionnaireSending(false);
    }
  }

  async function sendProposalEmail() {
    setProposalSending(true);
    setProposalEmailSent(false);
    setProposalEmailError('');
    try {
      const res = await fetch(`/api/admin/leads/${id}/send-proposal`, { method: 'POST' });
      if (res.ok) {
        setProposalEmailSent(true);
        await load(); // refresh lead to show proposal_sent_at
      } else {
        const body = await res.json() as { error?: string };
        setProposalEmailError(body.error ?? 'Error al enviar la propuesta.');
      }
    } catch {
      setProposalEmailError('Error de conexión.');
    } finally {
      setProposalSending(false);
    }
  }

  async function sendContractEmail() {
    setContractSending(true);
    setContractEmailSent(false);
    setContractEmailError('');
    try {
      const res = await fetch(`/api/admin/leads/${id}/send-contract`, { method: 'POST' });
      if (res.ok) {
        setContractEmailSent(true);
        await load(); // refresh lead to show contract_sent_at
      } else {
        const body = await res.json() as { error?: string };
        setContractEmailError(body.error ?? 'Error al enviar el contrato.');
      }
    } catch {
      setContractEmailError('Error de conexión.');
    } finally {
      setContractSending(false);
    }
  }

  async function saveBudget() {
    setBudgetSaved(false);
    await fetch(`/api/admin/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        horas_calculadas: Math.round(bufferedHours * 10) / 10,
        monto_presupuestado: Math.round(totalPrice),
      }),
    });
    setBudgetSaved(true);
    setTimeout(() => setBudgetSaved(false), 3000);
  }

  if (loading) return <p style={{ color: '#475569', fontSize: 13 }}>Cargando...</p>;
  if (!lead) return <p style={s.errorText}>Lead no encontrado.</p>;

  const baseModules = pertRows.filter((r) => allModules.find((m) => m.slug === r.slug)?.categoria === 'base');
  const featureModules = pertRows.filter((r) => allModules.find((m) => m.slug === r.slug)?.categoria === 'modulo');

  return (
    <div>
      {/* Back button */}
      <button onClick={() => router.push('/admin/leads')}
        style={{ ...s.btnGhost, marginBottom: 20 }}>
        ← Volver a Leads
      </button>

      {/* Scheduled call badge */}
      {lead.fecha_llamada && (
        <div style={{
          background: 'rgba(74, 222, 128, 0.1)',
          border: '1px solid #4ade80',
          borderRadius: 10,
          padding: '12px 18px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>📞</span>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#4ade80', margin: 0 }}>
              Llamada agendada
            </p>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: '2px 0 0' }}>
              {fmt(lead.fecha_llamada)}
            </p>
          </div>
        </div>
      )}

      {/* Payment badge */}
      {lead.pago_estado && (
        <div style={{
          background: lead.pago_estado === 'pagado' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(245, 158, 11, 0.1)',
          border: `1px solid ${lead.pago_estado === 'pagado' ? '#4ade80' : '#f59e0b'}`,
          borderRadius: 10, padding: '10px 18px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 16 }}>💳</span>
          <p style={{ fontSize: 13, fontWeight: 600, color: lead.pago_estado === 'pagado' ? '#4ade80' : '#f59e0b', margin: 0 }}>
            Pago {lead.pago_estado}
          </p>
        </div>
      )}

      {/* Recording + Transcription badges */}
      {(lead.grabacion_url || lead.transcripcion) && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          {lead.grabacion_url && (
            <a href={lead.grabacion_url} target="_blank" rel="noopener noreferrer"
              style={{
                background: 'rgba(129, 140, 248, 0.1)', border: '1px solid #818cf8',
                borderRadius: 10, padding: '10px 18px',
                display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none',
              }}>
              <span style={{ fontSize: 16 }}>🎥</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#818cf8' }}>Ver grabación</span>
            </a>
          )}
          {lead.transcripcion && (
            <span style={{
              background: 'rgba(129, 140, 248, 0.1)', border: '1px solid #818cf8',
              borderRadius: 10, padding: '10px 18px',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 16 }}>📝</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#818cf8' }}>Transcripción disponible</span>
            </span>
          )}
        </div>
      )}

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

      {/* Service Details — task 8.1 */}
      {(lead.service || lead.service_data) && (
        <div style={{ ...s.card, marginBottom: 20 }}>
          <p style={s.sectionTitle}>Detalles del servicio</p>
          {lead.service && (
            <div style={{ marginBottom: 14 }}>
              <p style={s.label}>Servicio</p>
              <p style={{ fontSize: 14, color: '#00d4d4', margin: 0, fontFamily: 'monospace' }}>
                {lead.service}
              </p>
            </div>
          )}
          {lead.service_data && (
            <div>
              <p style={{ ...s.label, marginBottom: 10 }}>Datos de intake</p>
              {Object.entries(lead.service_data).map(([key, val]) => (
                <div key={key} style={{ marginBottom: 10 }}>
                  <p style={s.label}>{key}</p>
                  <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, whiteSpace: 'pre-wrap' }}>
                    {typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val ?? '—')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Send Questionnaire — task 8.3 */}
      <div style={{ ...s.card, marginBottom: 20 }}>
        <p style={s.sectionTitle}>Cuestionario</p>
        <p style={s.hint}>
          Enviá un cuestionario al cliente para recopilar información detallada sobre su proyecto.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
          <button
            style={{
              ...s.btn,
              background: questionnaireSending ? '#334155' : '#0ea5e9',
              opacity: questionnaireSending ? 0.7 : 1,
              cursor: questionnaireSending ? 'not-allowed' : 'pointer',
            }}
            onClick={sendQuestionnaire}
            disabled={questionnaireSending}
          >
            {questionnaireSending ? 'Enviando...' : 'Enviar cuestionario'}
          </button>
          {questionnaireSent && <p style={s.successText}>Cuestionario enviado</p>}
          {questionnaireError && <p style={s.errorText}>{questionnaireError}</p>}
        </div>
      </div>

      {/* Transcription */}
      {lead.transcripcion && (
        <div style={{ ...s.card, marginBottom: 20 }}>
          <p style={s.sectionTitle}>Transcripción de la llamada</p>
          <pre style={{
            fontSize: 13, color: '#94a3b8', margin: 0, lineHeight: 1.7,
            whiteSpace: 'pre-wrap', fontFamily: 'inherit',
            maxHeight: 400, overflowY: 'auto',
          }}>
            {lead.transcripcion}
          </pre>
        </div>
      )}

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

        <div style={s.divider} />

        <div style={{ marginBottom: 14 }}>
          <label style={s.label}>Dolor — ¿Qué le duele hoy?</label>
          <textarea style={{ ...s.input, minHeight: 80, resize: 'vertical' as React.CSSProperties['resize'] }}
            value={diagDolor} onChange={(e) => setDiagDolor(e.target.value)} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={s.label}>Deseo — ¿Qué quiere lograr?</label>
          <textarea style={{ ...s.input, minHeight: 80, resize: 'vertical' as React.CSSProperties['resize'] }}
            value={diagDeseo} onChange={(e) => setDiagDeseo(e.target.value)} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={s.label}>Preocupaciones — ¿Qué le preocupa?</label>
          <textarea style={{ ...s.input, minHeight: 80, resize: 'vertical' as React.CSSProperties['resize'] }}
            value={diagPreocupaciones} onChange={(e) => setDiagPreocupaciones(e.target.value)} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button style={s.btn} onClick={saveDiagnosis}>Guardar</button>
          {diagSaved && <p style={s.successText}>Guardado</p>}
        </div>
      </div>

      {/* Budget Calculator */}
      <div style={{ ...s.card, marginBottom: 20 }}>
        <p style={s.sectionTitle}>Calculadora de presupuesto</p>
        <p style={s.hint}>
          PERT = (O + 4M + P) / 6 · Buffer {rateConfig.buffer_pct}% · ${rateConfig.tarifa_hora}/hr
        </p>

        {/* Service Context panel — task 8.5 */}
        {lead.service_data && (
          <div style={{
            background: 'rgba(0,212,212,0.04)',
            border: '1px solid rgba(0,212,212,0.2)',
            borderRadius: 8,
            padding: '14px 16px',
            marginTop: 16,
            marginBottom: 8,
          }}>
            <p style={{ ...s.label, color: '#00d4d4', marginBottom: 10 }}>Contexto del servicio</p>
            {lead.service && (
              <p style={{ fontSize: 13, color: '#00d4d4', fontFamily: 'monospace', margin: '0 0 8px' }}>
                {lead.service}
              </p>
            )}
            {Object.entries(lead.service_data).slice(0, 5).map(([key, val]) => (
              <div key={key} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: '#475569', fontFamily: 'monospace', minWidth: 120 }}>
                  {key}
                </span>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                  {typeof val === 'object' ? JSON.stringify(val) : String(val ?? '—')}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Base modules */}
        {baseModules.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <p style={{ ...s.label, marginBottom: 10, color: '#94a3b8' }}>Base</p>
            {baseModules.map((row) => (
              <PertModuleRow key={row.slug} row={row} onChange={updatePertRow} />
            ))}
          </div>
        )}

        {/* Feature modules */}
        {featureModules.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <p style={{ ...s.label, marginBottom: 10, color: '#94a3b8' }}>Módulos</p>
            {featureModules.map((row) => (
              <PertModuleRow key={row.slug} row={row} onChange={updatePertRow} />
            ))}
          </div>
        )}

        {/* Summary */}
        <div style={{ marginTop: 24, borderTop: '1px solid #1e293b', paddingTop: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 360 }}>
            <div>
              <p style={{ ...s.label, marginBottom: 2 }}>Horas PERT</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>
                {totalPertHours.toFixed(1)}h
              </p>
            </div>
            <div>
              <p style={{ ...s.label, marginBottom: 2 }}>Con buffer ({rateConfig.buffer_pct}%)</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>
                {bufferedHours.toFixed(1)}h
              </p>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <p style={{ ...s.label, marginBottom: 2 }}>Total estimado</p>
              <p style={{ fontSize: 26, fontWeight: 700, color: '#00d4d4', margin: 0 }}>
                ${totalPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18 }}>
            <button style={s.btn} onClick={saveBudget}>Guardar presupuesto</button>
            {budgetSaved && <p style={s.successText}>Guardado</p>}
          </div>

          {lead.monto_presupuestado != null && (
            <p style={{ ...s.hint, marginTop: 8 }}>
              Último guardado: ${lead.monto_presupuestado.toLocaleString('en-US')} ({lead.horas_calculadas}h)
            </p>
          )}

          {lead.monto_presupuestado != null && (
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #1e293b' }}>
              {/* Download Proposal — task 8.4 */}
              <div style={{ marginBottom: 16 }}>
                <button
                  style={{
                    ...s.btn,
                    background: proposalLoading ? '#334155' : '#00d4d4',
                    opacity: proposalLoading ? 0.7 : 1,
                    cursor: proposalLoading ? 'not-allowed' : 'pointer',
                  }}
                  onClick={downloadProposal}
                  disabled={proposalLoading}
                >
                  {proposalLoading ? 'Generando...' : 'Descargar propuesta'}
                </button>
                <p style={{ ...s.hint, marginTop: 6 }}>
                  Descarga la propuesta en formato .docx.
                </p>
              </div>

              {/* Send Proposal Email — task 8.4 */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button
                    style={{
                      ...s.btn,
                      background: proposalSending ? '#334155' : '#0ea5e9',
                      opacity: proposalSending ? 0.7 : 1,
                      cursor: proposalSending ? 'not-allowed' : 'pointer',
                    }}
                    onClick={sendProposalEmail}
                    disabled={proposalSending}
                  >
                    {proposalSending ? 'Enviando...' : 'Enviar propuesta'}
                  </button>
                  {proposalEmailSent && <p style={s.successText}>Propuesta enviada</p>}
                  {proposalEmailError && <p style={s.errorText}>{proposalEmailError}</p>}
                </div>
                {lead.proposal_sent_at && (
                  <p style={{ ...s.hint, marginTop: 6 }}>
                    Enviada el {fmt(lead.proposal_sent_at)}
                  </p>
                )}
              </div>

              {/* Send Contract / Download Contract — task 8.4 */}
              <div style={{ marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button
                    style={{
                      ...s.btn,
                      background: contractLoading ? '#6366f1' : '#818cf8',
                      opacity: contractLoading ? 0.7 : 1,
                      cursor: contractLoading ? 'not-allowed' : 'pointer',
                    }}
                    onClick={downloadContract}
                    disabled={contractLoading}
                  >
                    {contractLoading ? 'Generando...' : 'Generar contrato'}
                  </button>
                  <button
                    style={{
                      ...s.btn,
                      background: contractSending ? '#334155' : '#7c3aed',
                      opacity: contractSending ? 0.7 : 1,
                      cursor: contractSending ? 'not-allowed' : 'pointer',
                    }}
                    onClick={sendContractEmail}
                    disabled={contractSending}
                  >
                    {contractSending ? 'Enviando...' : 'Enviar contrato'}
                  </button>
                  {contractEmailSent && <p style={s.successText}>Contrato enviado</p>}
                  {contractEmailError && <p style={s.errorText}>{contractEmailError}</p>}
                </div>
                {lead.contract_sent_at && (
                  <p style={{ ...s.hint, marginTop: 6 }}>
                    Enviado el {fmt(lead.contract_sent_at)}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Proposal Prompt Generator */}
      {lead.monto_presupuestado != null && (
        <div style={{ ...s.card, marginBottom: 20 }}>
          <p style={s.sectionTitle}>Prompt para propuesta</p>
          <p style={s.hint}>
            Compilá los datos del lead en un prompt listo para generar la propuesta visual.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
            <button
              style={{ ...s.btn, background: '#f59e0b', color: '#0a0a14' }}
              onClick={() => setPromptVisible(!promptVisible)}
            >
              {promptVisible ? 'Ocultar prompt' : 'Ver prompt'}
            </button>
            {promptVisible && (
              <button style={s.btn} onClick={copyPrompt}>
                {promptCopied ? 'Copiado!' : 'Copiar al portapapeles'}
              </button>
            )}
            {promptCopied && <p style={s.successText}>Copiado</p>}
          </div>

          {promptVisible && (
            <textarea
              readOnly
              value={buildProposalPrompt()}
              style={{
                ...s.input,
                marginTop: 14,
                minHeight: 320,
                resize: 'vertical' as React.CSSProperties['resize'],
                fontSize: 13,
                lineHeight: 1.6,
                fontFamily: 'monospace',
                color: '#94a3b8',
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

function PertModuleRow({
  row,
  onChange,
}: {
  row: PertRow;
  onChange: (slug: string, field: keyof Pick<PertRow, 'o' | 'm' | 'p' | 'selected'>, value: number | boolean) => void;
}) {
  const pert = pertHours(row.o, row.m, row.p);

  const numInput: React.CSSProperties = {
    ...s.input,
    width: 64,
    padding: '6px 8px',
    textAlign: 'center',
    fontSize: 13,
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
      opacity: row.selected ? 1 : 0.4,
      padding: '8px 10px',
      background: row.selected ? 'rgba(0,212,212,0.04)' : 'transparent',
      borderRadius: 8,
      transition: 'opacity 0.15s',
    }}>
      <input
        type="checkbox"
        checked={row.selected}
        onChange={(e) => onChange(row.slug, 'selected', e.target.checked)}
        style={{ accentColor: '#00d4d4' }}
      />
      <span style={{ fontSize: 13, color: '#e2e8f0', width: 180, flexShrink: 0 }}>
        {row.label}
      </span>
      <input type="number" min={0} value={row.o} style={numInput}
        onChange={(e) => onChange(row.slug, 'o', Number(e.target.value) || 0)} title="Optimista" />
      <input type="number" min={0} value={row.m} style={numInput}
        onChange={(e) => onChange(row.slug, 'm', Number(e.target.value) || 0)} title="Más probable" />
      <input type="number" min={0} value={row.p} style={numInput}
        onChange={(e) => onChange(row.slug, 'p', Number(e.target.value) || 0)} title="Pesimista" />
      <span style={{ fontSize: 12, color: '#64748b', width: 52, textAlign: 'right', fontFamily: 'monospace' }}>
        {row.selected ? `${pert.toFixed(1)}h` : '—'}
      </span>
    </div>
  );
}
