'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { PeriodPicker, inPeriod, periodLabel, type Period } from '@/components/admin/PeriodPicker';
import { XThreadRow } from '@/components/admin/x/XThreadRow';
import { c, tint } from '@/components/admin/tokens';
import type { XThread, XThreadListItem, XThreadStatus } from '@/lib/x/types';
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

export default function XPage() {
  const [items, setItems] = useState<XThreadListItem[]>([]);
  const [full, setFull] = useState<Record<string, XThread>>({});
  const [blogs, setBlogs] = useState<PostPublicationListItem[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [period, setPeriod] = useState<Period>({ mode: 'semana', anchor: new Date().toISOString() });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [planning, setPlanning] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [account, setAccount] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [threadsResponse, blogsResponse] = await Promise.all([
      fetch('/api/admin/x-threads'),
      fetch('/api/admin/posts-agenda?page=1&per_page=200'),
    ]);
    const threadsJson = await threadsResponse.json().catch(() => ({}));
    const blogsJson = await blogsResponse.json().catch(() => ({}));
    setLoading(false);
    if (!threadsResponse.ok) return setError(threadsJson.error ?? 'No se pudieron cargar los hilos');
    setItems(threadsJson.items ?? []);
    setBlogs(blogsJson.items ?? []);
    setError('');
  }, []);
  useEffect(() => { load(); }, [load]);

  const inScope = useMemo(() => items.filter((item) => inPeriod(item.scheduled_at, period)), [items, period]);
  const counts = useMemo(() => {
    const map: Record<XThreadStatus, number> = { planificado: 0, preaprobado: 0, publicado: 0, error: 0 };
    for (const item of inScope) map[item.status] += 1;
    return map;
  }, [inScope]);
  const visible = useMemo(
    () => inScope.filter((item) => filter === 'all' || item.status === filter),
    [inScope, filter],
  );

  /** Al abrir una fila se trae el hilo completo, que la lista no incluye. */
  const open = useCallback(async (id: string) => {
    setOpenId((current) => (current === id ? null : id));
    if (full[id]) return;
    const response = await fetch(`/api/admin/x-threads/${id}`);
    const json = await response.json().catch(() => ({}));
    if (response.ok) setFull((current) => ({ ...current, [id]: json.item }));
  }, [full]);

  async function act(id: string, run: () => Promise<Response>) {
    setBusyId(id); setError('');
    const response = await run();
    const json = await response.json().catch(() => ({}));
    setBusyId(null);
    if (!response.ok) { setError(json.error ?? 'No se pudo completar'); return false; }
    if (json.item) setFull((current) => ({ ...current, [id]: json.item }));
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
      const json = await response.json().catch(() => ({}));
      if (json.ok) {
        setAccount(`@${json.username}`);
        setError('');
      } else {
        const failed = (json.steps ?? []).find((step: { ok: boolean }) => !step.ok);
        const detail = failed?.detail ? `: ${failed.detail}` : '';
        setError(`${failed?.step ?? 'Verificación'} falló${detail}. ${json.hint ?? ''}`);
      }
    } catch (reason) {
      setError(`Error de red al conectar: ${reason instanceof Error ? reason.message : 'falló la petición'}`);
    } finally {
      setBusyId(null);
    }
  }

  /** Solo los posts del blog que todavía no tienen su semana armada. */
  const plannable = useMemo(() => {
    const planned = new Set(items.map((item) => item.post_slug));
    return blogs.filter((blog) => !planned.has(blog.post_slug));
  }, [blogs, items]);

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
          {plannable.map((blog) => <option key={blog.post_slug} value={blog.post_slug}>{blog.raw_title}</option>)}
        </select>
        <button disabled={!planning || busyId === 'plan'}
          onClick={async () => {
            setBusyId('plan'); setError('');
            const response = await fetch('/api/admin/x-threads', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ post_slug: planning }),
            });
            const json = await response.json().catch(() => ({}));
            setBusyId(null);
            if (!response.ok) return setError(json.error ?? 'No se pudo planificar');
            setPlanning('');
            await load();
          }}
          className="transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
          style={{
            background: c.ready, color: c.page, border: 0, borderRadius: 8, padding: '10px 18px',
            fontWeight: 700, fontSize: 13, fontFamily: 'inherit',
            cursor: planning ? 'pointer' : 'not-allowed', opacity: planning ? 1 : .45,
          }}>{busyId === 'plan' ? 'Armando...' : 'Armar semana'}</button>
      </div>
    </header>

    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 14 }}>
      <PeriodPicker value={period} onChange={setPeriod} />
      <span style={{ fontSize: 11, color: c.textDim }}>
        {inScope.length} {inScope.length === 1 ? 'hilo' : 'hilos'} en {periodLabel(period)}
      </span>
    </div>

    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
      {TILES.map((tile) => <Tile key={tile.status} tone={tile.tone} label={tile.label}
        value={counts[tile.status]} active={filter === tile.status}
        onClick={() => setFilter((current) => (current === tile.status ? 'all' : tile.status))} />)}
    </div>

    {error && <div role="alert" style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 8, border: `1px solid ${c.late}`, background: tint(c.late, '0f'), color: c.late, fontSize: 13 }}>{error}</div>}

    <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 12, overflow: 'hidden' }}>
      {loading ? <p style={{ margin: 0, padding: 20, fontSize: 12, color: c.textDim }}>Cargando...</p>
        : visible.length === 0 ? <p style={{ margin: 0, padding: 20, fontSize: 12, color: c.textDim }}>
          {items.length === 0
            ? 'Todavía no hay hilos. Elegí un post del blog y armá su semana.'
            : `No hay hilos en ${periodLabel(period)} con este filtro.`}
        </p>
        : visible.map((item) => <XThreadRow key={item.id} item={item}
          expanded={openId === item.id}
          full={full[item.id]}
          busy={busyId === item.id}
          onToggle={() => open(item.id)}
          onGenerate={() => act(item.id, () => fetch(`/api/admin/x-threads/${item.id}/generate`, { method: 'POST' }))}
          onPublish={() => act(item.id, () => fetch(`/api/admin/x-threads/${item.id}/publish`, { method: 'POST' }))}
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
    </div>
  </div>;
}
