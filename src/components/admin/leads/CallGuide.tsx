'use client';

import { useEffect, useRef, useState } from 'react';
import { s } from '@/components/admin/AdminShell';
import { c } from '@/components/admin/tokens';
import {
  CALL_GUIDE, GUIDE_MINUTES, guideProgress, isBlockDone, missingFromForm,
  type DiagnosisField, type FormAnswers, type GuideBlock,
} from '@/lib/leads/call-guide';
import type { Recommendation } from '@/lib/leads/recommendation';

/**
 * La guía de la llamada: la única pantalla que se mira mientras se habla.
 *
 * Reemplaza a la vieja sección «Diagnóstico», que eran los mismos seis campos
 * sin preguntas. Tenerlas separadas obligaba a elegir entre anotar y leer, y
 * dejaba dos lugares para lo mismo.
 *
 * Muestra un bloque por vez a propósito. Ocho bloques abiertos son una lista;
 * uno solo, con su reloj y sus preguntas, es una conversación.
 */

type Values = Partial<Record<DiagnosisField, string>>;

/** El minuto de la llamada manda: el bloque que toca es el del reloj. */
function blockAtMinute(minute: number): number {
  const index = CALL_GUIDE.findIndex((block) => minute >= block.from && minute < block.to);
  return index === -1 ? CALL_GUIDE.length - 1 : index;
}

/** Lo que el cliente ya contestó, para no volver a preguntarlo. */
function ClientContext({ form, service }: { form: FormAnswers; service?: string | null }) {
  const rows: [string, string][] = [
    ['Negocio', form.que_construir ?? ''],
    ['Problema', form.problema ?? ''],
    ['Servicio', service ?? ''],
    ['Presupuesto', form.presupuesto_rango ?? ''],
    ['Plazo', form.plazo ?? ''],
  ].filter((row): row is [string, string] => Boolean(row[1]?.trim()));

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

export function CallGuide({ leadId, form, service, values, onChange, onSave, saved, onApplyModules }: {
  leadId: string;
  form: FormAnswers;
  service?: string | null;
  values: Values;
  onChange: (field: DiagnosisField, value: string) => void;
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

  // El reloj corre solo y arrastra el bloque, salvo que hayas navegado a mano:
  // si estiraste una pregunta, la guía no puede pasar de tema sola.
  useEffect(() => {
    if (startedAt === null) return;
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 60_000);
      setMinute(elapsed);
      if (followClock.current) setIndex(blockAtMinute(elapsed));
    }, 5_000);
    return () => clearInterval(id);
  }, [startedAt]);

  const block: GuideBlock = CALL_GUIDE[index];
  const progress = guideProgress(values);
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

  const field = { ...s.input, minHeight: 90, lineHeight: 1.55, resize: 'vertical' as const };
  const chip = (done: boolean, current: boolean) => ({
    width: 26, height: 26, borderRadius: 6, cursor: 'pointer', fontSize: 11,
    fontFamily: 'monospace', fontWeight: 700,
    border: `1px solid ${current ? c.ready : c.border}`,
    background: current ? c.ready : 'transparent',
    color: current ? c.page : (done ? c.published : c.textDim),
  });

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {/* Barra de control: el reloj, el avance y el paso entre bloques. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button style={s.btn} onClick={() => { setStartedAt(Date.now()); setMinute(0); followClock.current = true; setIndex(0); }}>
          {startedAt === null ? 'Empezar la llamada' : 'Reiniciar'}
        </button>
        <span style={{ fontFamily: 'monospace', fontSize: 13, color: startedAt === null ? c.textDim : c.ready }}>
          {startedAt === null ? `${GUIDE_MINUTES} min` : `minuto ${minute} de ${GUIDE_MINUTES}`}
        </span>
        <span style={{ ...s.label, marginBottom: 0 }}>{progress.filled} de {progress.total} cargados</span>

        <span style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
          {CALL_GUIDE.map((candidate, i) => (
            <button
              key={candidate.id}
              aria-label={`Ir a ${candidate.title}`}
              title={candidate.title}
              style={chip(isBlockDone(candidate, values), i === index)}
              onClick={() => goTo(i)}
            >{i + 1}</button>
          ))}
        </span>
      </div>

      <ClientContext form={form} service={service} />

      {/* Lo que no contestó en la web es lo que hay que averiguar hablando. */}
      {missing.length > 0 && (
        <p style={{ margin: 0, fontSize: 12, color: c.incomplete, lineHeight: 1.6 }}>
          <strong>Averiguá:</strong> {missing.join(' · ')}
        </p>
      )}

      {/* El bloque que toca, solo. */}
      <section style={{ border: `1px solid ${c.ready}`, borderRadius: 10, padding: 14, display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 11, color: c.ready }}>{block.from}–{block.to}′</span>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: c.text }}>{block.title}</h3>
        </div>

        <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
          {block.questions.map((question) => (
            <li key={question} style={{ fontSize: 14, color: c.text, lineHeight: 1.55 }}>{question}</li>
          ))}
        </ul>

        <p style={{ margin: 0, fontSize: 12.5, color: c.textSoft, lineHeight: 1.55 }}>
          <strong style={{ color: c.textDim }}>Escuchá:</strong> {block.listenFor}
        </p>

        {block.flags.map((flag) => (
          <p key={flag} style={{ margin: 0, fontSize: 12.5, color: c.incomplete, lineHeight: 1.55 }}>⚠ {flag}</p>
        ))}

        {block.field && (
          <textarea
            aria-label={`Anotar ${block.title}`}
            placeholder="Anotá la respuesta con sus palabras…"
            style={field}
            value={values[block.field] ?? ''}
            onChange={(event) => onChange(block.field as DiagnosisField, event.target.value)}
          />
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
