'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { s } from '@/components/admin/AdminShell';
import { AgendaCalendar } from '@/components/admin/agenda/AgendaCalendar';
import { AgendaDetailPanel } from '@/components/admin/agenda/AgendaDetailPanel';
import { AgendaItemModal } from '@/components/admin/agenda/AgendaItemModal';
import { StatusBadge, STATUS_LABELS } from '@/components/admin/agenda/StatusBadge';
import { fmt } from '@/components/admin/agenda/format';
import type { AgendaItem, AgendaChannel } from '@/lib/agenda/types';
import type { PostPublicationStatus } from '@/lib/post-publications/types';

type Filter<T extends string> = 'all' | T;

export default function AgendaPage() {
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<Filter<PostPublicationStatus>>('all');
  const [channel, setChannel] = useState<Filter<AgendaChannel>>('all');
  const [newScheduledAt, setNewScheduledAt] = useState<string | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    const response = await fetch('/api/admin/agenda');
    const json = await response.json().catch(() => ({}));
    if (!response.ok) return setError(json.error ?? 'No se pudo cargar la agenda');
    setItems(json.items ?? []);
    setError('');
  }, []);
  useEffect(() => { load(); }, [load]);
  const filtered = useMemo(() => items.filter((item) =>
    (status === 'all' || item.status === status) && (channel === 'all' || item.channel === channel),
  ), [items, status, channel]);

  return <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
      <div><div style={s.eyebrow}>El Radar</div><h1 style={s.heading}>Agenda editorial</h1></div>
      <button style={s.btn} onClick={() => setNewScheduledAt('')}>+ Nuevo post de blog</button>
    </div>
    {error && <div role="alert" style={s.errorText}>{error}</div>}
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_280px]" style={{ alignItems: 'start', marginBottom: 32 }}>
      <AgendaCalendar items={items} selectedId={selectedId} onSelect={setSelectedId} onCreate={setNewScheduledAt} />
      <AgendaDetailPanel items={items} selectedId={selectedId} />
    </div>
    <h2 style={s.sectionTitle}>Todas las piezas</h2>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
      {(['all', 'blog', 'linkedin'] as const).map((value) => <button key={value} style={s.btnGhost} onClick={() => setChannel(value)}>{value === 'all' ? 'Todos los canales' : value === 'blog' ? 'Blog' : 'LinkedIn'}</button>)}
      {(['all', 'planificado', 'preaprobado', 'publicado'] as const).map((value) => <button key={value} style={s.btnGhost} onClick={() => setStatus(value)}>{value === 'all' ? 'Todos los estados' : STATUS_LABELS[value]}</button>)}
    </div>
    <div style={{ ...s.card, overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
      <thead><tr style={{ textAlign: 'left', color: '#64748b', fontSize: 11 }}><th>Título</th><th>Fecha</th><th>Canal</th><th>Estado</th><th /></tr></thead>
      <tbody>{filtered.map((item) => <tr key={item.id} style={{ borderTop: '1px solid #1e293b' }}>
        <td style={{ padding: '13px 0', fontWeight: 600 }}>{item.title}</td><td>{fmt(item.scheduled_at)}</td><td>{item.channel === 'blog' ? 'Blog' : 'LinkedIn'}</td><td><StatusBadge status={item.status} /></td>
        <td><a href={item.detail_path} style={{ color: '#00d4d4' }}>Ver →</a></td>
      </tr>)}</tbody>
    </table></div>
    {newScheduledAt !== null && <AgendaItemModal initialScheduledAt={newScheduledAt} onClose={() => setNewScheduledAt(null)} onCreated={load} />}
  </div>;
}
