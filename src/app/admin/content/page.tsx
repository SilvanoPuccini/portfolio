'use client';

import { useCallback, useEffect, useState } from 'react';
import { s } from '@/components/admin/AdminShell';
import { CopyButton } from '@/components/admin/CopyButton';
import { slugifyTitle } from '@/lib/post-publications/types';
import type { PostPublicationListItem } from '@/lib/post-publications/types';
import type { LinkedInPostListItem, LinkedInSlot } from '@/lib/linkedin-posts/types';

type Generated = { linkedinCarousel: string; instagramCaption: string; twitterThread: string };

export default function ContentPage() {
  const [blogs, setBlogs] = useState<PostPublicationListItem[]>([]);
  const [items, setItems] = useState<LinkedInPostListItem[]>([]);
  const [postSlug, setPostSlug] = useState('');
  const [slot, setSlot] = useState<LinkedInSlot>('martes');
  const [file, setFile] = useState<File | null>(null);
  const [slug, setSlug] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [generated, setGenerated] = useState<Generated | null>(null);

  const load = useCallback(async () => {
    const [blogsResponse, linkedinResponse] = await Promise.all([
      fetch('/api/admin/posts-agenda?page=1&per_page=200'),
      fetch('/api/admin/linkedin-posts'),
    ]);
    const blogJson = await blogsResponse.json();
    const linkedinJson = await linkedinResponse.json();
    setBlogs(blogJson.items ?? []);
    setItems(linkedinJson.items ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function importMarkdown(event: React.FormEvent) {
    event.preventDefault();
    if (!file || !postSlug || !slug) return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/admin/linkedin-posts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, post_slug: postSlug, slot, source_filename: file.name, source_markdown: await file.text() }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.error ?? 'No se pudo importar');
      window.location.href = `/admin/content/${json.item.slug}`;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo importar');
      setBusy(false);
    }
  }

  async function quickGenerate() {
    if (!postSlug) return;
    setBusy(true); setError(''); setGenerated(null);
    const response = await fetch('/api/admin/content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: postSlug }) });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) setError(json.error ?? 'No se pudo generar'); else setGenerated(json);
    setBusy(false);
  }

  return <div>
    <div style={{ marginBottom: 24 }}><p style={s.eyebrow}>El Radar</p><h1 style={{ ...s.heading, fontSize: 24 }}>Biblioteca de LinkedIn</h1><p style={s.hint}>Importá el Markdown final y conservá el PDF original. LinkedIn se publica afuera y se marca acá manualmente.</p></div>
    <form onSubmit={importMarkdown} style={{ ...s.card, display: 'grid', gap: 14, marginBottom: 24 }}>
      <h2 style={s.sectionTitle}>Importar pieza terminada</h2>
      <label style={s.label}>Artículo de Agenda
        <select style={s.input} value={postSlug} onChange={(event) => setPostSlug(event.target.value)} required><option value="">Seleccioná un artículo</option>{blogs.map((blog) => <option key={blog.post_slug} value={blog.post_slug}>{blog.raw_title}</option>)}</select>
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <label style={s.label}>Archivo Markdown
          <input type="file" accept=".md,text/markdown,text/plain" required onChange={(event) => { const selected = event.target.files?.[0] ?? null; setFile(selected); if (selected && !slug) setSlug(slugifyTitle(selected.name.replace(/\.md$/i, ''))); }} />
        </label>
        <label style={s.label}>Día
          <select style={s.input} value={slot} onChange={(event) => setSlot(event.target.value as LinkedInSlot)}><option value="martes">Martes (D+2)</option><option value="viernes">Viernes (D+5)</option></select>
        </label>
      </div>
      <label style={s.label}>Slug<input style={s.input} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={slug} onChange={(event) => setSlug(event.target.value)} required /></label>
      {error && <div role="alert" style={s.errorText}>{error}</div>}
      <button style={s.btn} disabled={busy}>{busy ? 'Importando…' : 'Importar y abrir →'}</button>
    </form>

    <div style={{ ...s.card, marginBottom: 24 }}><h2 style={s.sectionTitle}>Piezas guardadas</h2>{items.length === 0 ? <p style={s.hint}>Todavía no hay piezas.</p> : items.map((item) => <a key={item.slug} href={`/admin/content/${item.slug}`} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, padding: '12px 0', borderTop: '1px solid #1e293b', textDecoration: 'none' }}><span><strong style={{ color: '#e2e8f0' }}>{item.title}</strong><small style={{ display: 'block', color: '#64748b' }}>{item.slot} · {item.has_pdf ? 'PDF guardado' : 'sin PDF'}</small></span><span style={{ color: '#00d4d4' }}>Abrir →</span></a>)}</div>

    <details style={s.card}><summary style={{ cursor: 'pointer', fontWeight: 700 }}>Generación rápida con IA (opcional)</summary><p style={s.hint}>Borrador secundario para adaptar. Nunca reemplaza ni reescribe el original importado.</p><button type="button" style={s.btnGhost} disabled={!postSlug || busy} onClick={quickGenerate}>Generar desde el artículo seleccionado</button>{generated && <div style={{ marginTop: 14 }}><textarea readOnly value={generated.linkedinCarousel} rows={16} style={{ ...s.input, resize: 'vertical' }} /><CopyButton text={generated.linkedinCarousel} ariaLabel="Copiar borrador generado para LinkedIn" /></div>}</details>
  </div>;
}
