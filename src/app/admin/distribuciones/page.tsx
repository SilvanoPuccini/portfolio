'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CopyIconButton, IconButton, CrossIcon } from '@/components/admin/IconButton';
import { StatusPill } from '@/components/admin/StatusPill';
import { DISTRIBUTION_LABELS, DISTRIBUTION_TONE, DISTRIBUTION_EQUIVALENT } from '@/components/admin/distribution/status';
import { DistributionRowSkeleton } from '@/components/admin/distribution/Skeleton';
import { c, tint } from '@/components/admin/tokens';
import type { DistributionListItem, DistributionStatus } from '@/lib/distribution/types';

type Source = { channel: 'portfolio' | 'linkedin'; id: string; title: string };
type StatusFilter = 'all' | DistributionStatus;

const PER_PAGE = 10;
const TILES: DistributionStatus[] = ['draft', 'approved', 'published', 'error'];

const chip = (active: boolean): React.CSSProperties => ({
  background: active ? tint(c.ready, '12') : 'transparent',
  color: active ? c.ready : c.textSoft,
  border: `1px solid ${active ? c.ready : c.border}`,
  borderRadius: 7, padding: '6px 13px', fontSize: 12, fontWeight: 500, cursor: 'pointer',
  fontFamily: 'inherit',
});

function relative(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'hace un momento';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86_400) return `hace ${Math.floor(diff / 3600)} h`;
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * De dónde salió: el portfolio es un rectángulo de esquinas rectas y LinkedIn
 * una pastilla redonda, la misma forma que en la agenda. El color queda para el
 * estado, igual que en el resto del admin.
 */
function SourceTag({ channel }: { channel: 'portfolio' | 'linkedin' }) {
  const portfolio = channel === 'portfolio';
  return <span aria-hidden style={{
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4,
    width: 74, height: 20, flexShrink: 0,
    fontFamily: 'monospace', fontSize: 8.5, fontWeight: 700, letterSpacing: '0.08em',
    borderRadius: portfolio ? 3 : 10,
    border: `1px solid ${portfolio ? 'rgba(226,232,240,.28)' : 'rgba(226,232,240,.16)'}`,
    background: portfolio ? 'rgba(226,232,240,.09)' : 'transparent',
    color: c.textSoft,
  }}>
    <span style={{ width: 5, height: 5, flexShrink: 0, borderRadius: portfolio ? 0 : '50%', background: 'currentColor' }} />
    {portfolio ? 'PORTFOLIO' : 'LINKEDIN'}
  </span>;
}

function Tile({ status, value, active, onClick }: {
  status: DistributionStatus; value: number; active: boolean; onClick: () => void;
}) {
  const tone = DISTRIBUTION_TONE[status];
  const equivalent = DISTRIBUTION_EQUIVALENT[status];
  return <button type="button" onClick={onClick} aria-pressed={active}
    title={equivalent ? `Equivale a "${equivalent}" en la agenda` : undefined}
    className="transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
    style={{
      flex: '1 1 130px', minWidth: 0, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
      background: active ? tint(tone, '1a') : c.surface,
      border: `1px solid ${active ? tone : c.border}`,
      borderLeft: `3px solid ${tone}`, borderRadius: 10, padding: '11px 14px',
    }}>
    <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1, color: tone, letterSpacing: '-0.02em' }}>{value}</div>
    <div style={{ marginTop: 5, fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: active ? c.text : c.textDim }}>
      {DISTRIBUTION_LABELS[status]}
    </div>
  </button>;
}

/**
 * Alta de una distribución.
 *
 * El progreso que se muestra es el tiempo transcurrido, que es real. Antes se
 * mostraban seis pasos que avanzaban con un setInterval cada 4,5 s sin saber
 * nada del servidor: decían "renderizando imágenes" cuando podían estar todavía
 * en la primera llamada, o haber fallado.
 */
function NewDistributionModal({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [sources, setSources] = useState<Source[]>([]);
  const [sourceKey, setSourceKey] = useState('');
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState('');
  const started = useRef(0);

  useEffect(() => {
    fetch('/api/admin/distribution-sources')
      .then((response) => response.json())
      .then((data) => setSources(data.sources ?? []))
      .catch(() => setError('No se pudieron cargar las fuentes'));
  }, []);

  useEffect(() => {
    if (!running) return;
    started.current = Date.now();
    const tick = setInterval(() => setElapsed(Math.round((Date.now() - started.current) / 1000)), 1000);
    return () => clearInterval(tick);
  }, [running]);

  async function generate() {
    const source = sources.find((item) => `${item.channel}:${item.id}` === sourceKey);
    if (!source) return;
    setRunning(true); setError(''); setElapsed(0);
    try {
      const response = await fetch('/api/admin/distribute', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: { channel: source.channel, id: source.id } }),
      });
      const data = await response.json() as { id?: string; error?: string };
      if (!response.ok || !data.id) throw new Error(data.error ?? 'No se pudo generar');
      onCreated(data.id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo generar');
      setRunning(false);
    }
  }

  return <div role="dialog" aria-modal="true" aria-label="Nueva distribución"
    style={{ position: 'fixed', inset: 0, zIndex: 120, padding: 20, background: 'rgba(3,5,12,.76)', display: 'grid', placeItems: 'center' }}>
    <div style={{ width: '100%', maxWidth: 460, background: c.surface, border: `1px solid ${c.border}`, borderRadius: 14, padding: 20, boxShadow: '0 24px 60px rgba(0,0,0,.5)' }}>
      <header style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
        <div>
          <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: c.ready }}>Nueva distribución</p>
          <h2 style={{ margin: '4px 0 0', fontSize: 17, fontWeight: 700, color: c.text }}>Elegí el contenido de origen</h2>
        </div>
        {!running && <span style={{ marginLeft: 'auto' }}>
          <IconButton label="Cerrar" onClick={onClose}><CrossIcon /></IconButton>
        </span>}
      </header>

      {running ? <div style={{ padding: '18px 0', textAlign: 'center' }}>
        <div aria-hidden style={{
          width: 34, height: 34, margin: '0 auto 16px', borderRadius: '50%',
          border: `3px solid ${c.border}`, borderTopColor: c.ready,
          animation: 'adminSpin .8s linear infinite',
        }} />
        <style>{'@keyframes adminSpin { to { transform: rotate(360deg) } }'}</style>
        <p aria-live="polite" style={{ margin: 0, fontSize: 14, fontWeight: 600, color: c.text }}>
          Generando con IA · {elapsed}s
        </p>
        <p style={{ margin: '6px 0 0', fontSize: 12, color: c.textDim }}>
          Suele tardar entre 30 y 60 segundos. No cierres la pestaña.
        </p>
      </div> : <>
        <select value={sourceKey} onChange={(event) => setSourceKey(event.target.value)}
          aria-label="Contenido de origen"
          style={{
            width: '100%', boxSizing: 'border-box', marginBottom: 14, padding: '10px 13px',
            background: c.page, border: `1px solid ${c.border}`, borderRadius: 8,
            color: c.text, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
          }}>
          <option value="">— Elegí contenido guardado —</option>
          {sources.map((source) => <option key={`${source.channel}:${source.id}`} value={`${source.channel}:${source.id}`}>
            {source.channel === 'portfolio' ? 'Portfolio' : 'LinkedIn'} · {source.title}
          </option>)}
        </select>

        {error && <p role="alert" style={{ margin: '0 0 12px', padding: '9px 12px', borderRadius: 8, border: `1px solid ${c.late}`, background: tint(c.late, '0f'), color: c.late, fontSize: 12 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={chip(false)}>Cancelar</button>
          <button type="button" onClick={generate} disabled={!sourceKey}
            className="transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
            style={{
              background: c.ready, color: c.page, border: 0, borderRadius: 8,
              padding: '9px 18px', fontWeight: 700, fontSize: 13, fontFamily: 'inherit',
              cursor: sourceKey ? 'pointer' : 'not-allowed', opacity: sourceKey ? 1 : .45,
            }}>Generar →</button>
        </div>
      </>}
    </div>
  </div>;
}

export default function DistribucionesPage() {
  const [items, setItems] = useState<DistributionListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async (filter: StatusFilter, current: number) => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ page: String(current), per_page: String(PER_PAGE) });
      if (filter !== 'all') params.set('status', filter);
      const response = await fetch(`/api/admin/distributions?${params}`);
      if (!response.ok) throw new Error(`Error ${response.status}`);
      const data = await response.json() as { items: DistributionListItem[]; total: number };
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudieron cargar las distribuciones');
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(status, page); }, [load, status, page]);

  // Los contadores miran la página traída, no la base entera: la API pagina y
  // filtra del lado del servidor, así que se rotula lo que se está mostrando.
  const counts = useMemo(() => {
    const map = { draft: 0, approved: 0, published: 0, archived: 0, error: 0 } as Record<DistributionStatus, number>;
    for (const item of items) map[item.status] += 1;
    return map;
  }, [items]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  function pick(next: DistributionStatus) {
    setStatus((current) => (current === next ? 'all' : next));
    setPage(1);
  }

  return <div>
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
      <div>
        <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: c.ready }}>El Radar</p>
        <h1 style={{ margin: '5px 0 4px', fontSize: 23, fontWeight: 700, color: c.text, letterSpacing: '-0.02em' }}>Distribuciones</h1>
        <p style={{ margin: 0, fontSize: 12, color: c.textDim }}>
          Versiones derivadas de un contenido ya guardado. La generación con IA es opcional.
        </p>
      </div>
      <button onClick={() => setCreating(true)}
        className="transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
        style={{ background: c.ready, color: c.page, border: 0, borderRadius: 8, padding: '10px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
      >+ Nueva distribución</button>
    </header>

    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
      {TILES.map((entry) => <Tile key={entry} status={entry} value={counts[entry]}
        active={status === entry} onClick={() => pick(entry)} />)}
    </div>

    {error && <div role="alert" style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 8, border: `1px solid ${c.late}`, background: tint(c.late, '0f'), color: c.late, fontSize: 13, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      <span>{error}</span>
      <button onClick={() => load(status, page)} style={{ ...chip(false), marginLeft: 'auto' }}>Reintentar</button>
    </div>}

    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
      <button style={chip(status === 'all')} onClick={() => { setStatus('all'); setPage(1); }}
        className="transition-colors hover:border-[#00d4d4] hover:text-[#00d4d4]">Todos</button>
      {(['draft', 'approved', 'published', 'archived', 'error'] as DistributionStatus[]).map((entry) =>
        <button key={entry} style={chip(status === entry)} onClick={() => pick(entry)}
          className="transition-colors hover:border-[#00d4d4] hover:text-[#00d4d4]"
        >{DISTRIBUTION_LABELS[entry]}</button>)}
    </div>

    <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 12, overflow: 'hidden' }}>
      {loading ? [1, 2, 3].map((key) => <DistributionRowSkeleton key={key} />)
        : items.length === 0 ? <div style={{ padding: '30px 20px', textAlign: 'center' }}>
          <p style={{ margin: '0 0 12px', fontSize: 13, color: c.textDim }}>
            {status === 'all' ? 'Todavía no hay distribuciones.' : `No hay distribuciones en "${DISTRIBUTION_LABELS[status]}".`}
          </p>
          <button onClick={() => setCreating(true)} style={chip(false)}>Generar la primera →</button>
        </div>
        : items.map((item, index) => {
          const tone = DISTRIBUTION_TONE[item.status];
          // El post_slug guarda "linkedin:algo" cuando el origen es LinkedIn.
          const channel = item.post_slug.startsWith('linkedin:') ? 'linkedin' as const : 'portfolio' as const;
          return <article key={item.id} style={{
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
            padding: '12px 14px',
            borderTop: index === 0 ? 'none' : `1px solid ${c.border}`,
            boxShadow: `inset 3px 0 0 ${tone}`,
          }}>
            <SourceTag channel={channel} />

            <div style={{ flex: '1 1 200px', minWidth: 0 }}>
              <a href={`/admin/distribuciones/${item.id}`} title={item.post_title}
                className="transition-colors hover:text-[#00d4d4]"
                style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.text, textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >{item.post_title}</a>
              <div style={{ fontSize: 10, fontFamily: 'monospace', color: c.textDim, marginTop: 2 }}>
                {relative(item.created_at)}
                {' · '}IN {item.linkedin_slides_count} · IG {item.instagram_slides_count} · X {item.twitter_tweets_count}
                {item.ai_metadata && ` · ${item.ai_metadata.tokens_used.toLocaleString('es-AR')} tokens`}
              </div>
            </div>

            <StatusPill tone={tone} label={DISTRIBUTION_LABELS[item.status]}
              title={DISTRIBUTION_EQUIVALENT[item.status] ? `Equivale a "${DISTRIBUTION_EQUIVALENT[item.status]}" en la agenda` : undefined} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
              <CopyIconButton text={item.post_title} label="Copiar el título" />
              <IconButton label={item.status === 'draft' ? 'Revisar la distribución' : 'Abrir la distribución'}
                onClick={() => { window.location.href = `/admin/distribuciones/${item.id}`; }}>↗</IconButton>
            </div>
          </article>;
        })}
    </div>

    {totalPages > 1 && <div style={{ display: 'flex', gap: 12, marginTop: 14, justifyContent: 'center', alignItems: 'center' }}>
      <button style={chip(false)} disabled={page <= 1} onClick={() => setPage(page - 1)}
        className="transition-colors hover:border-[#00d4d4] hover:text-[#00d4d4] disabled:opacity-35">← Ant.</button>
      <span style={{ minWidth: 130, textAlign: 'center', fontFamily: 'monospace', fontSize: 11, color: c.textDim }}>
        {page} / {totalPages} · {total} en total
      </span>
      <button style={chip(false)} disabled={page >= totalPages} onClick={() => setPage(page + 1)}
        className="transition-colors hover:border-[#00d4d4] hover:text-[#00d4d4] disabled:opacity-35">Sig. →</button>
    </div>}

    {creating && <NewDistributionModal onClose={() => setCreating(false)}
      onCreated={(id) => { window.location.href = `/admin/distribuciones/${id}`; }} />}
  </div>;
}
