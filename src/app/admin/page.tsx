'use client';

import { useState, useEffect, useCallback } from 'react';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
const NOTIFY_SECRET = process.env.NEXT_PUBLIC_NOTIFY_SECRET;

type Post = { slug: string; title: string; excerpt: string; date: string; category: string };
type Stats = { subscribers: number; totalMessages: number; unreadMessages: number; totalPosts: number };
type NotifyStatus = 'idle' | 'loading' | 'success' | 'error';

function authHeaders() {
  return { Authorization: `Bearer ${NOTIFY_SECRET}` };
}

// ─── Auth gate ───────────────────────────────────────────────
function AuthGate({ onAuth }: { onAuth: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) { onAuth(); }
    else { setError('Contraseña incorrecta.'); }
  }

  return (
    <div style={s.center}>
      <div style={{ ...s.card, maxWidth: 380 }}>
        <p style={s.eyebrow}>El Radar</p>
        <h1 style={s.heading}>Panel Admin</h1>
        <form onSubmit={handleSubmit} style={s.form}>
          <input type="password" placeholder="Contraseña" value={password}
            onChange={(e) => setPassword(e.target.value)} style={s.input} autoFocus />
          {error && <p style={s.errorText}>{error}</p>}
          <button type="submit" style={s.btn}>Ingresar</button>
        </form>
      </div>
    </div>
  );
}

// ─── Stat card ───────────────────────────────────────────────
function StatCard({ label, value, sub, accent }: { label: string; value: number | string; sub?: string; accent?: boolean }) {
  return (
    <div style={{ ...s.card, padding: '20px 24px' }}>
      <p style={{ ...s.eyebrow, color: accent ? '#00d4d4' : '#475569' }}>{label}</p>
      <p style={{ fontSize: 32, fontWeight: 700, color: '#ffffff', margin: '8px 0 4px' }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: '#475569' }}>{sub}</p>}
    </div>
  );
}

// ─── Newsletter sender ───────────────────────────────────────
function NewsletterPanel({ posts }: { posts: Post[] }) {
  const [selected, setSelected] = useState<Post | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [status, setStatus] = useState<NotifyStatus>('idle');
  const [message, setMessage] = useState('');

  function selectPost(slug: string) {
    const post = posts.find((p) => p.slug === slug) ?? null;
    setSelected(post);
    if (post) { setTitle(post.title); setSlug(post.slug); setExcerpt(post.excerpt); }
    else { setTitle(''); setSlug(''); setExcerpt(''); }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ title, slug, excerpt }),
      });
      let data: { error?: string; sent?: number } = {};
      try { data = await res.json(); } catch { /* noop */ }
      if (!res.ok) { setStatus('error'); setMessage(data.error ?? `Error ${res.status}`); return; }
      setStatus('success');
      setMessage(`✓ Newsletter enviado a ${data.sent} suscriptores.`);
      setSelected(null); setTitle(''); setSlug(''); setExcerpt('');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Error inesperado.');
    }
  }

  return (
    <div style={s.card}>
      <p style={s.eyebrow}>Newsletter</p>
      <h2 style={s.sectionTitle}>Enviar a suscriptores</h2>

      <form onSubmit={handleSend} style={s.form}>
        {/* Selector de post */}
        <div>
          <label style={s.label}>Seleccionar post del blog</label>
          <select
            value={selected?.slug ?? ''}
            onChange={(e) => selectPost(e.target.value)}
            style={{ ...s.input, cursor: 'pointer' }}
          >
            <option value=''>— Elegí un post o completá manualmente —</option>
            {posts.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.title} ({p.date})
              </option>
            ))}
          </select>
        </div>

        <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />

        <div>
          <label style={s.label}>Título</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Título del post" style={s.input} required />
        </div>

        <div>
          <label style={s.label}>Slug</label>
          <input value={slug} onChange={(e) => setSlug(e.target.value)}
            placeholder="nombre-del-archivo" style={s.input} required />
          <p style={s.hint}>URL: silvanopuccini.dev/es/blog/<strong>{slug || 'tu-slug'}</strong></p>
        </div>

        <div>
          <label style={s.label}>Excerpt</label>
          <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Descripción corta para el email..." rows={3}
            style={{ ...s.input, resize: 'vertical' }} required />
        </div>

        <button type="submit" disabled={status === 'loading'}
          style={{ ...s.btn, opacity: status === 'loading' ? 0.6 : 1 }}>
          {status === 'loading' ? 'Enviando...' : 'Enviar newsletter →'}
        </button>

        {message && (
          <p style={status === 'success' ? s.successText : s.errorText}>{message}</p>
        )}
      </form>
    </div>
  );
}

// ─── Main dashboard ──────────────────────────────────────────
export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);

  const fetchData = useCallback(async () => {
    const [statsRes, postsRes] = await Promise.all([
      fetch('/api/admin/stats', { headers: authHeaders() }),
      fetch('/api/admin/posts', { headers: authHeaders() }),
    ]);
    const statsData = await statsRes.json() as Stats;
    const postsData = await postsRes.json() as { posts: Post[] };
    setStats(statsData);
    setPosts(postsData.posts ?? []);
  }, []);

  useEffect(() => {
    if (authed) fetchData();
  }, [authed, fetchData]);

  if (!authed) return <AuthGate onAuth={() => setAuthed(true)} />;

  return (
    <div style={{ minHeight: '100vh', padding: '32px 24px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <p style={s.eyebrow}>El Radar</p>
            <h1 style={{ ...s.heading, marginBottom: 0 }}>Panel Admin</h1>
          </div>
          <a href="/admin/messages" style={{ color: '#00d4d4', fontSize: 13, textDecoration: 'none', border: '1px solid #1e293b', borderRadius: 8, padding: '8px 14px' }}>
            Mensajes {stats?.unreadMessages ? `(${stats.unreadMessages} sin leer)` : ''}
          </a>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
            <StatCard label="Suscriptores activos" value={stats.subscribers} sub="El Radar" accent />
            <StatCard label="Posts publicados" value={stats.totalPosts} sub="en el blog" />
            <StatCard label="Mensajes totales" value={stats.totalMessages} sub="de contacto" />
            <StatCard label="Sin leer" value={stats.unreadMessages} sub="mensajes nuevos" accent={stats.unreadMessages > 0} />
          </div>
        )}

        {/* Newsletter */}
        <NewsletterPanel posts={posts} />

        {/* Links rápidos */}
        <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
          <a href="/es/blog" target="_blank" style={s.quickLink}>Ver blog →</a>
          <a href="/admin/messages" style={s.quickLink}>Ver mensajes →</a>
          <a href="/es/contacto" target="_blank" style={s.quickLink}>Ver formulario de contacto →</a>
        </div>
      </div>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  center: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { background: '#111827', border: '1px solid #1e293b', borderRadius: 12, padding: 28, width: '100%' },
  eyebrow: { fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#00d4d4', margin: '0 0 4px' },
  heading: { fontSize: 22, fontWeight: 700, color: '#ffffff', margin: '0 0 20px' },
  sectionTitle: { fontSize: 15, fontWeight: 600, color: '#e2e8f0', margin: '4px 0 20px' },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  label: { display: 'block', fontSize: 12, color: '#64748b', marginBottom: 6, fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase' },
  input: { background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '10px 14px', color: '#e2e8f0', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' },
  hint: { fontSize: 12, color: '#475569', marginTop: 4 },
  btn: { background: '#00d4d4', color: '#0a0a14', border: 'none', borderRadius: 8, padding: '11px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer' },
  successText: { color: '#4ade80', fontSize: 13, margin: 0 },
  errorText: { color: '#f87171', fontSize: 13, margin: 0 },
  quickLink: { color: '#475569', fontSize: 12, textDecoration: 'none', border: '1px solid #1e293b', borderRadius: 6, padding: '6px 12px', fontFamily: 'monospace' },
};
