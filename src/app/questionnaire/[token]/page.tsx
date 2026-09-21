'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

/**
 * Las preguntas previas a la llamada.
 *
 * No son «para conocerse»: cada una llena un casillero de la calificación
 * —problema, impacto, alternativas, quién decide, plazo y presupuesto—, que es
 * lo que después dice si esa venta se puede cerrar. Si llegan contestadas, los
 * 45 minutos de la llamada se usan para profundizar y no para recolectar.
 *
 * Están escritas como se habla acá y cada una trae un ejemplo. Una pregunta
 * abstracta («¿cómo se ve el éxito para usted?») se contesta con una
 * abstracción, y con eso no se puede cotizar nada.
 */
const QUESTIONS = [
  {
    text: '¿Cómo hacés hoy eso que querés mejorar?',
    hint: 'Contalo como se lo contarías a alguien que arranca mañana. Ej.: «los pedidos me llegan por WhatsApp, los anoto en un cuaderno y después los paso a un Excel».',
  },
  {
    text: '¿Qué es lo que más te está costando de hacerlo así?',
    hint: 'Si podés, ponele número: horas por semana, pedidos que se pierden, plata. Ej.: «pierdo 2 horas por día cargando datos» o «se me caen 3 pedidos por mes».',
  },
  {
    text: '¿Ya intentaste resolverlo de otra forma?',
    hint: 'Una app, un Excel, alguien que te lo hizo antes, un sistema que compraste. Contame qué pasó y por qué no terminó de funcionar.',
  },
  {
    text: 'Si decidimos avanzar, ¿la decisión la tomás vos o hay alguien más?',
    hint: 'Ej.: «la tomo yo», «lo decidimos con mi socio», «lo tiene que aprobar mi contador». Sirve para saber a quién sumar a la llamada.',
  },
  {
    text: '¿Para cuándo necesitás tenerlo funcionando y por qué esa fecha?',
    hint: 'El motivo importa más que la fecha. Ej.: «antes de la temporada de verano», «cuando abra el local nuevo», «no tengo apuro».',
  },
  {
    text: '¿Con qué presupuesto te estás manejando para esto?',
    hint: 'Un rango alcanza. No es un compromiso: me sirve para proponerte algo que entre, en vez de hacerte perder el tiempo.',
  },
  {
    text: '¿Algo más que quieras contarme antes de hablar?',
    hint: 'Links de páginas que te gusten, una referencia, algo que te preocupe. Opcional.',
  },
] as const;

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
  const [answers, setAnswers] = useState<string[]>(QUESTIONS.map(() => ''));
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
        const body = await res.json() as { completed?: boolean };
        if (body.completed) {
          setPageState('completed');
        } else {
          setPageState('form');
        }
      })
      .catch(() => setPageState('not-found'));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPageState('submitting');

    const answersObj: Record<string, string> = {};
    QUESTIONS.forEach((q, i) => {
      answersObj[`q${i + 1}`] = answers[i];
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

  function updateAnswer(index: number, value: string) {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
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
              Son siete preguntas y te llevan unos minutos. Con esto llego a la llamada entendiendo tu
              situación, y los 45 minutos los usamos para resolver, no para tomar datos. Contestá lo que
              puedas: si algo no lo sabés, dejalo vacío y lo vemos hablando.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {QUESTIONS.map((question, index) => (
                <div key={index}>
                  <label style={labelStyle} htmlFor={`q${index + 1}`}>
                    {index + 1}. {question.text}
                  </label>
                  {/* El ejemplo va arriba del campo, no en el placeholder: el
                      placeholder desaparece justo cuando se empieza a escribir. */}
                  <p style={{ fontSize: 12.5, color: '#64748b', margin: '0 0 8px', lineHeight: 1.55 }}>
                    {question.hint}
                  </p>
                  <textarea
                    id={`q${index + 1}`}
                    style={textareaStyle}
                    value={answers[index]}
                    onChange={(e) => updateAnswer(index, e.target.value)}
                    placeholder="Escribí acá…"
                    disabled={pageState === 'submitting'}
                  />
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
