'use client';

import { useState, useEffect, useCallback } from 'react';
import { s } from '@/components/admin/AdminShell';

type Post = {
  slug: string; title: string; excerpt: string; date: string;
  category: string; issue: number; readingTime: string; keyword: string;
};
type Newsletter = { id: string; title: string; slug: string; recipients_count: number; sent_at: string };

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const PAGE_SIZE = 10;

export default function NewsletterPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [history, setHistory] = useState<Newsletter[]>([]);
  const [selected, setSelected] = useState<Post | null>(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [histPage, setHistPage] = useState(0);

  const load = useCallback(async () => {
    const [postsRes, historyRes] = await Promise.all([
      fetch('/api/admin/posts'),
      fetch('/api/admin/newsletters'),
    ]);
    const postsData = await postsRes.json() as { posts: Post[] };
    const historyData = await historyRes.json() as { newsletters: Newsletter[] };
    setPosts(postsData.posts ?? []);
    setHistory(historyData.newsletters ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function selectPost(slug: string) {
    const post = posts.find((p) => p.slug === slug) ?? null;
    setSelected(post);
    setStatus('idle');
    setMessage('');
    setPreviewHtml('');
    if (!post) return;
    // Vista previa con la plantilla real del envío (endpoint server-side).
    setPreviewLoading(true);
    try {
      const res = await fetch(`/api/admin/newsletter-preview?slug=${encodeURIComponent(post.slug)}`);
      if (res.ok) setPreviewHtml(await res.text());
    } catch { /* noop */ }
    setPreviewLoading(false);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setStatus('loading'); setMessage('');
    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

          {/* Preview — HTML exacto del envío real, renderizado en iframe */}
          {selected && (
            previewLoading ? (
              <p style={{ color: '#475569', fontSize: 13, margin: 0 }}>Generando vista previa…</p>
            ) : previewHtml ? (
              <div style={{ background: '#050810', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <iframe
                  title={`Vista previa — ${selected.title}`}
                  srcDoc={previewHtml}
                  sandbox=""
                  style={{ width: '100%', height: 1150, border: 0, display: 'block', background: '#050810' }}
                />
              </div>
            ) : null
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
        <div style={{ ...s.card, padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <p style={{ ...s.sectionTitle, margin: 0 }}>Historial enviados</p>
            {history.length > 0 && (
              <span style={{ fontSize: 11, color: '#475569' }}>
                {history.length} envío{history.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {history.length === 0
            ? <p style={{ color: '#475569', fontSize: 13, margin: 0 }}>Todavía no enviaste ningún newsletter.</p>
            : (() => {
                const totalPages = Math.ceil(history.length / PAGE_SIZE);
                const page = history.slice(histPage * PAGE_SIZE, (histPage + 1) * PAGE_SIZE);
                return (
                  <>
                    {page.map((n) => (
                      <div key={n.id} style={{ padding: '9px 0', borderBottom: '1px solid #1a2236' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', margin: '0 0 2px', lineHeight: 1.35 }}>{n.title}</p>
                          <span style={{ fontSize: 10, color: '#00d4d4', background: 'rgba(0,212,212,0.08)', padding: '2px 7px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {n.recipients_count} dest.
                          </span>
                        </div>
                        <p style={{ fontSize: 10, color: '#475569', margin: 0 }}>{fmt(n.sent_at)}</p>
                      </div>
                    ))}

                    {totalPages > 1 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, marginTop: 2 }}>
                        <button
                          onClick={() => setHistPage((p) => Math.max(0, p - 1))}
                          disabled={histPage === 0}
                          style={{ background: 'none', border: 'none', color: histPage === 0 ? '#2a3a50' : '#475569', cursor: histPage === 0 ? 'default' : 'pointer', fontSize: 12, padding: '2px 6px' }}
                        >
                          ← Ant.
                        </button>
                        <span style={{ fontSize: 11, color: '#475569' }}>
                          {histPage + 1} / {totalPages}
                        </span>
                        <button
                          onClick={() => setHistPage((p) => Math.min(totalPages - 1, p + 1))}
                          disabled={histPage === totalPages - 1}
                          style={{ background: 'none', border: 'none', color: histPage === totalPages - 1 ? '#2a3a50' : '#475569', cursor: histPage === totalPages - 1 ? 'default' : 'pointer', fontSize: 12, padding: '2px 6px' }}
                        >
                          Sig. →
                        </button>
                      </div>
                    )}
                  </>
                );
              })()
          }
        </div>

      </div>
    </div>
  );
}
