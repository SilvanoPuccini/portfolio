'use client';

import { useState, useEffect, useCallback } from 'react';
import { s } from '@/components/admin/AdminShell';

type Message = { id: string; name: string; email: string; subject: string; message: string; read: boolean; created_at: string };

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const PER_PAGE = 10;

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Message | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/messages', {});
    const data = await res.json() as { messages: Message[] };
    setMessages(data.messages ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function markAsRead(id: string) {
    await fetch('/api/admin/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, read: true } : m));
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, read: true } : null);
  }

  const filtered = filter === 'all' ? messages : messages.filter((m) => !m.read);
  const unread = messages.filter((m) => !m.read).length;
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <p style={s.eyebrow}>Contacto</p>
          <h1 style={{ ...s.heading, marginBottom: 0, fontSize: 24 }}>Mensajes</h1>
        </div>
        <p style={{ color: '#475569', fontSize: 13 }}>{unread > 0 ? `${unread} sin leer` : 'Todo leído'} · {messages.length} total</p>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['all', 'unread'] as const).map((f) => (
          <button key={f} onClick={() => { setFilter(f); setPage(1); }}
            style={{ ...s.btnGhost, color: filter === f ? '#00d4d4' : '#64748b', borderColor: filter === f ? '#00d4d4' : '#1e293b' }}>
            {f === 'all' ? 'Todos' : 'Sin leer'}
          </button>
        ))}
      </div>

      {loading && <p style={{ color: '#475569', fontSize: 13 }}>Cargando...</p>}

      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 16 }}>
          {/* Lista */}
          <div style={s.card}>
            {filtered.length === 0
              ? <p style={{ color: '#475569', fontSize: 13 }}>Sin mensajes.</p>
              : (<>
                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #1e293b' }}>
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                      style={{ background: 'none', border: 'none', color: page === 1 ? '#2a3a50' : '#475569', cursor: page === 1 ? 'default' : 'pointer', fontSize: 12, padding: '2px 6px' }}>← Ant.</button>
                    <span style={{ fontSize: 11, color: '#475569', fontFamily: 'monospace' }}>{page} / {totalPages} · {filtered.length} total</span>
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      style={{ background: 'none', border: 'none', color: page === totalPages ? '#2a3a50' : '#475569', cursor: page === totalPages ? 'default' : 'pointer', fontSize: 12, padding: '2px 6px' }}>Sig. →</button>
                  </div>
                )}
                {paginated.map((msg) => (
                <button key={msg.id} onClick={() => { setSelected(msg); if (!msg.read) markAsRead(msg.id); }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '10px 0', borderBottom: '1px solid #1e293b',
                    background: 'none', border: 'none',
                    cursor: 'pointer',
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: msg.read ? 400 : 600, color: selected?.id === msg.id ? '#00d4d4' : '#e2e8f0', margin: '0 0 2px' }}>
                        {!msg.read && <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#00d4d4', marginRight: 6, verticalAlign: 'middle' }} />}
                        {msg.name}
                      </p>
                      <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>{msg.subject}</p>
                    </div>
                    <p style={{ fontSize: 11, color: '#334155', whiteSpace: 'nowrap', marginLeft: 8 }}>{fmt(msg.created_at)}</p>
                  </div>
                </button>
              ))}
              </>)}
          </div>

          {/* Detalle */}
          {selected && (
            <div style={{ ...s.card, position: 'sticky', top: 72, alignSelf: 'flex-start' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <p style={{ ...s.eyebrow, color: '#475569' }}>{fmt(selected.created_at)}</p>
                  <h2 style={{ fontSize: 16, fontWeight: 600, color: '#fff', margin: '4px 0 2px' }}>{selected.name}</h2>
                  <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{selected.email}</p>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 20 }}>×</button>
              </div>
              <p style={{ ...s.label, marginBottom: 4 }}>Asunto</p>
              <p style={{ fontSize: 14, color: '#e2e8f0', marginBottom: 18 }}>{selected.subject}</p>
              <p style={{ ...s.label, marginBottom: 4 }}>Mensaje</p>
              <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{selected.message}</p>
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #1e293b' }}>
                <a href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject)}`}
                  style={{ ...s.btn, display: 'inline-block', textDecoration: 'none', fontSize: 13 }}>
                  Responder →
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
