'use client';

import { useState } from 'react';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthed(true);
      setAuthError('');
    } else {
      setAuthError('Contraseña incorrecta.');
    }
  }

  async function handleNotify(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_NOTIFY_SECRET}`,
        },
        body: JSON.stringify({ title, slug, excerpt }),
      });

      let data: { error?: string; sent?: number; message?: string } = {};
      try {
        data = await res.json();
      } catch {
        setStatus('error');
        setMessage(`Error HTTP ${res.status} — respuesta inválida del servidor.`);
        return;
      }

      if (!res.ok) {
        setStatus('error');
        setMessage(data.error ?? `Error ${res.status}`);
        return;
      }

      setStatus('success');
      setMessage(`✓ Newsletter enviado a ${data.sent} suscriptores.`);
      setTitle('');
      setSlug('');
      setExcerpt('');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Error inesperado.');
    }
  }

  if (!authed) {
    return (
      <div style={styles.center}>
        <div style={styles.card}>
          <h1 style={styles.heading}>Admin · El Radar</h1>
          <form onSubmit={handleLogin} style={styles.form}>
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              autoFocus
            />
            {authError && <p style={styles.error}>{authError}</p>}
            <button type="submit" style={styles.button}>Ingresar</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.center}>
      <div style={{ ...styles.card, maxWidth: 560 }}>
        <h1 style={styles.heading}>Panel Admin · El Radar</h1>
        <p style={styles.subtitle}>Enviá el newsletter a todos tus suscriptores.</p>

        <form onSubmit={handleNotify} style={styles.form}>
          <label style={styles.label}>Título del post</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Por qué el 99% falla en su primer año como dev"
            style={styles.input}
            required
          />

          <label style={styles.label}>Slug</label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="Ej: por-que-el-99-falla"
            style={styles.input}
            required
          />
          <p style={styles.hint}>
            URL generada: silvanopuccini.dev/blog/<strong>{slug || 'tu-slug'}</strong>
          </p>

          <label style={styles.label}>Excerpt (descripción corta)</label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="1-2 oraciones que generen curiosidad..."
            style={{ ...styles.input, height: 80, resize: 'vertical' }}
            required
          />

          <button
            type="submit"
            style={{
              ...styles.button,
              opacity: status === 'loading' ? 0.6 : 1,
              cursor: status === 'loading' ? 'not-allowed' : 'pointer',
            }}
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Enviando...' : 'Enviar newsletter →'}
          </button>

          {message && (
            <p style={status === 'success' ? styles.success : styles.error}>
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  center: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  card: {
    background: '#111827',
    border: '1px solid #1e293b',
    borderRadius: '12px',
    padding: '40px',
    width: '100%',
    maxWidth: '400px',
  },
  heading: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#00d4d4',
    marginBottom: '8px',
  },
  subtitle: {
    color: '#64748b',
    fontSize: '14px',
    marginBottom: '24px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  label: {
    fontSize: '13px',
    color: '#94a3b8',
    marginBottom: '-4px',
  },
  input: {
    background: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#e2e8f0',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  hint: {
    fontSize: '12px',
    color: '#475569',
    marginTop: '-4px',
  },
  button: {
    background: '#00d4d4',
    color: '#0a0a14',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 20px',
    fontWeight: 700,
    fontSize: '14px',
    cursor: 'pointer',
    marginTop: '8px',
  },
  success: {
    color: '#4ade80',
    fontSize: '14px',
  },
  error: {
    color: '#f87171',
    fontSize: '14px',
  },
};
