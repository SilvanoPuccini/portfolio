'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { s } from '@/components/admin/AdminShell';
import type { DistributionListItem, DistributionStatus } from '@/lib/distribution/types';
import { DistributionRowSkeleton } from '@/components/admin/distribution/Skeleton';

type Post = { slug: string; title: string; excerpt: string; issue: number };
type StatusFilter = 'all' | DistributionStatus;

const STATUS_LABELS: Record<DistributionStatus, string> = {
  draft: 'Borrador',
  approved: 'Aprobado',
  published: 'Publicado',
  archived: 'Archivado',
  error: 'Error',
};

const STATUS_COLORS: Record<DistributionStatus, { bg: string; color: string }> = {
  draft:     { bg: 'rgba(100,116,139,0.12)', color: '#64748b' },
  approved:  { bg: 'rgba(0,212,212,0.1)',    color: '#00d4d4' },
  published: { bg: 'rgba(74,222,128,0.1)',   color: '#4ade80' },
  archived:  { bg: 'rgba(71,85,105,0.15)',   color: '#475569' },
  error:     { bg: 'rgba(248,113,113,0.1)',  color: '#f87171' },
};

const GENERATE_STEPS = [
  'Analizando el post...',
  'Generando contenido para LinkedIn...',
  'Generando contenido para Instagram...',
  'Generando hilo de Twitter...',
  'Renderizando imágenes...',
  'Guardando...',
];

function fmt(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return 'hace un momento';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
}

function StatusBadge({ status }: { status: DistributionStatus }) {
  const { bg, color } = STATUS_COLORS[status];
  return (
    <span style={{
      fontSize: 11, padding: '3px 10px', borderRadius: 20,
      fontFamily: 'monospace', background: bg, color,
    }}>
      {STATUS_LABELS[status]}
    </span>
  );
}

// ── Modal nueva distribución ──────────────────────────────────

function NewDistributionModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/posts', {})
      .then((r) => r.json())
      .then((d) => setPosts(d.posts ?? []));
  }, []);

  // Avanza el mensaje de progreso mientras genera
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setStepIdx((i) => Math.min(i + 1, GENERATE_STEPS.length - 1));
    }, 4500);
    return () => clearInterval(interval);
  }, [loading]);

  async function handleGenerate() {
    if (!slug) return;
    setLoading(true);
    setStepIdx(0);
    setError('');

    try {
      const res = await fetch('/api/admin/distribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json() as { id?: string; error?: string };
      if (!res.ok || !data.id) throw new Error(data.error ?? 'Error desconocido');
      onCreated(data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar');
      setLoading(false);
    }
  }

  const selectedPost = posts.find((p) => p.slug === slug);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, padding: 24,
    }}>
      <div style={{ ...s.card, maxWidth: 480, width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <p style={s.eyebrow}>Nueva distribución</p>
            <h2 style={{ ...s.heading, fontSize: 18, marginBottom: 0 }}>Seleccioná un post</h2>
          </div>
          {!loading && (
            <button onClick={onClose} style={{ ...s.btnGhost, padding: '4px 10px', fontSize: 16 }}>✕</button>
          )}
        </div>

        {!loading ? (
          <>
            <select
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              style={{ ...s.input, marginBottom: 12 }}
            >
              <option value="">— Elegí un post —</option>
              {posts.map((p) => (
                <option key={p.slug} value={p.slug}>
                  Nº {String(p.issue).padStart(2, '0')} · {p.title}
                </option>
              ))}
            </select>

            {selectedPost && (
              <div style={{
                background: '#0f172a', border: '1px solid #1e293b',
                borderRadius: 8, padding: '12px 14px', marginBottom: 16,
              }}>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>{selectedPost.excerpt}</p>
              </div>
            )}

            {error && <p style={{ ...s.errorText, marginBottom: 12 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={s.btnGhost}>Cancelar</button>
              <button
                onClick={handleGenerate}
                disabled={!slug}
                style={{ ...s.btn, opacity: !slug ? 0.5 : 1 }}
              >
                Generar →
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{
              width: 40, height: 40, border: '3px solid #1e293b',
              borderTop: '3px solid #00d4d4', borderRadius: '50%',
              margin: '0 auto 20px',
              animation: 'spin 0.8s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ color: '#e2e8f0', fontSize: 14, margin: '0 0 8px', fontWeight: 500 }}>
              {GENERATE_STEPS[stepIdx]}
            </p>
            <p style={{ color: '#475569', fontSize: 12, margin: 0 }}>
              Esto puede tardar 30-60 segundos.
            </p>
            {/* Progress dots */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 20 }}>
              {GENERATE_STEPS.map((_, i) => (
                <div key={i} style={{
                  width: i <= stepIdx ? 18 : 6, height: 6, borderRadius: 3,
                  background: i <= stepIdx ? '#00d4d4' : '#1e293b',
                  transition: 'all 0.3s',
                }} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────

const PER_PAGE = 10;

export default function DistribucionesPage() {
  const [items, setItems] = useState<DistributionListItem[]>([]);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async (status: string, p: number) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(p), per_page: String(PER_PAGE) });
      if (status !== 'all') params.set('status', status);
      const res = await fetch(`/api/admin/distributions?${params}`, {});
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json() as { items: DistributionListItem[]; total: number };
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar distribuciones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(filter, page); }, [load, filter, page]);

  function handleFilterChange(f: StatusFilter) {
    setFilter(f);
    setPage(1);
  }

  function handleCreated(id: string) {
    setShowModal(false);
    window.location.href = `/admin/distribuciones/${id}`;
  }

  const statuses: StatusFilter[] = ['all', 'draft', 'approved', 'published', 'error'];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <p style={s.eyebrow}>El Radar</p>
          <h1 style={{ ...s.heading, marginBottom: 0, fontSize: 24 }}>Distribuciones</h1>
        </div>
        <button onClick={() => setShowModal(true)} style={s.btn}>
          + Nueva distribución
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {statuses.map((st) => (
          <button key={st} onClick={() => handleFilterChange(st)} style={{
            ...s.btnGhost,
            color: filter === st ? '#00d4d4' : '#475569',
            borderColor: filter === st ? '#00d4d4' : '#1e293b',
          }}>
            {st === 'all' ? 'Todos' : STATUS_LABELS[st as DistributionStatus]}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div style={s.card}>
        {loading && [1,2,3].map((i) => <DistributionRowSkeleton key={i} />)}

        {!loading && error && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p style={{ ...s.errorText, marginBottom: 12 }}>⚠ {error}</p>
            <button onClick={() => load(filter)} style={s.btnGhost}>Reintentar</button>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <p style={{ color: '#475569', fontSize: 14, margin: '0 0 12px' }}>
              No hay distribuciones todavía.
            </p>
            <button onClick={() => setShowModal(true)} style={s.btn}>
              Generar la primera →
            </button>
          </div>
        )}

        {!loading && !error && total > PER_PAGE && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1e293b' }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ background: 'none', border: 'none', color: page === 1 ? '#2a3a50' : '#475569', cursor: page === 1 ? 'default' : 'pointer', fontSize: 12, padding: '2px 6px' }}
            >← Ant.</button>
            <span style={{ fontSize: 11, color: '#475569', fontFamily: 'monospace' }}>
              {page} / {Math.ceil(total / PER_PAGE)} · {total} total
            </span>
            <button
              onClick={() => setPage((p) => Math.min(Math.ceil(total / PER_PAGE), p + 1))}
              disabled={page >= Math.ceil(total / PER_PAGE)}
              style={{ background: 'none', border: 'none', color: page >= Math.ceil(total / PER_PAGE) ? '#2a3a50' : '#475569', cursor: page >= Math.ceil(total / PER_PAGE) ? 'default' : 'pointer', fontSize: 12, padding: '2px 6px' }}
            >Sig. →</button>
          </div>
        )}

        {!loading && !error && items.map((item, idx) => (
          <div key={item.id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '14px 0',
            borderBottom: idx < items.length - 1 ? '1px solid #1e293b' : 'none',
          }}>
            <div style={{ flex: 1, minWidth: 0, marginRight: 16 }}>
              {/* Título + status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <p style={{ fontSize: 14, color: '#e2e8f0', margin: 0, fontWeight: 500,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.post_title}
                </p>
                <StatusBadge status={item.status} />
              </div>

              {/* Meta */}
              <p style={{ fontSize: 11, color: '#475569', margin: 0, fontFamily: 'monospace' }}>
                LinkedIn {item.linkedin_slides_count} slides
                {' · '}Instagram {item.instagram_slides_count} slides
                {' · '}Twitter {item.twitter_tweets_count} tweets
                {' · '}{fmt(item.created_at)}
                {item.ai_metadata && (
                  <> · {item.ai_metadata.tokens_used.toLocaleString()} tokens</>
                )}
              </p>
            </div>

            {/* Acciones */}
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <Link href={`/admin/distribuciones/${item.id}`}>
                <button style={{ ...s.btnGhost, fontSize: 11 }}>
                  {item.status === 'draft' ? 'Revisar →' : 'Ver →'}
                </button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <NewDistributionModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
