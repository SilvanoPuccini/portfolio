'use client';

import { useEffect, useState, useCallback } from 'react';
import { s } from '@/components/admin/AdminShell';

const AUTH = () => ({ Authorization: `Bearer ${process.env.NEXT_PUBLIC_NOTIFY_SECRET}` });

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

  const load = useCallback(async () => {
    const [statsRes, subsRes, msgsRes] = await Promise.all([
      fetch('/api/admin/stats', { headers: AUTH() }),
      fetch('/api/admin/subscribers', { headers: AUTH() }),
      fetch('/api/admin/messages', { headers: AUTH() }),
    ]);
    const statsData = await statsRes.json() as Stats;
    const subsData = await subsRes.json() as { subscribers: Subscriber[] };
    const msgsData = await msgsRes.json() as { messages: Message[] };
    setStats(statsData);
    setRecentSubs((subsData.subscribers ?? []).slice(0, 5));
    setRecentMsgs((msgsData.messages ?? []).slice(0, 5));
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <p style={s.eyebrow}>Panel Admin</p>
        <h1 style={{ ...s.heading, marginBottom: 0, fontSize: 24 }}>Dashboard</h1>
      </div>

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
    </div>
  );
}
