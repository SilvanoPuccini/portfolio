'use client';

import { useState } from 'react';
import { s } from '@/components/admin/AdminShell';
import { c } from '@/components/admin/tokens';
import {
  CALL_GUIDE, GUIDE_MINUTES, guideProgress, isBlockDone, missingFromForm,
  type DiagnosisField, type FormAnswers,
} from '@/lib/leads/call-guide';
import type { Recommendation } from '@/lib/leads/recommendation';

/**
 * La guía de la llamada, para tener abierta mientras se habla.
 *
 * No es un formulario nuevo: cada bloque escribe en el campo de diagnóstico
 * que ya existía. Lo único que agrega es el orden de la conversación, las
 * preguntas y qué escuchar — que hasta ahora vivían en la cabeza de quien
 * atendía la llamada.
 */

type Values = Partial<Record<DiagnosisField, string>>;

export function CallGuide({ leadId, form, values, onChange, onSave, saved }: {
  leadId: string;
  form: FormAnswers;
  values: Values;
  onChange: (field: DiagnosisField, value: string) => void;
  onSave: () => void;
  saved: boolean;
}) {
  const [open, setOpen] = useState<string>(CALL_GUIDE[0].id);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const progress = guideProgress(values);
  const missing = missingFromForm(form);

  async function loadRecommendation(refresh = false) {
    setBusy(true);
    setError('');
    const response = await fetch(`/api/admin/leads/${leadId}/recommendation${refresh ? '?refresh=1' : ''}`);
    const json = await response.json().catch(() => ({})) as Recommendation & { error?: string };
    setBusy(false);
    if (!response.ok) return setError(json.error ?? 'No se pudo armar la recomendación');
    setRecommendation(json);
  }

  const field = { ...s.input, minHeight: 70, lineHeight: 1.55, resize: 'vertical' as const };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <span style={{ ...s.label, marginBottom: 0 }}>
          {progress.filled} de {progress.total} cargados · {GUIDE_MINUTES} min
        </span>
        <button style={{ ...s.btnGhost }} onClick={onSave}>Guardar lo anotado</button>
        {saved && <span style={s.successText}>Guardado</span>}
      </div>

      {/* Lo que el cliente no contestó en la web es justo lo que hay que
          averiguar hablando. Lo que sí contestó no se vuelve a preguntar. */}
      {missing.length > 0 && (
        <div style={{
          border: `1px solid ${c.border}`, borderRadius: 8, padding: '10px 12px',
          marginBottom: 12, background: 'rgba(255,255,255,0.02)',
        }}>
          <p style={{ ...s.label, marginBottom: 6 }}>No lo contestó en el formulario — averigualo</p>
          <p style={{ margin: 0, fontSize: 12.5, color: c.textSoft, lineHeight: 1.6 }}>
            {missing.join(' · ')}
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gap: 8 }}>
        {CALL_GUIDE.map((block) => {
          const isOpen = open === block.id;
          const done = isBlockDone(block, values);

          return (
            <section key={block.id} style={{ border: `1px solid ${c.border}`, borderRadius: 8 }}>
              <button
                onClick={() => setOpen(isOpen ? '' : block.id)}
                aria-expanded={isOpen}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  padding: '10px 12px', textAlign: 'left', color: c.text,
                }}
              >
                <span style={{ fontFamily: 'monospace', fontSize: 11, color: c.textDim }}>
                  {block.from}–{block.to}′
                </span>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>{block.title}</span>
                {done && <span style={{ fontSize: 11, color: c.published }}>✓</span>}
              </button>

              {isOpen && (
                <div style={{ padding: '0 12px 12px', display: 'grid', gap: 8 }}>
                  <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 5 }}>
                    {block.questions.map((question) => (
                      <li key={question} style={{ fontSize: 13.5, color: c.text, lineHeight: 1.55 }}>{question}</li>
                    ))}
                  </ul>

                  <p style={{ margin: 0, fontSize: 12, color: c.textSoft, lineHeight: 1.55 }}>
                    <strong style={{ color: c.textDim }}>Escuchá:</strong> {block.listenFor}
                  </p>

                  {block.flags.map((flag) => (
                    <p key={flag} style={{ margin: 0, fontSize: 12, color: c.incomplete, lineHeight: 1.55 }}>
                      ⚠ {flag}
                    </p>
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
                </div>
              )}
            </section>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
        <button style={s.btn} disabled={busy} onClick={() => void loadRecommendation()}>
          {busy ? 'Pensando…' : 'Qué ofrecerle'}
        </button>
        {recommendation && (
          <button style={s.btnGhost} disabled={busy} onClick={() => void loadRecommendation(true)}>
            Rehacer
          </button>
        )}
      </div>

      {error && <p role="alert" style={{ ...s.errorText, marginTop: 10 }}>{error}</p>}

      {recommendation && (
        <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
          <p style={{ ...s.label, marginBottom: 0 }}>
            Recomendación · confianza {recommendation.confianza}
          </p>

          <p style={{ margin: 0, fontSize: 13.5, color: c.text, lineHeight: 1.6 }}>
            <strong>Problema:</strong> {recommendation.problema}
          </p>
          <p style={{ margin: 0, fontSize: 13.5, color: c.text, lineHeight: 1.6 }}>
            <strong>Solución:</strong> {recommendation.solucion}
          </p>

          {/* Lo que falta preguntar va ARRIBA de los módulos a propósito: si el
              diagnóstico está flojo, lo que hay que hacer es volver a preguntar,
              no elegir módulos. */}
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
