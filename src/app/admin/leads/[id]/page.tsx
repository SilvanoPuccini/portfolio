'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { s } from '@/components/admin/AdminShell';
import { c } from '@/components/admin/tokens';
import { autoSelectSlugs as computeAutoSelectSlugs } from '@/lib/auto-select-slugs';
import { PIPELINE, DEAD_ENDS, labelForState } from '@/lib/leads/pipeline';
import { LeadAdvanceBar } from '@/components/admin/leads/LeadAdvanceBar';
import { LeadSection } from '@/components/admin/leads/LeadSection';
import { sectionsFor, type SectionId } from '@/lib/leads/sections';
import {
  buildPertRows,
  type Lead, type LeadModule, type PertRow, type RateConfig,
} from '@/lib/leads/types';
import { LeadFormFields, LeadServiceDetails } from '@/components/admin/leads/LeadReadOnlySections';
import { LeadEditableForm } from '@/components/admin/leads/LeadEditableForm';
import { CallGuide } from '@/components/admin/leads/CallGuide';
import { ComprobantePago } from '@/components/admin/leads/ComprobantePago';
import { LeadSaleHistory } from '@/components/admin/leads/LeadSaleHistory';
import { LeadCierre } from '@/components/admin/leads/LeadCierre';
import {
  clienteSummary, llamadaSummary, diagnosticoSummary, ventaSummary,
} from '@/lib/leads/sheet-summary';
import { diagnosisFromAnswers, parseAnswers, type GuideAnswers } from '@/lib/leads/call-guide';
import { respuestasPrevias } from '@/lib/leads/questionnaire-plan';
import { volcarRespuestas } from '@/lib/leads/volcado';
import { LeadActionButton } from '@/components/admin/leads/LeadActionButton';
import { LeadBudgetSection } from '@/components/admin/leads/LeadBudgetSection';
import {
  armarPresupuesto,
  congelarPedido,
  parsePedidoSnapshot,
  type LineaPresupuesto,
} from '@/lib/leads/presupuesto';
import { servicioPorSlug } from '@/content/servicios';





// El selector de estado usa el recorrido real, no una copia que se olvida
// de los estados nuevos. Ver src/lib/leads/pipeline.ts.
const ESTADOS = [...PIPELINE, ...DEAD_ENDS];

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}



function autoSelectSlugs(lead: Lead): Set<string> {
  return computeAutoSelectSlugs(lead);
}



/** El paquete que se propone cuando el lead entró por un servicio pero no eligió. */
function paqueteSugerido(service: string | null | undefined): string | null {
  const servicio = servicioPorSlug(service);
  if (!servicio) return null;
  const destacado = servicio.paquetes.find((p) => p.destacado) ?? servicio.paquetes[0];
  return destacado?.slug ?? null;
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
  const [guideAnswers, setGuideAnswers] = useState<GuideAnswers>({});
  const [mantenimiento, setMantenimiento] = useState('');
  const [diagSaved, setDiagSaved] = useState(false);

  // Budget calculator
  const [allModules, setAllModules] = useState<LeadModule[]>([]);
  const [rateConfig, setRateConfig] = useState<RateConfig>({ tarifa_hora: 35, buffer_pct: 20 });
  const [pertRows, setPertRows] = useState<PertRow[]>([]);
  // Lo que el cliente eligió del catálogo. Es la base del presupuesto: la
  // estimación por horas quedó para lo que ningún paquete cubre.
  const [paqueteSlug, setPaqueteSlug] = useState<string | null>(null);
  const [extrasIds, setExtrasIds] = useState<string[]>([]);
  const [budgetSaved, setBudgetSaved] = useState(false);
  const [budgetInit, setBudgetInit] = useState(false);

  // Contract generation
  const [contractLoading, setContractLoading] = useState(false);

  // Proposal DOCX download

  // Send questionnaire
  const [questionnaireSending, setQuestionnaireSending] = useState(false);
  const [questionnaireSent, setQuestionnaireSent] = useState(false);
  const [questionnaireError, setQuestionnaireError] = useState('');
  /** Qué pasó con el cuestionario: null mientras no se sabe. */
  const [questionnaireState, setQuestionnaireState] = useState<{
    enviado: boolean; enviadoEl?: string; completadoEl?: string | null; url?: string;
    respuestas?: { question: { key: string; text: string; para: string }; answer: string }[];
  } | null>(null);

  // Send proposal email
  const [proposalSending, setProposalSending] = useState(false);
  const [proposalEmailSent, setProposalEmailSent] = useState(false);
  const [proposalEmailError, setProposalEmailError] = useState('');

  // Send contract email
  const [contractSending, setContractSending] = useState(false);
  const [contractEmailSent, setContractEmailSent] = useState(false);
  const [contractEmailError, setContractEmailError] = useState('');

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
    setGuideAnswers(parseAnswers(l.guia_respuestas));
    setMantenimiento(l.mantenimiento_mensual != null ? String(l.mantenimiento_mensual) : '');
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  /**
   * Qué sección de la ficha viene abierta.
   *
   * Se recalcula con el estado, así que apenas se manda la propuesta o entra
   * el cobro, la ficha reacomoda sola lo que corresponde mirar. Nada se
   * esconde: cualquier sección se abre con un clic.
   */
  const openSections = useMemo(() => {
    const byId = Object.fromEntries(
      sectionsFor(lead?.estado ?? 'nuevo').map((section) => [section.id, section.open]),
    ) as Record<SectionId, boolean>;
    return byId;
  }, [lead?.estado]);

  // Fetch modules and config for budget calculator
  useEffect(() => {
    Promise.all([
      fetch('/api/admin/modulos').then((r) => r.json()) as Promise<{ modulos: LeadModule[] }>,
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

    // El pedido guardado manda: es lo que el cliente ya eligió, con su precio.
    // Si no hay, se propone el paquete destacado del servicio por el que entró.
    const pedido = parsePedidoSnapshot(lead.pedido_snapshot);
    if (pedido) {
      setPaqueteSlug(pedido.paquete);
      setExtrasIds(pedido.extras);
    } else {
      const sugerido = paqueteSugerido(lead.service);
      if (sugerido) setPaqueteSlug(sugerido);
    }

    setBudgetInit(false); // prevent re-run
  }, [lead, allModules, budgetInit]);

  /**
   * Lo que el cliente escribió en el cuestionario, por su clave.
   *
   * De acá salen las dos cosas que la llamada necesita saber de antes: dónde
   * va cada respuesta dentro de la guía, y qué huecos de la venta ya están
   * tapados. Se calcula una vez y no dos, porque si se separan un día van a
   * decir cosas distintas.
   */
  const respuestasCuestionario = useMemo(
    () => Object.fromEntries((questionnaireState?.respuestas ?? []).map((r) => [r.question.key, r.answer])),
    [questionnaireState],
  );

  /**
   * La venta con lo del cuestionario ya aplicado.
   *
   * El volcado de verdad lo hace el endpoint al contestarse, pero las ventas
   * que contestaron antes de que eso existiera tienen las columnas vacías. Se
   * usa la MISMA función para mostrarlo: dos caminos para la misma pregunta
   * terminan contestando distinto.
   */
  const leadConCuestionario = useMemo(
    () => (lead ? { ...lead, ...volcarRespuestas(respuestasCuestionario, lead) } : lead),
    [lead, respuestasCuestionario],
  );

  const presupuesto = useMemo(
    () =>
      armarPresupuesto({
        paqueteSlug,
        extrasIds,
        pertRows,
        tarifaHora: rateConfig.tarifa_hora,
        bufferPct: rateConfig.buffer_pct,
      }),
    [paqueteSlug, extrasIds, pertRows, rateConfig.tarifa_hora, rateConfig.buffer_pct],
  );

  function toggleExtra(id: string, elegido: boolean) {
    setExtrasIds((actuales) =>
      elegido ? [...new Set([...actuales, id])] : actuales.filter((x) => x !== id),
    );
  }

  function elegirPaquete(slug: string | null) {
    setPaqueteSlug(slug);
    // Los extras son de un servicio: al cambiar de paquete dejan de aplicar.
    setExtrasIds([]);
  }

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
      // Las respuestas crudas y, derivados de ellas, los seis campos del
      // diagnóstico: lo que ya los lee (propuesta, seguimiento, recomendación)
      // sigue funcionando sin enterarse del cambio.
      body: JSON.stringify({
        guia_respuestas: guideAnswers,
        ...(() => {
          const diagnosis = diagnosisFromAnswers(guideAnswers);
          return {
            diagnostico_objetivo: diagnosis.objetivo,
            diagnostico_situacion: diagnosis.situacion,
            diagnostico_requerimiento: diagnosis.requerimiento,
            diagnostico_dolor: diagnosis.dolor,
            diagnostico_deseo: diagnosis.deseo,
            diagnostico_preocupaciones: diagnosis.preocupaciones,
          };
        })(),
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




  /**
   * Manda el cuestionario, o lo reenvía si ya existe.
   *
   * Sin `reenviar` el servidor corta el segundo envío: dos links vivos son el
   * cliente contestando uno mientras el panel mira el otro.
   */
  async function sendQuestionnaire(reenviar = false) {
    setQuestionnaireSending(true);
    setQuestionnaireSent(false);
    setQuestionnaireError('');
    try {
      const res = await fetch(`/api/admin/leads/${id}/questionnaire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reenviar }),
      });
      const body = await res.json().catch(() => ({})) as {
        error?: string; yaEnviado?: boolean; enviadoEl?: string; url?: string;
      };

      if (res.ok) {
        setQuestionnaireSent(true);
        setTimeout(() => setQuestionnaireSent(false), 4000);
        await loadQuestionnaireState();
        return;
      }
      if (body.yaEnviado) {
        setQuestionnaireState({ enviado: true, enviadoEl: body.enviadoEl, url: body.url });
        return;
      }
      setQuestionnaireError(body.error ?? 'Error al enviar el cuestionario.');
    } catch {
      setQuestionnaireError('Error de conexión.');
    } finally {
      setQuestionnaireSending(false);
    }
  }

  const loadQuestionnaireState = useCallback(async () => {
    const res = await fetch(`/api/admin/leads/${id}/questionnaire`);
    if (!res.ok) return;
    setQuestionnaireState(await res.json());
  }, [id]);

  // El estado del cuestionario se pregunta al abrir la ficha: ofrecer «enviar»
  // algo que ya se mandó es cómo terminaban dos links dando vueltas.
  useEffect(() => { void loadQuestionnaireState(); }, [loadQuestionnaireState]);

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
        horas_calculadas: Math.round(presupuesto.horasMedida * 10) / 10,
        monto_presupuestado: Math.round(presupuesto.totalUsd),
        // El pedido queda congelado con el precio del día: si mañana sube la
        // lista, lo que se cotizó hoy no se mueve.
        pedido_snapshot: paqueteSlug || extrasIds.length > 0
          ? congelarPedido(paqueteSlug, extrasIds, presupuesto)
          : null,
        mantenimiento_mensual: mantenimiento.trim() ? Number(mantenimiento) : null,
        // El alcance se guarda con el total: es lo que después lista la
        // propuesta, con el nombre y las horas del día que se cotizó.
        // El alcance es el presupuesto entero: el paquete, sus extras y lo que
        // se estimó aparte. Es lo que después lista la propuesta.
        modulos_seleccionados: presupuesto.lineas.map((linea: LineaPresupuesto) => ({
          slug: linea.slug,
          label: linea.label,
          horas: linea.horas ?? undefined,
          precioUsd: linea.tipo === 'medida' ? undefined : linea.precioUsd,
        })),
      }),
    });
    setBudgetSaved(true);
    setTimeout(() => setBudgetSaved(false), 3000);
  }

  if (loading) return <p style={{ color: c.textDim, fontSize: 13 }}>Cargando...</p>;
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

      {/* El comprobante y lo que la lectura vio en él. Aparece apenas el
          cliente informa: es justo cuando hay que decidir si cobrar. */}
      {lead.pago_estado && <ComprobantePago leadId={lead.id} />}

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
        <p style={{ fontSize: 13, color: c.textDim, margin: 0 }}>
          {lead.email}{lead.telefono ? ` · ${lead.telefono}` : ''}
        </p>
        <p style={{ fontSize: 12, color: c.textDim, margin: '4px 0 0' }}>{fmt(lead.created_at)}</p>
      </div>

      {/* Lo primero de la ficha es qué sigue, no el formulario de hace un mes. */}
      <LeadAdvanceBar
        leadId={lead.id}
        estado={lead.estado}
        monto={lead.monto_presupuestado}
        proposalSentAt={lead.proposal_sent_at}
        contratoVencido={Boolean(lead.contrato_vencido_at)}
        contratoArchivado={Boolean(lead.contrato_pdf_path)}
        rechazoMotivo={lead.contrato_rechazado_at ? (lead.contrato_rechazo_motivo ?? null) : undefined}
        onAdvanced={() => void load()}
      />

      {/* ── 1 · EL CLIENTE ─────────────────────────────────────────────
          «Formulario», «Detalles del servicio», «Cuestionario» y «Datos del
          cliente» eran cuatro cajas para la misma pregunta: quién es y qué
          pidió. Ahora es una sola, con el resumen a la vista. */}
      <LeadSection title="1 · El cliente" defaultOpen={openSections.cliente} hint={clienteSummary(leadConCuestionario ?? lead)}>
        <LeadFormFields lead={lead} />

        {(lead.service || lead.service_data) && (
          <div style={{ marginTop: 18 }}>
            <p style={s.sectionTitle}>Detalles del servicio</p>
            <LeadServiceDetails service={lead.service} serviceData={lead.service_data} />
          </div>
        )}

        <div style={{ marginTop: 18 }}>
          <p style={s.sectionTitle}>Datos para facturar y estado</p>
          <LeadEditableForm
            onSave={saveClient}
            saved={clientSaved}
            fields={[
              { kind: 'text', key: 'titular', label: 'Titular', value: titular, onChange: setTitular },
              { kind: 'text', key: 'localidad', label: 'Localidad', value: localidad, onChange: setLocalidad },
              { kind: 'text', key: 'pais', label: 'País', value: pais, onChange: setPais },
              {
                kind: 'select', key: 'estado', label: 'Estado', value: estado, onChange: setEstado,
                options: ESTADOS.map((value) => ({ value, label: labelForState(value) })),
              },
              { kind: 'textarea', key: 'notas', label: 'Notas de llamada', value: notasLlamada, onChange: setNotasLlamada, minHeight: 100 },
            ]}
          />
        </div>

        <div style={{ marginTop: 18 }}>
          <p style={s.sectionTitle}>Pedirle lo que falta</p>

          {questionnaireState?.completadoEl ? (
            <div>
              <p style={s.hint}>Lo completó el {fmt(questionnaireState.completadoEl)}.</p>
              <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
                {(questionnaireState.respuestas ?? []).map(({ question, answer }) => (
                  <div key={question.text}>
                    <p style={{ ...s.label, marginBottom: 3 }}>{question.para}</p>
                    <p style={{ margin: '0 0 3px', fontSize: 12.5, color: c.textDim, lineHeight: 1.5 }}>
                      {question.text}
                    </p>
                    <p style={{ margin: 0, fontSize: 13.5, color: c.text, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {answer}
                    </p>
                  </div>
                ))}
                {(questionnaireState.respuestas ?? []).length === 0 && (
                  <p style={s.hint}>Lo envió sin contestar ninguna pregunta.</p>
                )}
              </div>
            </div>
          ) : questionnaireState?.enviado ? (
            <div>
              <p style={s.hint}>
                Enviado el {questionnaireState.enviadoEl ? fmt(questionnaireState.enviadoEl) : '—'} y todavía sin
                contestar. Reenviar manda el mismo link, no uno nuevo.
              </p>
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <button style={s.btnGhost} disabled={questionnaireSending} onClick={() => void sendQuestionnaire(true)}>
                  {questionnaireSending ? 'Reenviando…' : 'Reenviar el mismo link'}
                </button>
                {questionnaireState.url && (
                  <a href={questionnaireState.url} target="_blank" rel="noopener noreferrer"
                    style={{ ...s.btnGhost, textDecoration: 'none' }}>Ver el cuestionario ↗</a>
                )}
              </div>
              {questionnaireSent && <p style={{ ...s.successText, marginTop: 8 }}>Reenviado</p>}
            </div>
          ) : (
            <LeadActionButton
              hint="Se manda solo cuando agenda la llamada. Este botón es para el que llegó por otro lado: por teléfono, por recomendación o cargado a mano."
              label="Mandarle el cuestionario"
              tone="#0ea5e9"
              busy={questionnaireSending}
              done={questionnaireSent}
              doneLabel="Cuestionario enviado"
              error={questionnaireError}
              onClick={() => void sendQuestionnaire()}
            />
          )}
        </div>
      </LeadSection>

      <LeadSection title="2 · La llamada" defaultOpen={openSections.llamada} hint={llamadaSummary(guideAnswers, respuestasPrevias(respuestasCuestionario))}>
        <CallGuide
          leadId={lead.id}
          form={leadConCuestionario ?? lead}
          answers={guideAnswers}
          // Lo que el cliente escribió antes de la llamada, ubicado en la
          // pregunta que le corresponde: la guía deja de pedir de nuevo lo
          // que ya está contestado.
          previas={respuestasPrevias(respuestasCuestionario)}
          onAnswer={(questionId, value) => setGuideAnswers((prev) => ({ ...prev, [questionId]: value }))}
          service={lead.tipo_proyecto}
          onSave={() => void saveDiagnosis()}
          saved={diagSaved}
          onApplyModules={(slugs) => {
            // Lo que la IA recomendó queda tildado en la calculadora: el salto
            // entre «esto le ofrezco» y «esto cotizo» era a mano y se perdía.
            setPertRows((rows) => rows.map((row) => (
              slugs.includes(row.slug) ? { ...row, selected: true } : row
            )));
          }}
        />

        {lead.transcripcion && (
          <div style={{ marginTop: 18 }}>
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
      </LeadSection>

      {/* Budget Calculator */}
      <LeadSection title="3 · El presupuesto" defaultOpen={openSections.diagnostico} hint={diagnosticoSummary(lead)}>
        <LeadBudgetSection
          lead={lead}
          rateConfig={rateConfig}
          baseModules={baseModules}
          featureModules={featureModules}
          presupuesto={presupuesto}
          paqueteSlug={paqueteSlug}
          extrasIds={extrasIds}
          onPaquete={elegirPaquete}
          onExtra={toggleExtra}
          updatePertRow={updatePertRow}
          saveBudget={saveBudget}
          budgetSaved={budgetSaved}
          mantenimiento={mantenimiento}
          onMantenimiento={setMantenimiento}
          fmt={fmt}
        />
      </LeadSection>

      {/* ── 4 · LA VENTA ──────────────────────────────────────────────── */}
      <LeadSection title="4 · El cierre" defaultOpen={openSections.venta} hint={ventaSummary(lead)}>
        <LeadCierre
          lead={lead}
          fmt={fmt}
          enviarPropuesta={sendProposalEmail}
          propuestaEnviando={proposalSending}
          enviarContrato={sendContractEmail}
          contratoEnviando={contractSending}
          descargarContrato={downloadContract}
          contratoDescargando={contractLoading}
          urlDelCliente={
            // El link del cliente muestra lo que le toca ahora; el de la
            // propuesta, solo esa pantalla.
            lead.lead_token
              ? `/cliente/${lead.lead_token}`
              : lead.propuesta_token
                ? `/propuesta/${lead.propuesta_token}`
                : null
          }
          aviso={
            proposalEmailError || contractEmailError
              ? { texto: proposalEmailError || contractEmailError, error: true }
              : proposalEmailSent
                ? { texto: 'Propuesta enviada' }
                : contractEmailSent
                  ? { texto: 'Contrato enviado' }
                  : null
          }
        />

        <div style={{ marginTop: 22 }}>
          <LeadSaleHistory lead={lead} fmt={fmt} />
        </div>
      </LeadSection>
    </div>
  );
}

