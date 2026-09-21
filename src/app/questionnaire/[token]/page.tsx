'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import type { PlannedQuestion } from '@/lib/leads/questionnaire-plan';

/** Las preguntas las decide el servidor: son las que a este cliente le faltan. */
type Question = PlannedQuestion & { opciones?: string[] };

type PageState = 'loading' | 'not-found' | 'completed' | 'form' | 'submitting' | 'success' | 'error';

const cardStyle: React.CSSProperties = {
  background: '#111827',
  border: '1px solid #1e293b',
  borderRadius: 12,
  padding: 32,
  width: '100%',
  maxWidth: 640,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#94a3b8',
  marginBottom: 8,
};

const textareaStyle: React.CSSProperties = {
  background: '#0f172a',
  border: '1px solid #1e293b',
  borderRadius: 8,
  padding: '10px 14px',
  color: '#e2e8f0',
  fontSize: 14,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  minHeight: 100,
  resize: 'vertical',
  lineHeight: 1.6,
};

const btnStyle: React.CSSProperties = {
  background: '#00d4d4',
  color: '#0a0a14',
  border: 'none',
  borderRadius: 8,
  padding: '12px 28px',
  fontWeight: 700,
  fontSize: 14,
  cursor: 'pointer',
};

export default function QuestionnairePage() {
  const { token } = useParams<{ token: string }>();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setPageState('not-found');
      return;
    }

    fetch(`/api/questionnaire/check?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (res.status === 404) {
          setPageState('not-found');
          return;
        }
        if (!res.ok) {
          const body = await res.json() as { completed?: boolean };
          if (body.completed) {
            setPageState('completed');
          } else {
            setPageState('not-found');
          }
          return;
        }
        const body = await res.json() as { completed?: boolean; questions?: Question[] };
        if (body.completed) {
          setPageState('completed');
        } else {
          setQuestions(body.questions ?? []);
          setPageState('form');
        }
      })
      .catch(() => setPageState('not-found'));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPageState('submitting');

    const answersObj: Record<string, string> = {};
    questions.forEach((question) => {
      answersObj[question.key] = answers[question.key] ?? '';
    });

    try {
      const res = await fetch('/api/questionnaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, answers: answersObj }),
      });

      if (res.ok) {
        setPageState('success');
      } else if (res.status === 409) {
        setPageState('completed');
      } else {
        const body = await res.json() as { error?: string };
        setErrorMsg(body.error ?? 'No se pudieron guardar tus respuestas. Probá de nuevo.');
        setPageState('error');
      }
    } catch {
      setErrorMsg('Se cortó la conexión. Revisá internet y probá de nuevo: no se perdió lo que escribiste.');
      setPageState('error');
    }
  }

  function updateAnswer(key: string, value: string) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a14',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '48px 24px',
      }}
    >
      <div style={cardStyle}>
        {pageState === 'loading' && (
          <p style={{ color: '#475569', fontSize: 14, margin: 0 }}>Cargando…</p>
        )}

        {pageState === 'not-found' && (
          <>
            <p
              style={{
                fontFamily: 'monospace',
                fontSize: 11,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#f87171',
                margin: '0 0 12px',
              }}
            >
              Link vencido
            </p>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#ffffff', margin: '0 0 12px' }}>
              Este link ya no sirve
            </h1>
            <p style={{ fontSize: 14, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
              Puede que lo hayas contestado o que te haya mandado uno nuevo. Escribime y te paso el que va.
            </p>
          </>
        )}

        {pageState === 'completed' && (
          <>
            <p
              style={{
                fontFamily: 'monospace',
                fontSize: 11,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#4ade80',
                margin: '0 0 12px',
              }}
            >
              Ya contestado
            </p>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#ffffff', margin: '0 0 12px' }}>
              Ya tengo tus respuestas
            </h1>
            <p style={{ fontSize: 14, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
              Ya tengo tus respuestas. Te escribo en breve.
            </p>
          </>
        )}

        {pageState === 'success' && (
          <>
            <p
              style={{
                fontFamily: 'monospace',
                fontSize: 11,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#4ade80',
                margin: '0 0 12px',
              }}
            >
              Enviado
            </p>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#ffffff', margin: '0 0 12px' }}>
              Gracias, ya está
            </h1>
            <p style={{ fontSize: 14, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
              Con esto llego a la llamada sabiendo de qué hablamos. Nos vemos.
            </p>
          </>
        )}

        {pageState === 'error' && (
          <>
            <p
              style={{
                fontFamily: 'monospace',
                fontSize: 11,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#f87171',
                margin: '0 0 12px',
              }}
            >
              Error
            </p>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#ffffff', margin: '0 0 12px' }}>
              No se pudo guardar
            </h1>
            <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 20px', lineHeight: 1.6 }}>
              {errorMsg}
            </p>
            <button style={btnStyle} onClick={() => setPageState('form')}>
              Probar de nuevo
            </button>
          </>
        )}

        {(pageState === 'form' || pageState === 'submitting') && (
          <>
            <p
              style={{
                fontFamily: 'monospace',
                fontSize: 11,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#00d4d4',
                margin: '0 0 8px',
              }}
            >
              Antes de la llamada
            </p>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#ffffff', margin: '0 0 6px' }}>
              Contame de tu proyecto
            </h1>
            <p style={{ fontSize: 13, color: '#475569', margin: '0 0 32px', lineHeight: 1.6 }}>
              {questions.length === 1
                ? 'Queda una sola pregunta: el resto ya me lo contaste.'
                : `Son ${questions.length} preguntas y te llevan unos minutos.`}{' '}
              Solo están las que todavía no contestaste. Con esto llego a la llamada entendiendo tu
              situación, y los 45 minutos los usamos para resolver, no para tomar datos. Si algo no lo
              sabés, dejalo vacío y lo vemos hablando.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {questions.map((question, index) => (
                <div key={question.key}>
                  <label style={labelStyle} htmlFor={question.key}>
                    {index + 1}. {question.text}
                  </label>
                  {/* El ejemplo va arriba del campo, no en el placeholder: el
                      placeholder desaparece justo cuando se empieza a escribir. */}
                  <p style={{ fontSize: 12.5, color: '#64748b', margin: '0 0 8px', lineHeight: 1.55 }}>
                    {question.hint}
                  </p>
                  {question.opciones ? (
                    <select
                      id={question.key}
                      style={{ ...textareaStyle, minHeight: 0, height: 44 }}
                      value={answers[question.key] ?? ''}
                      onChange={(e) => updateAnswer(question.key, e.target.value)}
                      disabled={pageState === 'submitting'}
                    >
                      <option value="">Elegí una opción</option>
                      {question.opciones.map((opcion) => (
                        <option key={opcion} value={opcion}>{opcion}</option>
                      ))}
                    </select>
                  ) : (
                    <textarea
                      id={question.key}
                      style={textareaStyle}
                      value={answers[question.key] ?? ''}
                      onChange={(e) => updateAnswer(question.key, e.target.value)}
                      placeholder="Escribí acá…"
                      disabled={pageState === 'submitting'}
                    />
                  )}
                </div>
              ))}

              <div style={{ marginTop: 8 }}>
                <button
                  type="submit"
                  style={{
                    ...btnStyle,
                    opacity: pageState === 'submitting' ? 0.7 : 1,
                    cursor: pageState === 'submitting' ? 'not-allowed' : 'pointer',
                  }}
                  disabled={pageState === 'submitting'}
                >
                  {pageState === 'submitting' ? 'Enviando…' : 'Enviar respuestas'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
