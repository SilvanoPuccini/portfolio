'use client';

import { useState, useEffect, useCallback } from 'react';
import { s } from '@/components/admin/AdminShell';

type Subscriber = { id: string; email: string; name: string | null; status: string; created_at: string };
type Filter = 'all' | 'active' | 'unsubscribed';

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const PER_PAGE = 10;

export default function SubscribersPage() {
  const [all, setAll] = useState<Subscriber[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/subscribers');
      if (!res.ok) { setError('Error al cargar datos (' + res.status + '). Intentá recargar o volvé a iniciar sesión.'); return; }
      const data = await res.json() as { subscribers: Subscriber[] };
      setAll(data.subscribers ?? []);
    } catch (err) {
      console.error('subscribers load:', err);
      setError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleStatus(sub: Subscriber) {
    const next = sub.status === 'active' ? 'unsubscribed' : 'active';
    try {
      const res = await fetch('/api/admin/subscribers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sub.id, status: next }),
      });
      if (!res.ok) { setError('Error al actualizar (' + res.status + ').'); return; }
      setAll((prev) => prev.map((s) => s.id === sub.id ? { ...s, status: next } : s));
    } catch (err) {
      console.error('subscribers toggle:', err);
      setError('Error de conexión.');
    }
  }

  const filtered = filter === 'all' ? all : all.filter((s) => s.status === filter);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const activeCount = all.filter((s) => s.status === 'active').length;
  const unsubCount = all.filter((s) => s.status === 'unsubscribed').length;

  function exportCSV() {
    const rows = [['email', 'status', 'fecha'].join(','), ...filtered.map((s) => [s.email, s.status, fmt(s.created_at)].join(','))];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'suscriptores.csv'; a.click();
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <p style={s.eyebrow}>El Radar</p>
          <h1 style={{ ...s.heading, marginBottom: 0, fontSize: 24 }}>Suscriptores</h1>
        </div>
        <button onClick={exportCSV} style={s.btnGhost}>Exportar CSV →</button>
      </div>

      {error && <p style={{ ...s.errorText, margin: '0 0 16px' }}>{error}</p>}

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total', value: all.length },
          { label: 'Activos', value: activeCount, accent: true },
          { label: 'Desuscriptos', value: unsubCount },
        ].map((stat) => (
          <div key={stat.label} style={{ ...s.card, padding: '16px 20px' }}>
            <p style={{ ...s.eyebrow, color: stat.accent ? '#00d4d4' : '#475569', marginBottom: 6 }}>{stat.label}</p>
            <p style={{ fontSize: 30, fontWeight: 700, color: '#fff', margin: 0 }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['all', 'active', 'unsubscribed'] as Filter[]).map((f) => (
          <button key={f} onClick={() => { setFilter(f); setPage(1); }}
            style={{ ...s.btnGhost, color: filter === f ? '#00d4d4' : '#475569', borderColor: filter === f ? '#00d4d4' : '#1e293b' }}>
            {f === 'all' ? 'Todos' : f === 'active' ? 'Activos' : 'Desuscriptos'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={s.card}>
        {loading && <p style={{ color: '#475569', fontSize: 13 }}>Cargando...</p>}
        {!loading && filtered.length === 0 && <p style={{ color: '#475569', fontSize: 13 }}>Sin resultados.</p>}
        {!loading && totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1e293b' }}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              style={{ background: 'none', border: 'none', color: page === 1 ? '#2a3a50' : '#475569', cursor: page === 1 ? 'default' : 'pointer', fontSize: 12, padding: '2px 6px' }}>← Ant.</button>
            <span style={{ fontSize: 11, color: '#475569', fontFamily: 'monospace' }}>{page} / {totalPages} · {filtered.length} total</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ background: 'none', border: 'none', color: page === totalPages ? '#2a3a50' : '#475569', cursor: page === totalPages ? 'default' : 'pointer', fontSize: 12, padding: '2px 6px' }}>Sig. →</button>
          </div>
        )}
        {!loading && paginated.map((sub) => (
          <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1e293b' }}>
            <div>
              <p style={{ fontSize: 13, color: '#e2e8f0', margin: '0 0 2px' }}>{sub.email}</p>
              <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>{fmt(sub.created_at)}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                fontSize: 11, padding: '3px 10px', borderRadius: 20, fontFamily: 'monospace',
                background: sub.status === 'active' ? 'rgba(0,212,212,0.1)' : 'rgba(100,116,139,0.12)',
                color: sub.status === 'active' ? '#00d4d4' : '#64748b',
              }}>
                {sub.status === 'active' ? 'activo' : 'desuscripto'}
              </span>
              <button onClick={() => toggleStatus(sub)}
                style={{ ...s.btnGhost, padding: '4px 10px', fontSize: 11 }}>
                {sub.status === 'active' ? 'Desuscribir' : 'Reactivar'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
