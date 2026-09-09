import { s } from '@/components/admin/AdminShell';
import { StatusBadge } from './StatusBadge';
import { fmt } from './format';
import type { AgendaItem } from '@/lib/agenda/types';

export function AgendaDetailPanel({ items, selectedId }: { items: AgendaItem[]; selectedId: string | null }) {
  const selected = items.find((item) => item.id === selectedId) ?? null;
  const next = items.find((item) => item.status !== 'publicado' && new Date(item.scheduled_at).getTime() >= Date.now()) ?? null;
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <div style={s.card}><p style={s.eyebrow}>Próximo</p><p style={{ margin: 0, fontSize: 13 }}>{next?.title ?? 'No hay contenido futuro'}</p></div>
    <div style={s.card}>
      <p style={s.eyebrow}>Detalle</p>
      {!selected ? <p style={s.hint}>Elegí una pieza del calendario.</p> : <div style={{ display: 'grid', gap: 10 }}>
        <strong>{selected.title}</strong>
        <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#64748b' }}>{selected.channel === 'blog' ? 'Blog' : 'LinkedIn'} · {fmt(selected.scheduled_at)}</span>
        <StatusBadge status={selected.status} />
        <a href={selected.detail_path} style={{ ...s.btn, textAlign: 'center', textDecoration: 'none' }}>Ver contenido →</a>
      </div>}
    </div>
  </div>;
}
