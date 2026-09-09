'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { s } from '@/components/admin/AdminShell';
import { STATUS_LABELS } from '@/components/admin/agenda/StatusBadge';
import { MarkdownDrop } from '@/components/admin/MarkdownDrop';
import { PdfSlot } from '@/components/admin/PdfSlot';
import { PieceRow, type Piece } from '@/components/admin/PieceRow';
import { PeriodPicker, inPeriod, periodLabel, type Period } from '@/components/admin/PeriodPicker';
import { attachPieceMarkdown, changePieceStatus, fetchPieceText, savePieceText } from '@/components/admin/pieceApi';
import { c, tint } from '@/components/admin/tokens';
import { slugifyTitle } from '@/lib/post-publications/types';
import type { PostPublicationListItem, PostPublicationStatus } from '@/lib/post-publications/types';
import type { LinkedInPostListItem, LinkedInSlot } from '@/lib/linkedin-posts/types';

/** Vista por completitud: qué falta, que es la pregunta con la que se entra. */
type Gap = 'all' | 'sin-texto' | 'sin-pdf' | 'listas';
type StatusFilter = 'all' | PostPublicationStatus;

const GAPS: { key: Exclude<Gap, 'all'>; label: string; tone: string }[] = [
  { key: 'sin-texto', label: 'Falta texto', tone: c.incomplete },
  { key: 'sin-pdf', label: 'Falta PDF', tone: c.incomplete },
  { key: 'listas', label: 'Listas', tone: c.published },
];
const STATUSES: StatusFilter[] = ['all', 'planificado', 'preaprobado', 'publicado'];

function matchesGap(item: LinkedInPostListItem, gap: Gap) {
  if (gap === 'all') return true;
  if (gap === 'sin-texto') return !item.has_content;
  // Excluyente a propósito: si contara las vacías, los números no cerrarían.
  if (gap === 'sin-pdf') return item.has_content && !item.has_pdf;
  return item.has_content && item.has_pdf;
}

const chip = (active: boolean): React.CSSProperties => ({
  background: active ? tint(c.ready, '12') : 'transparent',
  color: active ? c.ready : c.textSoft,
  border: `1px solid ${active ? c.ready : c.border}`,
  borderRadius: 7, padding: '6px 13px', fontSize: 12, fontWeight: 500, cursor: 'pointer',
  fontFamily: 'inherit',
});

function toPiece(item: LinkedInPostListItem): Piece {
  return {
    id: item.slug, channel: 'linkedin', sourceId: item.slug, title: item.title,
    scheduledAt: item.scheduled_at, status: item.status,
    hasContent: item.has_content, contentChars: item.content_chars,
    hasPdf: item.has_pdf, isReady: item.has_content && item.has_pdf,
    detailPath: `/admin/content/${item.slug}`,
  };
}

function GapTile({ tone, value, label, active, onClick }: {
  tone: string; value: number; label: string; active: boolean; onClick: () => void;
}) {
  return <button type="button" onClick={onClick} aria-pressed={active}
    className="transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
    style={{
      flex: '1 1 140px', minWidth: 0, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
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
 * Alta de una pieza. El Markdown es opcional: se puede reservar el lugar con
 * solo el título y cargar el texto y el PDF después, cada uno por su lado.
 */
function NewPieceModal({ blogs, onClose, onCreated }: {
  blogs: PostPublicationListItem[];
  onClose: () => void;
  onCreated: () => void | Promise<void>;
}) {
  const [postSlug, setPostSlug] = useState('');
  const [slot, setSlot] = useState<LinkedInSlot>('martes');
  const [title, setTitle] = useState('');
  const [markdown, setMarkdown] = useState<{ text: string; filename: string } | null>(null);
  const [slug, setSlug] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!postSlug || !slug || (!markdown && !title.trim())) return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/admin/linkedin-posts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug, post_slug: postSlug, slot,
          ...(markdown
            ? { source_markdown: markdown.text, source_filename: markdown.filename }
            : { title: title.trim() }),
        }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.error ?? 'No se pudo crear');
      await onCreated();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo crear');
      setBusy(false);
    }
  }

  return <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.72)', display: 'grid', placeItems: 'center', zIndex: 100, padding: 24 }}>
    <form onSubmit={submit} style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 12, padding: 24, width: '100%', maxWidth: 500, display: 'grid', gap: 13, maxHeight: '90vh', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: c.text }}>Nueva pieza de LinkedIn</h2>
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
        <input style={s.input} value={markdown ? '' : title} disabled={Boolean(markdown)}
          placeholder={markdown ? `Se toma de ${markdown.filename}` : 'Título de la pieza'}
          onChange={(event) => { setTitle(event.target.value); if (!slug) setSlug(slugifyTitle(event.target.value)); }}
          required={!markdown} />
      </label>

      <div>
        <span style={s.label}>Markdown (opcional)</span>
        {markdown
          ? <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, border: `1px solid ${tint(c.published, '59')}`, background: tint(c.published, '14') }}>
            <span style={{ flex: 1, minWidth: 0, fontSize: 12, color: c.published, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              ✓ {markdown.filename}
            </span>
            <button type="button" onClick={() => setMarkdown(null)} aria-label="Quitar el Markdown"
              style={{ border: 0, background: 'transparent', color: c.textSoft, cursor: 'pointer', fontSize: 13, padding: 2 }}>✕</button>
          </div>
          : <MarkdownDrop label="Arrastrá el .md o hacé clic"
            onFile={(text, filename) => {
              setMarkdown({ text, filename });
              if (!slug) setSlug(slugifyTitle(filename.replace(/\.md$/i, '')));
            }} />}
        <p style={{ ...s.hint, marginTop: 6 }}>
          Si todavía no lo tenés, creala con el título y cargá el texto y el PDF después.
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
          {busy ? 'Creando…' : 'Crear →'}
        </button>
      </div>
    </form>
  </div>;
}

export default function ContentPage() {
  const [blogs, setBlogs] = useState<PostPublicationListItem[]>([]);
  const [items, setItems] = useState<LinkedInPostListItem[]>([]);
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [openId, setOpenId] = useState<string | null>(null);
  const [gap, setGap] = useState<Gap>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [period, setPeriod] = useState<Period>({ mode: 'semana', anchor: new Date().toISOString() });
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

  // Los contadores miran el período elegido: si contaran el año entero, el
  // número de arriba no tendría nada que ver con la lista de abajo.
  const inScope = useMemo(() => items.filter((item) => inPeriod(item.scheduled_at, period)), [items, period]);
  const counts = useMemo(() => ({
    'sin-texto': inScope.filter((item) => matchesGap(item, 'sin-texto')).length,
    'sin-pdf': inScope.filter((item) => matchesGap(item, 'sin-pdf')).length,
    listas: inScope.filter((item) => matchesGap(item, 'listas')).length,
  }), [inScope]);

  const visible = useMemo(() => inScope
    .filter((item) => matchesGap(item, gap))
    .filter((item) => status === 'all' || item.status === status)
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at)),
  [inScope, gap, status]);

  const open = useCallback(async (slug: string) => {
    setOpenId((current) => (current === slug ? null : slug));
    if (texts[slug] !== undefined) return;
    try {
      const text = await fetchPieceText('linkedin', slug);
      setTexts((current) => ({ ...current, [slug]: text }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo traer el texto');
    }
  }, [texts]);

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
        style={{ background: c.ready, color: c.page, border: 0, borderRadius: 8, padding: '10px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
      >+ Nueva pieza</button>
    </header>

    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 14 }}>
      <PeriodPicker value={period} onChange={setPeriod} />
      <span style={{ fontSize: 11, color: c.textDim }}>
        {inScope.length} {inScope.length === 1 ? 'pieza' : 'piezas'} en {periodLabel(period)}
      </span>
    </div>

    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
      {GAPS.map((entry) => <GapTile key={entry.key} tone={entry.tone} label={entry.label}
        value={counts[entry.key]}
        active={gap === entry.key}
        onClick={() => setGap((current) => (current === entry.key ? 'all' : entry.key))} />)}
    </div>

    {error && <div role="alert" style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 8, border: `1px solid ${c.late}`, background: tint(c.late, '0f'), color: c.late, fontSize: 13 }}>{error}</div>}

    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
      {STATUSES.map((value) => <button key={value} style={chip(status === value)}
        className="transition-colors hover:border-[#00d4d4] hover:text-[#00d4d4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
        onClick={() => setStatus(value)}
      >{value === 'all' ? 'Todos los estados' : STATUS_LABELS[value]}</button>)}
    </div>

    <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 12, overflow: 'hidden' }}>
      {loading ? <p style={{ margin: 0, padding: 20, fontSize: 12, color: c.textDim }}>Cargando…</p>
        : visible.length === 0 ? <p style={{ margin: 0, padding: 20, fontSize: 12, color: c.textDim }}>
          {items.length === 0 ? 'Todavía no hay piezas guardadas.' : `No hay piezas en ${periodLabel(period)} con estos filtros.`}
        </p>
        : visible.map((item) => <PieceRow key={item.slug}
          piece={toPiece(item)}
          text={openId === item.slug ? texts[item.slug] : undefined}
          expanded={openId === item.slug}
          onToggle={() => open(item.slug)}
          onChangeStatus={async (next) => {
            const result = await changePieceStatus('linkedin', item.slug, next);
            if (!result.ok) return setError(result.error);
            setError('');
            await load();
          }}
          onSaveText={async (text) => {
            const result = await savePieceText('linkedin', item.slug, text);
            if (!result.ok) { setError(result.error); return false; }
            setError('');
            setTexts((current) => ({ ...current, [item.slug]: text }));
            await load();
            return true;
          }}
          onAttachMarkdown={async (markdown, filename) => {
            const result = await attachPieceMarkdown('linkedin', item.slug, markdown, filename);
            if (!result.ok) { setError(result.error); return false; }
            setError('');
            const text = await fetchPieceText('linkedin', item.slug).catch(() => '');
            setTexts((current) => ({ ...current, [item.slug]: text }));
            await load();
            return true;
          }}
          extra={<PdfSlot slug={item.slug} name={item.pdf_original_name} size={item.pdf_size_bytes}
            hasPdf={item.has_pdf} onChanged={load} />}
        />)}
    </div>

    {creating && <NewPieceModal blogs={blogs} onClose={() => setCreating(false)}
      onCreated={async () => { setCreating(false); await load(); }} />}
  </div>;
}
