'use client';

import { useState, useEffect, useCallback } from 'react';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
const NOTIFY_SECRET = process.env.NEXT_PUBLIC_NOTIFY_SECRET;

type Message = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  created_at: string;
};

export default function MessagesPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Message | null>(null);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/messages', {
        headers: { Authorization: `Bearer ${NOTIFY_SECRET}` },
      });
      const data = await res.json() as { messages: Message[] };
      setMessages(data.messages ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) fetchMessages();
  }, [authed, fetchMessages]);

  async function markAsRead(id: string) {
    await fetch('/api/admin/messages', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${NOTIFY_SECRET}`,
      },
      body: JSON.stringify({ id }),
    });
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, read: true } : m));
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, read: true } : null);
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthed(true);
    } else {
      setAuthError('Contraseña incorrecta.');
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('es-AR', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  const unread = messages.filter((m) => !m.read).length;

  if (!authed) {
    return (
      <div style={styles.center}>
        <div style={styles.card}>
          <h1 style={styles.heading}>Admin · Mensajes</h1>
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
    <div style={{ minHeight: '100vh', padding: '32px 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={styles.heading}>Mensajes de contacto</h1>
            <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
              {unread > 0 ? `${unread} sin leer` : 'Todo leído'}
              {' · '}{messages.length} total
            </p>
          </div>
          <a href="/admin" style={{ color: '#00d4d4', fontSize: 13, textDecoration: 'none' }}>← Newsletter</a>
        </div>

        {loading && <p style={{ color: '#475569', fontSize: 14 }}>Cargando...</p>}

        {!loading && messages.length === 0 && (
          <p style={{ color: '#475569', fontSize: 14 }}>No hay mensajes todavía.</p>
        )}

        {!loading && messages.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 12 }}>
            {/* Lista */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {messages.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => {
                    setSelected(msg);
                    if (!msg.read) markAsRead(msg.id);
                  }}
                  style={{
                    ...styles.messageRow,
                    borderColor: selected?.id === msg.id ? '#00d4d4' : '#1e293b',
                    background: msg.read ? '#0f172a' : '#111827',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ minWidth: 0, textAlign: 'left' }}>
                      <p style={{ fontSize: 13, fontWeight: msg.read ? 400 : 600, color: '#e2e8f0', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {!msg.read && <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#00d4d4', marginRight: 6, verticalAlign: 'middle' }} />}
                        {msg.name}
                      </p>
                      <p style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg.subject}</p>
                    </div>
                    <p style={{ fontSize: 11, color: '#475569', whiteSpace: 'nowrap', flexShrink: 0 }}>{formatDate(msg.created_at)}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Detalle */}
            {selected && (
              <div style={{ ...styles.card, position: 'sticky', top: 24, alignSelf: 'flex-start' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <p style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#00d4d4', marginBottom: 4 }}>
                      {formatDate(selected.created_at)}
                    </p>
                    <h2 style={{ fontSize: 16, fontWeight: 600, color: '#ffffff', marginBottom: 2 }}>{selected.name}</h2>
                    <p style={{ fontSize: 13, color: '#64748b' }}>{selected.email}</p>
                  </div>
                  <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 18, padding: 4 }}>×</button>
                </div>

                <p style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#475569', marginBottom: 6 }}>Asunto</p>
                <p style={{ fontSize: 14, color: '#e2e8f0', marginBottom: 20 }}>{selected.subject}</p>

                <p style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#475569', marginBottom: 6 }}>Mensaje</p>
                <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{selected.message}</p>

                <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #1e293b' }}>
                  <a
                    href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject)}`}
                    style={{ ...styles.button, display: 'inline-block', textDecoration: 'none', fontSize: 13 }}
                  >
                    Responder por email →
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
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
    padding: '32px',
    width: '100%',
  },
  heading: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#00d4d4',
    margin: 0,
    marginBottom: '16px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
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
  button: {
    background: '#00d4d4',
    color: '#0a0a14',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 20px',
    fontWeight: 700,
    fontSize: '13px',
    cursor: 'pointer',
  },
  error: {
    color: '#f87171',
    fontSize: '13px',
    margin: 0,
  },
  messageRow: {
    background: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '8px',
    padding: '12px 14px',
    cursor: 'pointer',
    width: '100%',
    transition: 'border-color 0.15s',
  },
};
