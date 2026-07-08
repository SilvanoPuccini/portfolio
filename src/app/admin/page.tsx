'use client';

import { useEffect, useState, useCallback } from 'react';
import { s } from '@/components/admin/AdminShell';
import type { CrmStats } from '@/app/api/admin/crm-stats/route';

type Stats = { subscribers: number; totalMessages: number; unreadMessages: number; totalPosts: number };
type Subscriber = { id: string; email: string; created_at: string };
type Message = { id: string; name: string; subject: string; created_at: string; read: boolean };

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentSubs, setRecentSubs] = useState<Subscriber[]>([]);
  const [recentMsgs, setRecentMsgs] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [crmStats, setCrmStats] = useState<CrmStats | null>(null);
  const [crmError, setCrmError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCrmError(null);
    try {
      const [statsRes, subsRes, msgsRes, crmRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/subscribers'),
        fetch('/api/admin/messages'),
        fetch('/api/admin/crm-stats'),
      ]);

      if (!statsRes.ok || !subsRes.ok || !msgsRes.ok) {
        const failedRes = !statsRes.ok ? statsRes : !subsRes.ok ? subsRes : msgsRes;
        const body = await failedRes.json().catch(() => ({})) as { error?: string };
        setError(body.error ?? `Error al cargar datos (${failedRes.status}).`);
        setLoading(false);
        return;
      }

      const statsData = await statsRes.json() as Stats;
      const subsData = await subsRes.json() as { subscribers: Subscriber[] };
      const msgsData = await msgsRes.json() as { messages: Message[] };
      setStats(statsData);
      setRecentSubs((subsData.subscribers ?? []).slice(0, 5));
      setRecentMsgs((msgsData.messages ?? []).slice(0, 5));

      // CRM stats — non-blocking, load independently
      if (crmRes.ok) {
        const crmData = await crmRes.json() as CrmStats;
        setCrmStats(crmData);
      } else {
        setCrmError('No se pudo cargar el pipeline.');
      }
    } catch (err) {
      setError('Error de conexión. Verificá que el servidor esté corriendo.');
      console.error('[admin/dashboard] load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={s.eyebrow}>Panel Admin</p>
          <h1 style={{ ...s.heading, marginBottom: 0, fontSize: 24 }}>Dashboard</h1>
        </div>
        <button onClick={load} style={s.btnGhost} disabled={loading}>
          {loading ? 'Cargando...' : 'Recargar'}
        </button>
      </div>

      {error && (
        <div style={{ ...s.card, marginBottom: 24, borderColor: '#f8717133' }}>
          <p style={{ ...s.errorText, margin: 0 }}>{error}</p>
        </div>
      )}

      {loading && !stats && (
        <p style={{ color: '#475569', fontSize: 13 }}>Cargando datos...</p>
      )}

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Suscriptores activos', value: stats.subscribers, accent: true },
            { label: 'Posts publicados', value: stats.totalPosts },
            { label: 'Mensajes totales', value: stats.totalMessages },
            { label: 'Sin leer', value: stats.unreadMessages, accent: stats.unreadMessages > 0 },
          ].map((stat) => (
            <div key={stat.label} style={{ ...s.card, padding: '18px 22px' }}>
              <p style={{ ...s.eyebrow, color: stat.accent ? '#00d4d4' : '#475569', marginBottom: 8 }}>{stat.label}</p>
              <p style={{ fontSize: 36, fontWeight: 700, color: '#fff', margin: 0 }}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Recent activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={s.card}>
          <p style={{ ...s.eyebrow, marginBottom: 14 }}>Últimos suscriptores</p>
          {recentSubs.length === 0
            ? <p style={{ color: '#475569', fontSize: 13 }}>Sin suscriptores aún.</p>
            : recentSubs.map((sub) => (
              <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1e293b' }}>
                <p style={{ fontSize: 13, color: '#e2e8f0', margin: 0 }}>{sub.email}</p>
                <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>{fmt(sub.created_at)}</p>
              </div>
            ))}
        </div>

        <div style={s.card}>
          <p style={{ ...s.eyebrow, marginBottom: 14 }}>Últimos mensajes</p>
          {recentMsgs.length === 0
            ? <p style={{ color: '#475569', fontSize: 13 }}>Sin mensajes aún.</p>
            : recentMsgs.map((msg) => (
              <div key={msg.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #1e293b' }}>
                <div>
                  <p style={{ fontSize: 13, color: msg.read ? '#64748b' : '#e2e8f0', margin: '0 0 2px' }}>
                    {!msg.read && <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#00d4d4', marginRight: 6, verticalAlign: 'middle' }} />}
                    {msg.name}
                  </p>
                  <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>{msg.subject}</p>
                </div>
                <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>{fmt(msg.created_at)}</p>
              </div>
            ))}
        </div>
      </div>

      {/* CRM Pipeline section — task 8.6 */}
      <div style={{ marginTop: 24 }}>
        <p style={{ ...s.eyebrow, marginBottom: 4 }}>CRM</p>
        <h2 style={{ ...s.heading, fontSize: 18, marginBottom: 16 }}>Pipeline</h2>

        {crmError && (
          <div style={{ ...s.card, borderColor: '#f8717133', marginBottom: 16 }}>
            <p style={{ ...s.errorText, margin: 0 }}>No se pudo cargar el pipeline. {crmError}</p>
          </div>
        )}

        {crmStats && (
          <>
            {/* KPI cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Total leads', value: crmStats.total_leads, accent: true },
                {
                  label: 'Valor pipeline',
                  value: `$${crmStats.pipeline_value.toLocaleString('en-US')}`,
                  accent: false,
                },
                {
                  label: 'Ticket promedio',
                  value: crmStats.avg_deal_value > 0
                    ? `$${crmStats.avg_deal_value.toLocaleString('en-US')}`
                    : '—',
                  accent: false,
                },
              ].map((kpi) => (
                <div key={kpi.label} style={{ ...s.card, padding: '18px 22px' }}>
                  <p style={{ ...s.eyebrow, color: kpi.accent ? '#00d4d4' : '#475569', marginBottom: 8 }}>
                    {kpi.label}
                  </p>
                  <p style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: 0 }}>
                    {kpi.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Conversion funnel */}
            <div style={{ ...s.card, marginBottom: 20 }}>
              <p style={{ ...s.eyebrow, marginBottom: 16 }}>Embudo de conversión</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[
                  { label: 'Leads', rate: null, color: '#475569' },
                  { label: 'Llamada', rate: crmStats.leads_to_call_rate, color: '#0ea5e9' },
                  { label: 'Propuesta', rate: crmStats.call_to_proposal_rate, color: '#f59e0b' },
                  { label: 'Cierre', rate: crmStats.proposal_to_close_rate, color: '#4ade80' },
                ].map((stage) => (
                  <div
                    key={stage.label}
                    style={{
                      textAlign: 'center' as const,
                      padding: '16px 8px',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: 8,
                      border: '1px solid #1e293b',
                    }}
                  >
                    <p style={{ fontSize: 11, color: '#475569', fontFamily: 'monospace', letterSpacing: '0.12em', textTransform: 'uppercase' as const, margin: '0 0 8px' }}>
                      {stage.label}
                    </p>
                    {stage.rate != null ? (
                      <p style={{ fontSize: 24, fontWeight: 700, color: stage.color, margin: 0 }}>
                        {stage.rate}%
                      </p>
                    ) : (
                      <p style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>
                        {crmStats.total_leads}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly trend — last 3 months */}
            {crmStats.monthly_trends.length > 0 && (
              <div style={s.card}>
                <p style={{ ...s.eyebrow, marginBottom: 14 }}>Tendencia mensual (últimos 3 meses)</p>
                {crmStats.monthly_trends.slice(-3).map((trend) => (
                  <div
                    key={trend.month}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: '1px solid #1e293b',
                    }}
                  >
                    <p style={{ fontSize: 13, color: '#e2e8f0', margin: 0, fontFamily: 'monospace' }}>
                      {trend.month}
                    </p>
                    <div style={{ display: 'flex', gap: 20 }}>
                      <div style={{ textAlign: 'right' as const }}>
                        <p style={{ fontSize: 11, color: '#475569', margin: '0 0 2px' }}>Leads</p>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>
                          {trend.lead_count}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' as const }}>
                        <p style={{ fontSize: 11, color: '#475569', margin: '0 0 2px' }}>Cerrados</p>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#4ade80', margin: 0 }}>
                          {trend.closed_count}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
