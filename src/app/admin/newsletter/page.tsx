'use client';

import { useState, useEffect, useCallback } from 'react';
import { s } from '@/components/admin/AdminShell';

const AUTH = () => ({ Authorization: `Bearer ${process.env.NEXT_PUBLIC_NOTIFY_SECRET}` });

type Post = {
  slug: string; title: string; excerpt: string; date: string;
  category: string; issue: number; readingTime: string; keyword: string;
};
type Newsletter = { id: string; title: string; slug: string; recipients_count: number; sent_at: string };

const CAT_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  Performance:    { bg: 'rgba(74,222,128,0.08)',  text: '#4ade80', border: 'rgba(74,222,128,0.2)' },
  Producto:       { bg: 'rgba(192,132,252,0.08)', text: '#c084fc', border: 'rgba(192,132,252,0.2)' },
  Automatización: { bg: 'rgba(251,191,36,0.08)',  text: '#fbbf24', border: 'rgba(251,191,36,0.2)' },
  Criterio:       { bg: 'rgba(129,140,248,0.08)', text: '#818cf8', border: 'rgba(129,140,248,0.2)' },
  Editorial:      { bg: 'rgba(34,211,238,0.08)',  text: '#22d3ee', border: 'rgba(34,211,238,0.2)' },
};
const defaultCat = { bg: 'rgba(0,212,212,0.08)', text: '#00d4d4', border: 'rgba(0,212,212,0.2)' };

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function fmtDate(dateStr: string) {
  const d = new Date(dateStr);
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function NewsletterPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [history, setHistory] = useState<Newsletter[]>([]);
  const [selected, setSelected] = useState<Post | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    const [postsRes, historyRes] = await Promise.all([
      fetch('/api/admin/posts', { headers: AUTH() }),
      fetch('/api/admin/newsletters', { headers: AUTH() }),
    ]);
    const postsData = await postsRes.json() as { posts: Post[] };
    const historyData = await historyRes.json() as { newsletters: Newsletter[] };
    setPosts(postsData.posts ?? []);
    setHistory(historyData.newsletters ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  function selectPost(slug: string) {
    setSelected(posts.find((p) => p.slug === slug) ?? null);
    setStatus('idle');
    setMessage('');
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setStatus('loading'); setMessage('');
    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...AUTH() },
        body: JSON.stringify({ slug: selected.slug }),
      });
      let data: { error?: string; sent?: number } = {};
      try { data = await res.json(); } catch { /* noop */ }
      if (!res.ok) { setStatus('error'); setMessage(data.error ?? `Error ${res.status}`); return; }
      setStatus('success');
      setMessage(`Newsletter enviado a ${data.sent} suscriptores.`);
      setSelected(null);
      load();
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Error inesperado.');
    }
  }

  const cat = selected ? (CAT_COLOR[selected.category] ?? defaultCat) : defaultCat;
  const issueNum = selected ? String(selected.issue).padStart(2, '0') : '';

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <p style={s.eyebrow}>Newsletter</p>
        <h1 style={{ ...s.heading, marginBottom: 0, fontSize: 24 }}>Enviar · Historial</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

        {/* Send form */}
        <form onSubmit={handleSend} style={{ ...s.card, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={s.sectionTitle}>Enviar newsletter</p>

          <div>
            <label style={s.label}>Post</label>
            <select value={selected?.slug ?? ''} onChange={(e) => selectPost(e.target.value)}
              style={{ ...s.input, cursor: 'pointer' }}>
              <option value=''>— Elegí un post —</option>
              {posts.map((p) => (
                <option key={p.slug} value={p.slug}>
                  Nº {String(p.issue).padStart(2, '0')} · {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Preview — replica el email real */}
          {selected && (
            <div style={{ background: '#050810', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>

              {/* Header logo */}
              <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                <p style={{ fontFamily: 'monospace', fontSize: 8, color: '#8c909f', letterSpacing: '0.22em', textTransform: 'uppercase', margin: '0 0 6px' }}>est. 2026</p>
                <p style={{ margin: '0 0 2px' }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.32em', textTransform: 'uppercase', marginRight: 4 }}>El</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Radar</span>
                </p>
                <p style={{ fontFamily: 'monospace', fontSize: 7, color: '#8c909f', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 10px' }}>
                  arquitectura · código · producto
                </p>
                <p style={{ fontSize: 10, color: '#00d4d4', letterSpacing: '0.18em', textTransform: 'uppercase', margin: 0 }}>
                  Silvano Puccini · Full Stack Dev
                </p>
              </div>

              {/* Eyebrow */}
              <div style={{ padding: '20px 24px 0', textAlign: 'center' }}>
                <p style={{ fontSize: 10, fontWeight: 600, color: '#00d4d4', letterSpacing: '0.16em', textTransform: 'uppercase', margin: '0 0 6px' }}>
                  <span style={{ color: '#94a3b8' }}>El Radar</span>
                  <span style={{ color: 'rgba(255,255,255,0.2)', margin: '0 5px' }}>·</span>
                  <span>Nueva nota · Nº {issueNum}</span>
                </p>
                <p style={{ fontSize: 10, fontWeight: 600, color: cat.text, letterSpacing: '0.16em', textTransform: 'uppercase', margin: '0 0 20px' }}>
                  {(selected.keyword || selected.category).toUpperCase()}
                </p>
              </div>

              {/* Card */}
              <div style={{ padding: '0 24px 20px' }}>
                <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, overflow: 'hidden' }}>

                  {/* Card header */}
                  <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'inline-block', background: cat.bg, color: cat.text, border: `1px solid ${cat.border}`, borderRadius: 20, padding: '2px 8px', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                      {selected.category}
                    </span>
                    <span style={{ fontSize: 9, color: '#8c909f', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                      Nº {issueNum}
                    </span>
                  </div>

                  {/* Card body */}
                  <div style={{ padding: '16px' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '0 0 10px', lineHeight: 1.35 }}>
                      {selected.title}
                    </p>
                    <p style={{ fontSize: 12, color: 'rgba(221,226,248,0.8)', margin: '0 0 14px', lineHeight: 1.65, borderLeft: `2px solid ${cat.text}`, paddingLeft: 10 }}>
                      {selected.excerpt}
                    </p>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: '#8c909f' }}>
                        {selected.readingTime} · {fmtDate(selected.date)}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#00d4d4' }}>
                        Leer más →
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer preview */}
              <div style={{ padding: '10px 24px 16px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <p style={{ fontSize: 9, color: 'rgba(140,144,159,0.5)', margin: 0, lineHeight: 1.8 }}>
                  Recibís este email porque te suscribiste a El Radar. · Desuscribirse
                </p>
              </div>

            </div>
          )}

          <button type="submit" disabled={!selected || status === 'loading'}
            style={{ ...s.btn, opacity: !selected || status === 'loading' ? 0.5 : 1 }}>
            {status === 'loading' ? 'Enviando...' : 'Enviar newsletter →'}
          </button>
          {message && (
            <p style={status === 'success' ? s.successText : s.errorText}>{message}</p>
          )}
        </form>

        {/* History */}
        <div style={s.card}>
          <p style={s.sectionTitle}>Historial enviados</p>
          {history.length === 0
            ? <p style={{ color: '#475569', fontSize: 13 }}>Todavía no enviaste ningún newsletter.</p>
            : history.map((n) => (
              <div key={n.id} style={{ padding: '12px 0', borderBottom: '1px solid #1e293b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', margin: '0 0 4px' }}>{n.title}</p>
                  <span style={{ fontSize: 11, color: '#00d4d4', background: 'rgba(0,212,212,0.08)', padding: '2px 8px', borderRadius: 20, whiteSpace: 'nowrap', marginLeft: 8 }}>
                    {n.recipients_count} dest.
                  </span>
                </div>
                <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>{fmt(n.sent_at)}</p>
              </div>
            ))}
        </div>

      </div>
    </div>
  );
}
