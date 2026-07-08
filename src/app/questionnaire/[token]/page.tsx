'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

const QUESTIONS = [
  'What is the main problem you are trying to solve?',
  'What does success look like for you in 6 months?',
  'Have you tried other solutions? If yes, what happened?',
  'Who else is involved in this decision?',
  'What is your expected timeline to start?',
  'Is there anything else you want us to know?',
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
        setErrorMsg(body.error ?? 'An error occurred. Please try again.');
        setPageState('error');
      }
    } catch {
      setErrorMsg('Network error. Please check your connection and try again.');
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
          <p style={{ color: '#475569', fontSize: 14, margin: 0 }}>Loading...</p>
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
              Not found
            </p>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#ffffff', margin: '0 0 12px' }}>
              Link not found or expired
            </h1>
            <p style={{ fontSize: 14, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
              This questionnaire link is no longer valid. Please contact us if you believe this is
              an error.
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
              Completed
            </p>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#ffffff', margin: '0 0 12px' }}>
              Thank you, your answers have already been received
            </h1>
            <p style={{ fontSize: 14, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
              We have received your responses and will be in touch shortly.
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
              Submitted
            </p>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#ffffff', margin: '0 0 12px' }}>
              Thank you for your answers
            </h1>
            <p style={{ fontSize: 14, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
              We have received your responses and will be in touch shortly.
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
              Something went wrong
            </h1>
            <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 20px', lineHeight: 1.6 }}>
              {errorMsg}
            </p>
            <button style={btnStyle} onClick={() => setPageState('form')}>
              Try again
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
              Questionnaire
            </p>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#ffffff', margin: '0 0 6px' }}>
              Tell us about your project
            </h1>
            <p style={{ fontSize: 13, color: '#475569', margin: '0 0 32px', lineHeight: 1.6 }}>
              Please take a few minutes to answer the questions below. Your answers help us
              understand your needs and prepare a tailored proposal.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {QUESTIONS.map((question, index) => (
                <div key={index}>
                  <label style={labelStyle}>
                    {index + 1}. {question}
                  </label>
                  <textarea
                    style={textareaStyle}
                    value={answers[index]}
                    onChange={(e) => updateAnswer(index, e.target.value)}
                    placeholder="Your answer..."
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
                  {pageState === 'submitting' ? 'Submitting...' : 'Submit answers'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
