'use client';

import { useState, useEffect, useCallback } from 'react';
import { s } from '@/components/admin/AdminShell';

const AUTH = () => ({ Authorization: `Bearer ${process.env.NEXT_PUBLIC_NOTIFY_SECRET}` });

type Post = { slug: string; title: string; excerpt: string; date: string; category: string; issue: number };
type Newsletter = { id: string; title: string; slug: string; recipients_count: number; sent_at: string };

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function NewsletterPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [history, setHistory] = useState<Newsletter[]>([]);
  const [selected, setSelected] = useState<Post | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
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

  function selectPost(postSlug: string) {
    const post = posts.find((p) => p.slug === postSlug) ?? null;
    setSelected(post);
    if (post) { setTitle(post.title); setSlug(post.slug); setExcerpt(post.excerpt); }
    else { setTitle(''); setSlug(''); setExcerpt(''); }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading'); setMessage('');
    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...AUTH() },
        body: JSON.stringify({ title, slug, excerpt }),
      });
      let data: { error?: string; sent?: number } = {};
      try { data = await res.json(); } catch { /* noop */ }
      if (!res.ok) { setStatus('error'); setMessage(data.error ?? `Error ${res.status}`); return; }
      setStatus('success');
      setMessage(`✓ Newsletter enviado a ${data.sent} suscriptores.`);
      setSelected(null); setTitle(''); setSlug(''); setExcerpt('');
      load(); // refresh history
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Error inesperado.');
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <p style={s.eyebrow}>Newsletter</p>
        <h1 style={{ ...s.heading, marginBottom: 0, fontSize: 24 }}>Enviar · Historial</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
        {/* Send form */}
        <div style={s.card}>
          <p style={{ ...s.sectionTitle }}>Enviar newsletter</p>
          <form onSubmit={handleSend} style={s.form}>
            <div>
              <label style={s.label}>Seleccionar post</label>
              <select value={selected?.slug ?? ''} onChange={(e) => selectPost(e.target.value)}
                style={{ ...s.input, cursor: 'pointer' }}>
                <option value=''>— Elegí un post —</option>
                {posts.map((p) => (
                  <option key={p.slug} value={p.slug}>Nº {String(p.issue).padStart(2, '0')} — {p.title}</option>
                ))}
              </select>
            </div>
            <div style={s.divider} />
            <div>
              <label style={s.label}>Título</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="Título del post" style={s.input} required />
            </div>
            <div>
              <label style={s.label}>Slug</label>
              <input value={slug} onChange={(e) => setSlug(e.target.value)}
                placeholder="nombre-del-archivo" style={s.input} required />
              <p style={s.hint}>silvanopuccini.dev/es/blog/<strong>{slug || '...'}</strong></p>
            </div>
            <div>
              <label style={s.label}>Excerpt</label>
              <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)}
                rows={3} style={{ ...s.input, resize: 'vertical' }} required />
            </div>
            <button type="submit" disabled={status === 'loading'}
              style={{ ...s.btn, opacity: status === 'loading' ? 0.6 : 1 }}>
              {status === 'loading' ? 'Enviando...' : 'Enviar newsletter →'}
            </button>
            {message && <p style={status === 'success' ? s.successText : s.errorText}>{message}</p>}
          </form>
        </div>

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
                    {n.recipients_count} destinatarios
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
