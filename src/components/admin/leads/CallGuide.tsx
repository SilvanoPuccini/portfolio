'use client';

import { useEffect, useRef, useState } from 'react';
import { s } from '@/components/admin/AdminShell';
import { c } from '@/components/admin/tokens';
import {
  CALL_GUIDE, GUIDE_MINUTES, guideProgress, missingFromForm, qualification,
  qualificationScore, stageProgress, type FormAnswers, type GuideAnswers, type GuideStage,
} from '@/lib/leads/call-guide';
import { useDictation } from '@/components/admin/leads/useDictation';
import type { Recommendation } from '@/lib/leads/recommendation';

/**
 * La guía de la llamada: la única pantalla que se mira mientras se habla.
 *
 * Una casilla por pregunta, no una por etapa: al escribir en la casilla de
 * «cuánto te cuesta por mes» queda claro qué se preguntó y qué no, y de ahí
 * sale el semáforo sin tener que contestar un cuestionario aparte.
 *
 * Muestra una etapa por vez a propósito. Ocho etapas abiertas son una lista;
 * una sola, con su reloj y su cierre, es una conversación.
 */

/** El minuto de la llamada manda: la etapa que toca es la del reloj. */
function stageAtMinute(minute: number): number {
  const index = CALL_GUIDE.findIndex((stage) => minute >= stage.from && minute < stage.to);
  return index === -1 ? CALL_GUIDE.length - 1 : index;
}

/** Lo que el cliente ya contestó, para no volver a preguntarlo. */
function ClientContext({ form, service }: { form: FormAnswers; service?: string | null }) {
  const rows: [string, string][] = ([
    ['Negocio', form.que_construir ?? ''],
    ['Problema', form.problema ?? ''],
    ['Servicio', service ?? ''],
    ['Presupuesto', form.presupuesto_rango ?? ''],
    ['Plazo', form.plazo ?? ''],
  ] as [string, string][]).filter((row) => Boolean(row[1]?.trim()));

  if (rows.length === 0) return null;

  return (
    <div style={{
      border: `1px solid ${c.border}`, borderRadius: 8, padding: '10px 12px',
      background: 'rgba(255,255,255,0.02)', display: 'grid', gap: 6,
    }}>
      <p style={{ ...s.label, marginBottom: 0 }}>Ya te lo contestó — no lo repreguntes</p>
      {rows.map(([label, value]) => (
        <p key={label} style={{ margin: 0, fontSize: 12.5, color: c.textSoft, lineHeight: 1.5 }}>
          <span style={{ color: c.textDim }}>{label}:</span> {value}
        </p>
      ))}
    </div>
  );
}

/** Una pregunta con su casilla y, si el navegador lo permite, su dictado. */
function Question({ id, text, value, onChange }: {
  id: string; text: string; value: string; onChange: (value: string) => void;
}) {
  const { supported, listening, toggle } = useDictation((chunk) => {
    onChange(value ? `${value} ${chunk}` : chunk);
  });

  return (
    <div style={{ display: 'grid', gap: 5 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <label htmlFor={id} style={{ fontSize: 14, color: c.text, lineHeight: 1.5, flex: 1 }}>{text}</label>
        {supported && (
          <button
            type="button"
            aria-label={listening ? `Dejar de dictar: ${text}` : `Dictar: ${text}`}
            onClick={toggle}
            style={{
              background: listening ? c.late : 'transparent', border: `1px solid ${c.border}`,
              borderRadius: 6, cursor: 'pointer', fontSize: 12, padding: '2px 8px',
              color: listening ? c.page : c.textDim,
            }}
          >🎤</button>
        )}
      </div>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Con sus palabras…"
        style={{ ...s.input, minHeight: 58, lineHeight: 1.5, resize: 'vertical' }}
      />
    </div>
  );
}

export function CallGuide({ leadId, form, service, answers, onAnswer, onSave, saved, onApplyModules }: {
  leadId: string;
  form: FormAnswers;
  service?: string | null;
  answers: GuideAnswers;
  onAnswer: (questionId: string, value: string) => void;
  onSave: () => void;
  saved: boolean;
  /** Tilda en la calculadora los módulos que la IA recomendó. */
  onApplyModules?: (slugs: string[]) => void;
}) {
  const [index, setIndex] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [minute, setMinute] = useState(0);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [applied, setApplied] = useState(false);
  const followClock = useRef(true);

  // El reloj corre solo y arrastra la etapa, salvo que hayas navegado a mano:
  // si estiraste una pregunta, la guía no puede cambiarte de tema sola.
  useEffect(() => {
    if (startedAt === null) return;
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 60_000);
      setMinute(elapsed);
      if (followClock.current) setIndex(stageAtMinute(elapsed));
    }, 5_000);
    return () => clearInterval(id);
  }, [startedAt]);

  const stage: GuideStage = CALL_GUIDE[index];
  const progress = guideProgress(answers);
  const score = qualificationScore(answers);
  const stageDone = stageProgress(stage, answers);
  const missing = missingFromForm(form);

  function goTo(next: number) {
    followClock.current = false;
    setIndex(Math.max(0, Math.min(CALL_GUIDE.length - 1, next)));
  }

  async function loadRecommendation(refresh = false) {
    setBusy(true);
    setError('');
    setApplied(false);
    const response = await fetch(`/api/admin/leads/${leadId}/recommendation${refresh ? '?refresh=1' : ''}`);
    const json = await response.json().catch(() => ({})) as Recommendation & { error?: string };
    setBusy(false);
    if (!response.ok) return setError(json.error ?? 'No se pudo armar la recomendación');
    setRecommendation(json);
  }

  const chip = (done: boolean, current: boolean) => ({
    width: 26, height: 26, borderRadius: 6, cursor: 'pointer', fontSize: 11,
    fontFamily: 'monospace', fontWeight: 700,
    border: `1px solid ${current ? c.ready : c.border}`,
    background: current ? c.ready : 'transparent',
    color: current ? c.page : (done ? c.published : c.textDim),
  });

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {/* Control: el reloj, el avance y el salto entre etapas. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button style={s.btn} onClick={() => { setStartedAt(Date.now()); setMinute(0); followClock.current = true; setIndex(0); }}>
          {startedAt === null ? 'Empezar la llamada' : 'Reiniciar'}
        </button>
        <span style={{ fontFamily: 'monospace', fontSize: 13, color: startedAt === null ? c.textDim : c.ready }}>
          {startedAt === null ? `${GUIDE_MINUTES} min` : `minuto ${minute} de ${GUIDE_MINUTES}`}
        </span>
        <span style={{ ...s.label, marginBottom: 0 }}>{progress.filled} de {progress.total} preguntas</span>

        <span style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
          {CALL_GUIDE.map((candidate, i) => (
            <button
              key={candidate.id}
              aria-label={`Ir a ${candidate.title}`}
              title={candidate.title}
              style={chip(stageProgress(candidate, answers).filled > 0, i === index)}
              onClick={() => goTo(i)}
            >{i + 1}</button>
          ))}
        </span>
      </div>

      {/* El semáforo: sin estas siete cosas la venta no se sostiene. */}
      <div style={{
        display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center',
        border: `1px solid ${score.ok >= 5 ? c.published : c.border}`, borderRadius: 8, padding: '9px 12px',
      }}>
        <span style={{ ...s.label, marginBottom: 0 }}>Calificación {score.ok}/{score.total}</span>
        {qualification(answers).map((check) => (
          <span
            key={check.id}
            style={{
              fontSize: 11.5, fontFamily: 'monospace', padding: '2px 7px', borderRadius: 5,
              color: check.ok ? c.published : c.textDim,
              border: `1px solid ${check.ok ? c.published : c.border}`,
            }}
          >{check.ok ? '✓' : '·'} {check.label}</span>
        ))}
        {score.ok <= 3 && (
          <span style={{ fontSize: 12, color: c.incomplete }}>Con menos de cuatro, esa propuesta se enfría.</span>
        )}
      </div>

      <ClientContext form={form} service={service} />

      {missing.length > 0 && (
        <p style={{ margin: 0, fontSize: 12, color: c.incomplete, lineHeight: 1.6 }}>
          <strong>Averiguá:</strong> {missing.join(' · ')}
        </p>
      )}

      {/* La etapa que toca, sola, con una casilla por pregunta. */}
      <section style={{ border: `1px solid ${c.ready}`, borderRadius: 10, padding: 14, display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'monospace', fontSize: 11, color: c.ready }}>{stage.from}–{stage.to}′</span>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: c.text }}>{stage.title}</h3>
          {stage.spin && (
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: c.textDim }}>SPIN · {stage.spin}</span>
          )}
          <span style={{ ...s.label, marginBottom: 0, marginLeft: 'auto' }}>
            {stageDone.filled}/{stageDone.total}
          </span>
        </div>

        {stage.questions.map((question) => (
          <Question
            key={question.id}
            id={question.id}
            text={question.text}
            value={answers[question.id] ?? ''}
            onChange={(value) => onAnswer(question.id, value)}
          />
        ))}

        <p style={{ margin: 0, fontSize: 12.5, color: c.textSoft, lineHeight: 1.55 }}>
          <strong style={{ color: c.textDim }}>Escuchá:</strong> {stage.listenFor}
        </p>

        {/* El cierre: lo que el cliente tiene que confirmar antes de seguir. */}
        <p style={{
          margin: 0, fontSize: 13, color: c.text, lineHeight: 1.55,
          borderLeft: `2px solid ${c.ready}`, paddingLeft: 10,
        }}>
          <strong style={{ color: c.ready }}>Cerrás cuando:</strong> {stage.close}
        </p>

        {stage.flags.map((flag) => (
          <p key={flag} style={{ margin: 0, fontSize: 12.5, color: c.incomplete, lineHeight: 1.55 }}>⚠ {flag}</p>
        ))}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button style={s.btnGhost} onClick={() => goTo(index - 1)} disabled={index === 0}>← Anterior</button>
          <button style={s.btnGhost} onClick={() => goTo(index + 1)} disabled={index === CALL_GUIDE.length - 1}>
            Siguiente →
          </button>
          <button style={s.btn} onClick={onSave}>Guardar lo anotado</button>
          {saved && <span style={s.successText}>Guardado</span>}
        </div>
      </section>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button style={s.btn} disabled={busy} onClick={() => void loadRecommendation()}>
          {busy ? 'Pensando…' : 'Qué ofrecerle'}
        </button>
        {recommendation && (
          <button style={s.btnGhost} disabled={busy} onClick={() => void loadRecommendation(true)}>Rehacer</button>
        )}
      </div>

      {error && <p role="alert" style={s.errorText}>{error}</p>}

      {recommendation && (
        <div style={{ display: 'grid', gap: 10, border: `1px solid ${c.border}`, borderRadius: 10, padding: 14 }}>
          <p style={{ ...s.label, marginBottom: 0 }}>Recomendación · confianza {recommendation.confianza}</p>

          <p style={{ margin: 0, fontSize: 13.5, color: c.text, lineHeight: 1.6 }}>
            <strong>Problema:</strong> {recommendation.problema}
          </p>
          <p style={{ margin: 0, fontSize: 13.5, color: c.text, lineHeight: 1.6 }}>
            <strong>Solución:</strong> {recommendation.solucion}
          </p>

          {/* Lo que falta preguntar va primero: con el diagnóstico flojo, lo que
              toca es volver a preguntar, no elegir módulos. */}
          {recommendation.falta_preguntar?.length > 0 && (
            <div>
              <p style={{ ...s.label, marginBottom: 4, color: c.incomplete }}>Te falta preguntar</p>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {recommendation.falta_preguntar.map((item) => (
                  <li key={item} style={{ fontSize: 13, color: c.incomplete, lineHeight: 1.55 }}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {recommendation.modulos?.length > 0 && (
            <div>
              <p style={{ ...s.label, marginBottom: 4 }}>Módulos</p>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {recommendation.modulos.map((mod) => (
                  <li key={mod.slug} style={{ fontSize: 13, color: c.text, lineHeight: 1.55 }}>
                    <span style={{ fontFamily: 'monospace' }}>{mod.slug}</span> — {mod.porque}
                  </li>
                ))}
              </ul>
              {onApplyModules && (
                <button
                  style={{ ...s.btnGhost, marginTop: 8 }}
                  onClick={() => {
                    onApplyModules(recommendation.modulos.map((mod) => mod.slug));
                    setApplied(true);
                  }}
                >
                  {applied ? '✓ Cargados en el presupuesto' : 'Cargar en el presupuesto'}
                </button>
              )}
            </div>
          )}

          {recommendation.no_ofrecer?.length > 0 && (
            <div>
              <p style={{ ...s.label, marginBottom: 4 }}>No le ofrezcas</p>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {recommendation.no_ofrecer.map((item) => (
                  <li key={item.que} style={{ fontSize: 13, color: c.textSoft, lineHeight: 1.55 }}>
                    {item.que} — {item.porque}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recommendation.objeciones?.length > 0 && (
            <div>
              <p style={{ ...s.label, marginBottom: 4 }}>Va a objetar</p>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {recommendation.objeciones.map((item) => (
                  <li key={item.objecion} style={{ fontSize: 13, color: c.text, lineHeight: 1.55 }}>
                    <strong>{item.objecion}</strong> → {item.respuesta}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
