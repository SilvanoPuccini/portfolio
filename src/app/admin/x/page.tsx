'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PeriodPicker, inPeriod, periodLabel, type Period } from '@/components/admin/PeriodPicker';
import { XThreadRow } from '@/components/admin/x/XThreadRow';
import { c, tint } from '@/components/admin/tokens';
import type { XThread, XThreadListItem, XThreadStatus } from '@/lib/x/types';
import {
  formatXReadWarning,
  formatXVerificationFailure,
  type XVerificationStep,
} from '@/lib/x/diagnostics';
import { resolveXThreadDeepLink } from '@/lib/x/deep-link';
import { groupThreadsByPost, orderedPosts, postFilterSections } from '@/lib/x/grouping';
import type { PostPublicationListItem } from '@/lib/post-publications/types';

type Filter = 'all' | XThreadStatus;

const TILES: { status: XThreadStatus; label: string; tone: string }[] = [
  { status: 'planificado', label: 'Sin escribir', tone: c.planned },
  { status: 'preaprobado', label: 'Listos', tone: c.ready },
  { status: 'publicado', label: 'Publicados', tone: c.published },
  { status: 'error', label: 'Con problema', tone: c.late },
];

const chip = (active: boolean): React.CSSProperties => ({
  background: active ? tint(c.ready, '12') : 'transparent',
  color: active ? c.ready : c.textSoft,
  border: `1px solid ${active ? c.ready : c.border}`,
  borderRadius: 7, padding: '6px 13px', fontSize: 12, fontWeight: 500, cursor: 'pointer',
  fontFamily: 'inherit',
});

function Tile({ tone, value, label, active, onClick }: {
  tone: string; value: number; label: string; active: boolean; onClick: () => void;
}) {
  return <button type="button" onClick={onClick} aria-pressed={active}
    className="transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
    style={{
      flex: '1 1 130px', minWidth: 0, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
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

function XPageContent() {
  const searchParams = useSearchParams();
  const requestedThreadId = searchParams.get('thread');
  const handledDeepLink = useRef<string | null>(null);
  const [items, setItems] = useState<XThreadListItem[]>([]);
  const [full, setFull] = useState<Record<string, XThread>>({});
  const [blogs, setBlogs] = useState<PostPublicationListItem[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [postFilter, setPostFilter] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>({ mode: 'semana', anchor: new Date().toISOString() });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [planning, setPlanning] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [account, setAccount] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<Record<string, string>>({});
  const [importOpen, setImportOpen] = useState(false);
  const [importPost, setImportPost] = useState('');
  const [importSummary, setImportSummary] = useState('');
  const [importDate, setImportDate] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 16));
  const [importText, setImportText] = useState('');
  const [importReport, setImportReport] = useState('');
  const [autopilot, setAutopilot] = useState<boolean | null>(null);
  const [autopilotBusy, setAutopilotBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    // La agenda completa, página a página: el número de post es su orden
    // cronológico global, así que no puede depender de la página que se vea.
    const threadsPromise = fetch('/api/admin/x-threads');
    const firstPage = await fetch('/api/admin/posts-agenda?page=1&per_page=200')
      .then((response) => response.json().catch(() => ({})));
    const blogItems: PostPublicationListItem[] = [...(firstPage.items ?? [])];
    const total = firstPage.total ?? blogItems.length;
    for (let page = 2; page <= Math.ceil(total / 200); page++) {
      const json = await fetch(`/api/admin/posts-agenda?page=${page}&per_page=200`)
        .then((response) => response.json().catch(() => ({})));
      blogItems.push(...(json.items ?? []));
    }
    const threadsResponse = await threadsPromise;
    const threadsJson = await threadsResponse.json().catch(() => ({}));
    setLoading(false);
    if (!threadsResponse.ok) return setError(threadsJson.error ?? 'No se pudieron cargar los hilos');
    setItems(threadsJson.items ?? []);
    setBlogs(blogItems);
    setError('');

    // Carga el estado del piloto automático en paralelo — no bloquea la lista.
    fetch('/api/admin/x-autopilot')
      .then((r) => r.json())
      .then((j) => { if (typeof j.autopilot === 'boolean') setAutopilot(j.autopilot); })
      .catch(() => { /* silencioso: el panel sigue funcionando */ });
  }, []);
  useEffect(() => { load(); }, [load]);

  const inScope = useMemo(() => items.filter((item) => inPeriod(item.scheduled_at, period)), [items, period]);
  const posts = useMemo(() => orderedPosts(blogs), [blogs]);
  const now = new Date().toISOString();
  const countByPost = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of inScope) map[item.post_slug] = (map[item.post_slug] ?? 0) + 1;
    return map;
  }, [inScope]);
  const { past, future } = useMemo(
    () => postFilterSections(posts, countByPost, now),
    [posts, countByPost, now],
  );
  // El filtro por post deja de mirar el período: elegir un post viejo muestra
  // SUS hilos (o la ausencia) sin importar en qué semana cayeron.
  const scopeItems = useMemo(
    () => (postFilter ? items.filter((item) => item.post_slug === postFilter) : inScope),
    [items, inScope, postFilter],
  );
  const counts = useMemo(() => {
    const map: Record<XThreadStatus, number> = { planificado: 0, preaprobado: 0, publicado: 0, error: 0 };
    for (const item of scopeItems) map[item.status] += 1;
    return map;
  }, [scopeItems]);
  const visible = useMemo(
    () => scopeItems.filter((item) => filter === 'all' || item.status === filter),
    [scopeItems, filter],
  );
  const groups = useMemo(() => {
    const base = groupThreadsByPost(visible, posts);
    const present = new Set(base.map((group) => group.post_slug));
    // Los posts del período sin hilos también se muestran: para volver a un
    // post viejo y armarle la semana desde acá. Con filtro de post activo, solo
    // ese post.
    const empty = (postFilter
      ? posts.filter((post) => post.post_slug === postFilter)
      : posts.filter((post) => inPeriod(post.scheduled_at, period))
    ).filter((post) => !present.has(post.post_slug));
    return [...base, ...empty.map((post) => ({
      post_slug: post.post_slug, title: post.title, number: post.number, threads: [],
    }))].sort((a, b) => a.number - b.number);
  }, [posts, visible, period, postFilter]);

  /** La lista no incluye los tweets completos; se traen una sola vez al abrir. */
  const loadFullThread = useCallback(async (id: string) => {
    if (full[id]) return;
    const response = await fetch(`/api/admin/x-threads/${id}`);
    const json = await response.json().catch(() => ({}));
    if (response.ok) setFull((current) => ({ ...current, [id]: json.item }));
  }, [full]);

  const open = useCallback(async (id: string) => {
    setOpenId((current) => (current === id ? null : id));
    await loadFullThread(id);
  }, [loadFullThread]);

  /**
   * Agenda links to a concrete row. Move the period/filter just enough to make
   * that row visible, load its detail, then leave ordinary list behavior alone.
   */
  useEffect(() => {
    if (loading || handledDeepLink.current === requestedThreadId) return;
    const target = resolveXThreadDeepLink(items, requestedThreadId);
    if (!target) return;

    handledDeepLink.current = target.id;
    setFilter('all');
    setPostFilter(null);
    setPeriod(target.period);
    setOpenId(target.id);
    void loadFullThread(target.id);
  }, [items, loadFullThread, loading, requestedThreadId]);

  useEffect(() => {
    if (!requestedThreadId || openId !== requestedThreadId) return;
    if (!visible.some((item) => item.id === requestedThreadId)) return;

    const frame = window.requestAnimationFrame(() => {
      const row = document.getElementById(`x-thread-${requestedThreadId}`);
      row?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      row?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [openId, requestedThreadId, visible]);

  async function act(id: string, run: () => Promise<Response>) {
    setBusyId(id); setError(''); setWarnings((current) => ({ ...current, [id]: '' }));
    const response = await run();
    const json = await response.json().catch(() => ({})) as { item?: XThread; warning?: string; error?: string };
    setBusyId(null);
    if (!response.ok) {
      // El 402 de X ya quedó en last_error de la fila: el panel lo muestra como
      // "copiá y publicá a mano". No hace falta repetirlo acá.
      if (response.status !== 402) setError(json.error ?? 'No se pudo completar');
      return false;
    }
    const updated = json.item;
    if (updated) setFull((current) => ({ ...current, [id]: updated }));
    const warning = json.warning;
    if (warning) setWarnings((current) => ({ ...current, [id]: warning }));
    await load();
    return true;
  }

  /**
   * Publica un tweet de prueba y lo borra. Es la única forma de saber si los
   * tokens pueden escribir: leer funciona igual con permisos de solo lectura.
   */
  async function checkAccount() {
    setError(''); setBusyId('verify');
    try {
      const response = await fetch('/api/admin/x-verify', { method: 'POST' });
      const json = await response.json().catch(() => ({})) as {
        ok?: boolean;
        username?: string | null;
        steps?: XVerificationStep[];
        hint?: string;
      };
      if (json.ok) {
        setAccount(json.username ? `@${json.username}` : 'X');
        setError(formatXReadWarning(json.steps));
      } else {
        setError(formatXVerificationFailure(json));
      }
    } catch (reason) {
      setError(`Error de red al conectar: ${reason instanceof Error ? reason.message : 'falló la petición'}`);
    } finally {
      setBusyId(null);
    }
  }

  /** Solo los posts de la agenda que todavía no tienen su semana armada. */
  const plannable = useMemo(() => {
    const planned = new Set(items.map((item) => item.post_slug));
    return posts.filter((post) => !planned.has(post.post_slug));
  }, [posts, items]);

  /** Arma la semana de un post. Si vino de un grupo sin hilos, lo deja filtrado. */
  const planFor = useCallback(async (postSlug: string) => {
    setBusyId('plan'); setError('');
    const response = await fetch('/api/admin/x-threads', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_slug: postSlug }),
    });
    const json = await response.json().catch(() => ({}));
    setBusyId(null);
    if (!response.ok) return setError(json.error ?? 'No se pudo planificar');
    setPostFilter(postSlug);
    await load();
  }, []);

  return <div>
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
      <div>
        <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: c.ready }}>El Radar</p>
        <h1 style={{ margin: '5px 0 4px', fontSize: 23, fontWeight: 700, color: c.text, letterSpacing: '-0.02em' }}>Hilos de X</h1>
        <p style={{ margin: 0, fontSize: 12, color: c.textDim }}>
          Cuatro por semana, sacados del post del domingo. Lunes, miércoles, jueves y sábado.
        </p>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={checkAccount} disabled={busyId === 'verify'}
          title="Publica un tweet de prueba y lo borra: es la única forma de comprobar el permiso de escritura"
          style={chip(Boolean(account))}
          className="transition-colors hover:border-[#00d4d4] hover:text-[#00d4d4]">
          {busyId === 'verify' ? 'Probando...' : account ? `${account} puede publicar` : 'Probar conexión con X'}
        </button>
        <select value={planning} onChange={(event) => setPlanning(event.target.value)}
          aria-label="Post del blog para planificar"
          style={{ ...chip(false), fontFamily: 'inherit', maxWidth: 240 }}>
          <option value="">Planificar la semana de...</option>
          {plannable.map((post) => <option key={post.post_slug} value={post.post_slug}>
            {`${post.number > 0 ? `Nº ${String(post.number).padStart(2, '0')} · ` : ''}${post.title} (${new Date(post.scheduled_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })})`}
          </option>)}
        </select>
        <button disabled={!planning || busyId === 'plan'}
          onClick={() => void planFor(planning)}
          className="transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
          style={{
            background: c.ready, color: c.page, border: 0, borderRadius: 8, padding: '10px 18px',
            fontWeight: 700, fontSize: 13, fontFamily: 'inherit',
            cursor: planning ? 'pointer' : 'not-allowed', opacity: planning ? 1 : .45,
          }}>{busyId === 'plan' ? 'Armando...' : 'Armar semana'}</button>
        <button onClick={() => setImportOpen((current) => !current)}
          aria-expanded={importOpen}
          style={chip(importOpen)}
          className="transition-colors hover:border-[#00d4d4] hover:text-[#00d4d4]">
          Importar un hilo
        </button>
      </div>
    </header>

    {importOpen && <div style={{
      marginBottom: 16, padding: 16, borderRadius: 12,
      background: c.surface, border: `1px solid ${c.border}`,
    }}>
      <p style={{ margin: '0 0 4px', fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: c.ready }}>
        Importar hilo escrito a mano
      </p>
      <p style={{ margin: '0 0 12px', fontSize: 12, color: c.textDim, lineHeight: 1.5 }}>
        Pegá el texto completo. Los saltos simples se unen con un espacio; una línea en blanco
        (punto y aparte) separa párrafos. Cada post tiene un máximo ponderado de 280 caracteres.
      </p>
      <div style={{ display: 'grid', gap: 10, marginBottom: 10 }}>
        <select value={importPost} onChange={(event) => setImportPost(event.target.value)}
          aria-label="Post del blog del hilo"
          style={{ ...chip(false), fontFamily: 'inherit' }}>
          <option value="">Post del blog...</option>
          {posts.map((post) => <option key={post.post_slug} value={post.post_slug}>
            {`${post.number > 0 ? `Nº ${String(post.number).padStart(2, '0')} · ` : ''}${post.title} (${new Date(post.scheduled_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })})`}
          </option>)}
        </select>
        <input value={importSummary} onChange={(event) => setImportSummary(event.target.value)}
          aria-label="Angulo del hilo"
          placeholder="Angulo (resumen | pregunta)"
          style={{
            padding: '8px 12px', borderRadius: 7, fontSize: 12, color: c.text,
            background: c.page, border: `1px solid ${c.border}`, outline: 'none', fontFamily: 'inherit',
          }} />
        <input type="datetime-local" value={importDate} onChange={(event) => setImportDate(event.target.value)}
          aria-label="Fecha y hora del hilo"
          style={{
            padding: '8px 12px', borderRadius: 7, fontSize: 12, color: c.text,
            background: c.page, border: `1px solid ${c.border}`, outline: 'none', fontFamily: 'inherit',
          }} />
        <textarea value={importText} onChange={(event) => setImportText(event.target.value)}
          aria-label="Texto completo del hilo"
          placeholder="Pegá acá el texto completo del hilo"
          style={{
            minHeight: 110, padding: 11, borderRadius: 8, fontSize: 13, lineHeight: 1.6,
            color: c.text, background: c.page, border: `1px solid ${c.border}`,
            fontFamily: 'inherit', resize: 'vertical', outline: 'none',
          }} />
      </div>
      {importReport && <p role="alert" style={{
        margin: '0 0 10px', padding: '9px 12px', borderRadius: 8, fontSize: 11, lineHeight: 1.5,
        border: `1px solid ${c.late}`, background: tint(c.late, '0f'), color: c.late,
      }}>{importReport}</p>}
      <button type="button" disabled={!importPost || !importSummary || !importText || busyId === 'import'}
        onClick={async () => {
          setBusyId('import'); setError(''); setImportReport('');
          const response = await fetch('/api/admin/x-threads/import', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              post_slug: importPost,
              angle_id: importSummary.replace(/\s+/g, '-').toLowerCase().slice(0, 60) || 'importado',
              angle_summary: importSummary,
              scheduled_at: new Date(importDate).toISOString(),
              text: importText,
            }),
          });
          const json = await response.json().catch(() => ({})) as {
            item?: XThread; oversize?: { tweet_number: number; length: number }[]; error?: string;
          };
          setBusyId(null);
          if (!response.ok) return setImportReport(json.error ?? 'No se pudo importar');
          if (json.oversize?.length) {
            setImportReport(`Se importó, pero estos tweets pasan de 280: ${json.oversize.map((o) => `#${o.tweet_number} (${o.length})`).join(', ')}.`);
          }
          setImportText(''); setImportSummary(''); setImportOpen(false);
          await load();
        }}
        className="transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
        style={{
          background: c.ready, color: c.page, border: 0, borderRadius: 8, padding: '10px 18px',
          fontWeight: 700, fontSize: 13, fontFamily: 'inherit',
          cursor: importPost && importSummary && importText ? 'pointer' : 'not-allowed',
          opacity: importPost && importSummary && importText ? 1 : .45,
        }}>{busyId === 'import' ? 'Importando...' : 'Importar'}</button>
    </div>}

    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 14 }}>
      <PeriodPicker value={period} onChange={setPeriod} />
      <span style={{ fontSize: 11, color: c.textDim }}>
        {scopeItems.length} {scopeItems.length === 1 ? 'hilo' : 'hilos'}{postFilter ? ' en el post filtrado' : ` en ${periodLabel(period)}`}
      </span>
    </div>

    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
      {TILES.map((tile) => <Tile key={tile.status} tone={tile.tone} label={tile.label}
        value={counts[tile.status]} active={filter === tile.status}
        onClick={() => setFilter((current) => (current === tile.status ? 'all' : tile.status))} />)}
    </div>

    {posts.length > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      <span style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: c.textDim, whiteSpace: 'nowrap' }}>Post</span>
      <select value={postFilter ?? ''} onChange={(event) => setPostFilter(event.target.value || null)}
        aria-label="Filtrar hilos por post (Pasados / Nuevos)"
        title={postFilter ? (past.find((p) => p.post_slug === postFilter) ?? future.find((p) => p.post_slug === postFilter))?.label : 'Todos los posts'}
        style={{ ...chip(postFilter !== null), fontFamily: 'inherit', maxWidth: 340, overflow: 'hidden', textOverflow: 'ellipsis' }}>
        <option value="">Todos los posts</option>
        {past.length > 0 && <optgroup label="Pasados">
          {past.map((post) => <option key={post.post_slug} value={post.post_slug}>
            {post.label}{post.count > 0 && ` · ${post.count}`}
          </option>)}
        </optgroup>}
        {future.length > 0 && <optgroup label="Nuevos">
          {future.map((post) => <option key={post.post_slug} value={post.post_slug}>
            {post.label}{post.count > 0 && ` · ${post.count}`}
          </option>)}
        </optgroup>}
      </select>
    </div>}

    {error && <div role="alert" style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 8, border: `1px solid ${c.late}`, background: tint(c.late, '0f'), color: c.late, fontSize: 13 }}>{error}</div>}

    <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 12, overflow: 'hidden' }}>
      {loading ? <p style={{ margin: 0, padding: 20, fontSize: 12, color: c.textDim }}>Cargando...</p>
        : visible.length === 0 ? <p style={{ margin: 0, padding: 20, fontSize: 12, color: c.textDim }}>
          {items.length === 0
            ? 'Todavía no hay hilos. Elegí un post del blog y armá su semana.'
            : `No hay hilos en ${periodLabel(period)} con este filtro.`}
        </p>
        : groups.map((group) => (
          <section key={group.post_slug} aria-label={`Semana de ${group.title}`}
            style={{ borderBottom: `1px solid ${c.border}` }}>
            <header style={{
              display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap',
              padding: '9px 14px', background: tint(c.ready, '07'),
              borderBottom: `1px solid ${c.border}`,
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: c.text, letterSpacing: '-0.01em' }}>
                {group.number > 0 ? `Nº ${String(group.number).padStart(2, '0')} · ${group.title}` : group.title}
              </span>
              <span style={{
                fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: c.textDim,
              }}>
                {group.threads.length === 0
                  ? 'Sin hilos todavia'
                  : `Semana · ${group.threads.length} ${group.threads.length === 1 ? 'hilo' : 'hilos'} · desde ${new Date(group.threads[0].scheduled_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}`}
              </span>
            </header>
            {group.threads.length === 0 && <div style={{ padding: 14 }}>
              <p style={{ margin: '0 0 10px', fontSize: 12, color: c.textDim }}>
                Este post todavia no tiene hilos: arma su semana y despues escribi cada texto.
              </p>
              <button type="button" disabled={busyId === 'plan'}
                onClick={() => void planFor(group.post_slug)}
                className="transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
                style={{
                  height: 30, padding: '0 15px', borderRadius: 7, border: 0,
                  background: c.ready, color: c.page, fontSize: 12, fontWeight: 700,
                  cursor: busyId === 'plan' ? 'wait' : 'pointer', fontFamily: 'inherit',
                }}>{busyId === 'plan' ? 'Armando...' : 'Armar semana'}</button>
            </div>}
            {group.threads.map((item) => <XThreadRow key={item.id} item={item}
              expanded={openId === item.id}
              full={full[item.id]}
              busy={busyId === item.id}
              warning={warnings[item.id] ? warnings[item.id] : null}
              onToggle={() => open(item.id)}
              onGenerate={() => act(item.id, () => fetch(`/api/admin/x-threads/${item.id}/generate`, { method: 'POST' }))}
              onPublish={() => act(item.id, () => fetch(`/api/admin/x-threads/${item.id}/publish`, { method: 'POST' }))}
              onChangeStatus={(status) => act(item.id, () => fetch(`/api/admin/x-threads/${item.id}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
              }))}
              onSaveDate={(scheduledAt) => act(item.id, () => fetch(`/api/admin/x-threads/${item.id}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scheduled_at: scheduledAt }),
              }))}
              onSave={(tweets, reply) => act(item.id, () => fetch(`/api/admin/x-threads/${item.id}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tweets: tweets.map((text) => ({ text })), reply_with_link: reply }),
              }))}
              onMarkRemoved={() => act(item.id, () => fetch(`/api/admin/x-threads/${item.id}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mark_removed: true }),
              }))}
              onDelete={() => act(item.id, () => fetch(`/api/admin/x-threads/${item.id}`, { method: 'DELETE' }))}
            />)}
          </section>
        ))}
    </div>
  </div>;
}

export default function XPage() {
  return <Suspense fallback={<p style={{ color: c.textDim, fontSize: 12 }}>Cargando hilos...</p>}>
    <XPageContent />
  </Suspense>;
}
