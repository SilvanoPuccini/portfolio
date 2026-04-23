'use client';

import { useState, useEffect, useCallback } from 'react';
import { s } from '@/components/admin/AdminShell';

type Post = { slug: string; title: string; excerpt: string; date: string; issue: number };
type Generated = { linkedinCarousel: string; instagramCaption: string; twitterThread: string; title: string };
type Tab = 'linkedin' | 'instagram' | 'twitter';

export default function ContentPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [slug, setSlug] = useState('');
  const [generated, setGenerated] = useState<Generated | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>('linkedin');
  const [copied, setCopied] = useState<Tab | null>(null);

  useEffect(() => {
    fetch('/api/admin/posts')
      .then((r) => r.json())
      .then((d: { posts: Post[] }) => setPosts(d.posts ?? []));
  }, []);

  const generate = useCallback(async () => {
    if (!slug) return;
    setLoading(true); setGenerated(null);
    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json() as Generated;
      setGenerated(data);
      setTab('linkedin');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  function copy(content: string, which: Tab) {
    navigator.clipboard.writeText(content);
    setCopied(which);
    setTimeout(() => setCopied(null), 2000);
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'linkedin', label: 'LinkedIn Carrusel', icon: '💼' },
    { key: 'instagram', label: 'Instagram Caption', icon: '📸' },
    { key: 'twitter', label: 'X / Twitter Hilo', icon: '🐦' },
  ];

  const content = generated
    ? { linkedin: generated.linkedinCarousel, instagram: generated.instagramCaption, twitter: generated.twitterThread }[tab]
    : '';

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <p style={s.eyebrow}>Generador</p>
        <h1 style={{ ...s.heading, marginBottom: 4, fontSize: 24 }}>Contenido para redes</h1>
        <p style={{ color: '#475569', fontSize: 13, margin: 0 }}>Seleccioná un post y generá el contenido listo para copiar.</p>
      </div>

      {/* Selector */}
      <div style={{ ...s.card, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={s.label}>Post del blog</label>
            <select value={slug} onChange={(e) => setSlug(e.target.value)} style={{ ...s.input, cursor: 'pointer' }}>
              <option value=''>— Seleccioná un post —</option>
              {posts.map((p) => (
                <option key={p.slug} value={p.slug}>Nº {String(p.issue).padStart(2, '0')} · {p.title} ({p.date})</option>
              ))}
            </select>
          </div>
          <button onClick={generate} disabled={!slug || loading}
            style={{ ...s.btn, opacity: !slug || loading ? 0.5 : 1, whiteSpace: 'nowrap' }}>
            {loading ? 'Generando...' : 'Generar contenido →'}
          </button>
        </div>
      </div>

      {/* Result */}
      {generated && (
        <div style={s.card}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {tabs.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{
                  ...s.btnGhost,
                  color: tab === t.key ? '#00d4d4' : '#64748b',
                  borderColor: tab === t.key ? '#00d4d4' : '#1e293b',
                  background: tab === t.key ? 'rgba(0,212,212,0.06)' : 'transparent',
                }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Content preview */}
          <div style={{ position: 'relative' }}>
            <textarea
              readOnly value={content}
              rows={tab === 'linkedin' ? 24 : 14}
              style={{ ...s.input, resize: 'none', lineHeight: 1.7, fontSize: 13, color: '#94a3b8', fontFamily: 'monospace' }}
            />
            <button
              onClick={() => copy(content, tab)}
              style={{
                position: 'absolute', top: 12, right: 12,
                background: copied === tab ? '#4ade80' : '#1e293b',
                color: copied === tab ? '#0a0a14' : '#94a3b8',
                border: 'none', borderRadius: 6, padding: '6px 14px',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
              }}>
              {copied === tab ? '✓ Copiado' : 'Copiar'}
            </button>
          </div>

          <p style={{ ...s.hint, marginTop: 12 }}>
            {tab === 'linkedin' && '💼 Pegá cada slide en una diapositiva de Canva o LinkedIn. El contenido está listo para publicar.'}
            {tab === 'instagram' && '📸 Copiá el caption directo a Instagram. Ajustá los emojis si querés.'}
            {tab === 'twitter' && '🐦 Publicá cada bloque como tweet en el hilo. Empezá por el [1].'}
          </p>
        </div>
      )}
    </div>
  );
}
