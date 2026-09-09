'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { s } from '@/components/admin/AdminShell';
import { CopyButton } from '@/components/admin/CopyButton';
import { StatusBadge, STATUS_LABELS } from '@/components/admin/agenda/StatusBadge';
import { c, tint } from '@/components/admin/tokens';
import { slugifyTitle } from '@/lib/post-publications/types';
import type { PostPublicationListItem, PostPublicationStatus } from '@/lib/post-publications/types';
import type { LinkedInPostListItem, LinkedInSlot } from '@/lib/linkedin-posts/types';

/** Vista por completitud: qué falta, que es la pregunta con la que se entra. */
type Gap = 'all' | 'sin-texto' | 'sin-pdf' | 'listas';
type StatusFilter = 'all' | PostPublicationStatus;

const GAPS: { key: Gap; label: string; tone: string }[] = [
  { key: 'sin-texto', label: 'Falta texto', tone: c.incomplete },
  { key: 'sin-pdf', label: 'Falta PDF', tone: c.incomplete },
  { key: 'listas', label: 'Listas', tone: c.published },
];
const STATUSES: StatusFilter[] = ['all', 'planificado', 'preaprobado', 'publicado'];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function matchesGap(item: LinkedInPostListItem, gap: Gap) {
  if (gap === 'all') return true;
  if (gap === 'sin-texto') return !item.has_content;
  if (gap === 'sin-pdf') return item.has_content && !item.has_pdf;
  return item.has_content && item.has_pdf;
}

const chip = (active: boolean): React.CSSProperties => ({
  background: active ? tint(c.ready, '12') : 'transparent',
  color: active ? c.ready : c.textSoft,
  border: `1px solid ${active ? c.ready : c.border}`,
  borderRadius: 7, padding: '6px 13px', fontSize: 12, fontWeight: 500, cursor: 'pointer',
});

/** Marca de un requisito en la fila: verde si está, ámbar si falta. */
function Mark({ done, label }: { done: boolean; label: string }) {
  return <span title={done ? `${label} cargado` : `Falta ${label}`} style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontFamily: 'monospace', fontSize: 10, padding: '2px 7px', borderRadius: 20, whiteSpace: 'nowrap',
    background: done ? tint(c.published, '1a') : tint(c.incomplete, '1f'),
    color: done ? c.published : c.incomplete,
    border: `1px solid ${done ? tint(c.published, '40') : tint(c.incomplete, '59')}`,
  }}>{done ? '✓' : '!'} {label}</span>;
}

function GapTile({ tone, value, label, active, onClick }: {
  tone: string; value: number; label: string; active: boolean; onClick: () => void;
}) {
  return <button type="button" onClick={onClick} aria-pressed={active}
    className="transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
    style={{
      flex: '1 1 140px', minWidth: 0, textAlign: 'left', cursor: 'pointer',
      background: active ? tint(tone, '1a') : c.surface,
      border: `1px solid ${active ? tone : c.border}`,
      borderLeft: `3px solid ${tone}`, borderRadius: 10, padding: '11px 14px',
    }}>
    <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1, color: tone, letterSpacing: '-0.02em' }}>{value}</div>
    <div style={{ marginTop: 5, fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: active ? c.text : c.textDim }}>
      {label}
    </div>
  </button>;
}

/**
 * Alta de una pieza. El Markdown es opcional: se puede reservar el lugar en la
 * agenda con solo el título y cargar el texto y el PDF después, cada uno por su
 * lado. Lo que exige tener las dos cosas es el cambio de estado, no el alta.
 */
function NewPieceModal({ blogs, onClose, onCreated }: {
  blogs: PostPublicationListItem[];
  onClose: () => void;
  onCreated: (slug: string) => void;
}) {
  const [postSlug, setPostSlug] = useState('');
  const [slot, setSlot] = useState<LinkedInSlot>('martes');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [slug, setSlug] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!postSlug || !slug || (!file && !title.trim())) return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/admin/linkedin-posts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug, post_slug: postSlug, slot,
          ...(file
            ? { source_filename: file.name, source_markdown: await file.text() }
            : { title: title.trim() }),
        }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.error ?? 'No se pudo crear');
      onCreated(json.item.slug);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo crear');
      setBusy(false);
    }
  }

  return <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.72)', display: 'grid', placeItems: 'center', zIndex: 100, padding: 24 }}>
    <form onSubmit={submit} style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 12, padding: 24, width: '100%', maxWidth: 520, display: 'grid', gap: 13 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: c.ready }}>Biblioteca</p>
          <h2 style={{ margin: '5px 0 0', fontSize: 18, fontWeight: 700, color: c.text }}>Nueva pieza de LinkedIn</h2>
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar" style={{ ...chip(false), padding: '4px 10px' }}>✕</button>
      </div>

      <label style={s.label}>Artículo de Agenda
        <select style={s.input} value={postSlug} onChange={(event) => setPostSlug(event.target.value)} required>
          <option value="">Seleccioná un artículo</option>
          {blogs.map((blog) => <option key={blog.post_slug} value={blog.post_slug}>{blog.raw_title}</option>)}
        </select>
      </label>

      <label style={s.label}>Día
        <select style={s.input} value={slot} onChange={(event) => setSlot(event.target.value as LinkedInSlot)}>
          <option value="martes">Martes (D+2)</option>
          <option value="viernes">Viernes (D+5)</option>
        </select>
      </label>

      <label style={s.label}>Título
        <input style={s.input} value={file ? '' : title} disabled={Boolean(file)}
          placeholder={file ? 'Se toma del Markdown' : 'Título de la pieza'}
          onChange={(event) => { setTitle(event.target.value); if (!slug) setSlug(slugifyTitle(event.target.value)); }}
          required={!file} />
      </label>

      <div>
        <label style={s.label}>Markdown (opcional)
          <input type="file" accept=".md,text/markdown,text/plain"
            onChange={(event) => {
              const selected = event.target.files?.[0] ?? null;
              setFile(selected);
              if (selected && !slug) setSlug(slugifyTitle(selected.name.replace(/\.md$/i, '')));
            }} />
        </label>
        <p style={{ ...s.hint, marginTop: 6 }}>
          Si todavía no lo tenés, creá la pieza con el título y cargá el texto y el PDF después, por separado.
        </p>
      </div>

      <label style={s.label}>Slug
        <input style={s.input} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={slug}
          onChange={(event) => setSlug(event.target.value)} required />
      </label>

      {error && <p role="alert" style={{ margin: 0, fontSize: 13, color: c.late }}>{error}</p>}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onClose} style={chip(false)}>Cancelar</button>
        <button type="submit" style={{ ...s.btn, ...(busy ? { opacity: .6, cursor: 'wait' } : {}) }} disabled={busy}>
          {busy ? 'Creando…' : 'Crear y abrir →'}
        </button>
      </div>
    </form>
  </div>;
}

export default function ContentPage() {
  const [blogs, setBlogs] = useState<PostPublicationListItem[]>([]);
  const [items, setItems] = useState<LinkedInPostListItem[]>([]);
  const [gap, setGap] = useState<Gap>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [blogsResponse, linkedinResponse] = await Promise.all([
      fetch('/api/admin/posts-agenda?page=1&per_page=200'),
      fetch('/api/admin/linkedin-posts'),
    ]);
    const blogJson = await blogsResponse.json().catch(() => ({}));
    const linkedinJson = await linkedinResponse.json().catch(() => ({}));
    setLoading(false);
    if (!linkedinResponse.ok) return setError(linkedinJson.error ?? 'No se pudo cargar la biblioteca');
    setBlogs(blogJson.items ?? []);
    setItems(linkedinJson.items ?? []);
    setError('');
  }, []);
  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => ({
    'sin-texto': items.filter((item) => matchesGap(item, 'sin-texto')).length,
    'sin-pdf': items.filter((item) => matchesGap(item, 'sin-pdf')).length,
    listas: items.filter((item) => matchesGap(item, 'listas')).length,
  }), [items]);

  const visible = useMemo(() => items
    .filter((item) => matchesGap(item, gap))
    .filter((item) => status === 'all' || item.status === status)
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at)),
  [items, gap, status]);

  return <div>
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
      <div>
        <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: c.ready }}>El Radar</p>
        <h1 style={{ margin: '5px 0 4px', fontSize: 23, fontWeight: 700, color: c.text, letterSpacing: '-0.02em' }}>Biblioteca de LinkedIn</h1>
        <p style={{ margin: 0, fontSize: 12, color: c.textDim }}>
          El texto y el PDF se cargan por separado. Publicar es manual; acá queda el registro.
        </p>
      </div>
      <button onClick={() => setCreating(true)}
        className="transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
        style={{ background: c.ready, color: c.page, border: 0, borderRadius: 8, padding: '10px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
      >+ Nueva pieza</button>
    </header>

    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
      {GAPS.map((entry) => <GapTile key={entry.key} tone={entry.tone} label={entry.label}
        value={counts[entry.key as keyof typeof counts]}
        active={gap === entry.key}
        onClick={() => setGap((current) => (current === entry.key ? 'all' : entry.key))} />)}
    </div>

    {error && <div role="alert" style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 8, border: `1px solid ${c.late}`, background: tint(c.late, '0f'), color: c.late, fontSize: 13 }}>{error}</div>}

    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
      {STATUSES.map((value) => <button key={value} style={chip(status === value)}
        className="transition-colors hover:border-[#00d4d4] hover:text-[#00d4d4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
        onClick={() => setStatus(value)}
      >{value === 'all' ? 'Todos los estados' : STATUS_LABELS[value]}</button>)}
      {gap !== 'all' && <button style={chip(true)} onClick={() => setGap('all')}>
        {GAPS.find((entry) => entry.key === gap)?.label} ✕
      </button>}
    </div>

    <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 12, overflow: 'hidden' }}>
      {loading ? <p style={{ margin: 0, padding: 20, fontSize: 12, color: c.textDim }}>Cargando…</p>
        : visible.length === 0 ? <p style={{ margin: 0, padding: 20, fontSize: 12, color: c.textDim }}>
          {items.length === 0 ? 'Todavía no hay piezas guardadas.' : 'No hay piezas con estos filtros.'}
        </p>
        : visible.map((item, index) => <article key={item.slug} style={{
          display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
          padding: '13px 16px',
          borderTop: index === 0 ? 'none' : `1px solid ${c.border}`,
          boxShadow: `inset 3px 0 0 ${item.has_content && item.has_pdf ? c.published : c.incomplete}`,
        }}>
          <div style={{ flex: '1 1 240px', minWidth: 0 }}>
            <a href={`/admin/content/${item.slug}`} title={item.title}
              className="transition-colors hover:text-[#00d4d4]"
              style={{ display: 'block', fontWeight: 600, fontSize: 13, color: c.text, textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >{item.title}</a>
            <div style={{ fontSize: 10, fontFamily: 'monospace', color: c.textDim, marginTop: 2 }}>
              {item.slot} · {fmtDate(item.scheduled_at)}
              {item.has_content && ` · ${item.content_chars.toLocaleString('es-AR')} car.`}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <StatusBadge status={item.status} />
            <Mark done={item.has_content} label="texto" />
            <Mark done={item.has_pdf} label="PDF" />
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginLeft: 'auto' }}>
            <CopyButton text={item.title} label="Copiar título"
              ariaLabel={`Copiar título de ${item.title}`}
              className="transition-colors hover:border-[#00d4d4] hover:text-[#00d4d4]" />
            <a href={`/admin/content/${item.slug}`}
              className="transition-colors hover:border-[#00d4d4] hover:text-[#00d4d4]"
              style={{ ...chip(false), textDecoration: 'none', whiteSpace: 'nowrap' }}
            >Abrir →</a>
          </div>
        </article>)}
    </div>

    {creating && <NewPieceModal blogs={blogs} onClose={() => setCreating(false)}
      onCreated={(slug) => { window.location.href = `/admin/content/${slug}`; }} />}
  </div>;
}
