'use client';

import { useEffect, useState } from 'react';
import { s } from '@/components/admin/AdminShell';
import type { AdminEngagementResponse, EngagementSummary } from '@/app/api/admin/engagement/route';

const numberFormatter = new Intl.NumberFormat('es-AR');

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ ...s.card, padding: 20 }}>
      <p style={{ ...s.label, margin: '0 0 8px' }}>{label}</p>
      <p style={{ color: '#f8fafc', fontSize: 26, fontWeight: 700, margin: 0 }}>{value}</p>
    </div>
  );
}

export default function EngagementPage() {
  const [metrics, setMetrics] = useState<AdminEngagementResponse['data'] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadMetrics() {
      try {
        const response = await fetch('/api/admin/engagement', { cache: 'no-store' });
        const payload: unknown = await response.json();
        if (!response.ok || typeof payload !== 'object' || payload === null || !('data' in payload)) {
          throw new Error('invalid response');
        }
        setMetrics((payload as AdminEngagementResponse).data);
      } catch {
        setError('No se pudieron cargar las métricas de engagement.');
      }
    }

    void loadMetrics();
  }, []);

  const summary: EngagementSummary | null = metrics?.summary ?? null;

  return (
    <div>
      <header style={{ marginBottom: 24 }}>
        <p style={s.eyebrow}>El Radar</p>
        <h1 style={{ ...s.heading, fontSize: 24, marginBottom: 6 }}>Engagement del blog</h1>
        <p style={{ ...s.hint, margin: 0 }}>
          La tasa es (reacciones + intenciones de compartir) / vistas únicas diarias.
        </p>
      </header>

      {error ? <div style={{ ...s.card, ...s.errorText }}>{error}</div> : null}
      {!error && !metrics ? <div style={s.card}>Cargando métricas...</div> : null}

      {summary ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 12,
            marginBottom: 20,
          }}
        >
          <MetricCard label="Vistas diarias únicas" value={numberFormatter.format(summary.views)} />
          <MetricCard label="Me gusta" value={numberFormatter.format(summary.likes)} />
          <MetricCard label="No me gusta" value={numberFormatter.format(summary.dislikes)} />
          <MetricCard label="Compartidos" value={numberFormatter.format(summary.shares)} />
          <MetricCard label="Tasa" value={`${summary.engagementRate.toFixed(1)}%`} />
        </div>
      ) : null}

      {metrics && metrics.posts.length === 0 ? (
        <div style={s.card}>Todavía no hay posts para mostrar.</div>
      ) : null}

      {metrics && metrics.posts.length > 0 ? (
        <div style={{ ...s.card, padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 780, borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1e293b', textAlign: 'left' }}>
                {['Post', 'Fecha', 'Me gusta', 'No me gusta', 'Vistas', 'Compartidos', 'Reacciones', 'Tasa'].map((label) => (
                  <th key={label} style={{ color: '#64748b', fontWeight: 600, padding: '13px 14px' }}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.posts.map((post) => (
                <tr key={post.slug} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ color: '#e2e8f0', padding: '14px', maxWidth: 260 }}>
                    <span style={{ color: '#00d4d4', fontFamily: 'monospace', marginRight: 8 }}>
                      Nº {String(post.issue).padStart(2, '0')}
                    </span>
                    {post.title}
                  </td>
                  <td style={{ color: '#64748b', padding: '14px', whiteSpace: 'nowrap' }}>
                    {new Date(post.date).toLocaleDateString('es-AR')}
                  </td>
                  <td style={{ color: '#94a3b8', padding: '14px' }}>{post.likes}</td>
                  <td style={{ color: '#94a3b8', padding: '14px' }}>{post.dislikes}</td>
                  <td style={{ color: '#94a3b8', padding: '14px' }}>{post.views}</td>
                  <td style={{ color: '#94a3b8', padding: '14px' }}>{post.shares}</td>
                  <td style={{ color: '#94a3b8', padding: '14px' }}>{post.reactions}</td>
                  <td style={{ color: '#e2e8f0', padding: '14px', fontWeight: 600 }}>
                    {post.engagementRate.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
