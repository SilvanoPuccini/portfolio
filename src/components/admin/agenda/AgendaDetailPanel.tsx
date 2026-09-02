import { s } from '@/components/admin/AdminShell';
import { StatusBadge } from './StatusBadge';
import { StatusActions } from './StatusActions';
import { fmt } from './format';
import type { PostPublication, PostPublicationStatus } from '@/lib/post-publications/types';

const TODAY_LABEL = new Date().toLocaleDateString('es-AR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

function findNext(items: PostPublication[]): PostPublication | null {
  const now = Date.now();
  const upcoming = items
    .filter((item) => item.status !== 'publicado' && new Date(item.scheduled_at).getTime() >= now)
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  return upcoming[0] ?? null;
}

function NextUpBlock({ item }: { item: PostPublication | null }) {
  if (!item) {
    return <p style={s.hint}>No hay ningún post con fecha futura en la agenda.</p>;
  }

  const daysLeft = Math.ceil((new Date(item.scheduled_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const atRisk = item.status === 'planificado' && daysLeft <= 3;

  return (
    <div
      style={{
        padding: 12,
        borderRadius: 8,
        border: atRisk ? '1px solid #f87171' : '1px solid rgba(255,255,255,0.08)',
        background: atRisk ? 'rgba(248,113,113,0.06)' : 'transparent',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{item.raw_title}</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: atRisk ? 8 : 0 }}>
        <StatusBadge status={item.status} />
        <span style={{ fontSize: 12, opacity: 0.6 }}>
          {daysLeft <= 0 ? 'hoy' : `en ${daysLeft} día${daysLeft === 1 ? '' : 's'}`}
        </span>
      </div>
      {atRisk && (
        <p style={{ fontSize: 12, color: '#f87171', margin: 0 }}>
          Faltan {daysLeft} día{daysLeft === 1 ? '' : 's'} y sigue en planificado — no va a llegar
          a tiempo si no se avanza.
        </p>
      )}
    </div>
  );
}

export function AgendaDetailPanel({
  items,
  selectedSlug,
  onChangeStatus,
}: {
  items: PostPublication[];
  selectedSlug: string | null;
  onChangeStatus: (slug: string, status: PostPublicationStatus) => void;
}) {
  const selected = items.find((item) => item.post_slug === selectedSlug) ?? null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={s.card}>
        <p style={s.eyebrow}>Hoy</p>
        <p style={{ margin: 0, fontSize: 15, textTransform: 'capitalize' }}>{TODAY_LABEL}</p>
      </div>

      <div style={s.card}>
        <p style={s.eyebrow}>Próximo en la agenda</p>
        <NextUpBlock item={findNext(items)} />
      </div>

      <div style={s.card}>
        <p style={s.eyebrow}>Detalle</p>
        {!selected ? (
          <div style={{ padding: '18px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 24, opacity: 0.25, marginBottom: 8 }}>◇</div>
            <p style={{ ...s.hint, marginTop: 0 }}>
              Elegí un día con post en el calendario para ver el detalle acá.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontWeight: 600 }}>{selected.raw_title}</div>
            <div style={{ fontSize: 12, fontFamily: 'monospace', opacity: 0.5 }}>{selected.post_slug}</div>
            <StatusBadge status={selected.status} />
            <div style={{ fontSize: 12, opacity: 0.65, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span>Programado: {fmt(selected.scheduled_at)}</span>
              {selected.pre_approved_at && <span>Preaprobado: {fmt(selected.pre_approved_at)}</span>}
              {selected.published_at && <span>Publicado: {fmt(selected.published_at)}</span>}
            </div>
            <a
              href={`/admin/agenda/${selected.post_slug}`}
              className="transition-colors hover:border-[#00d4d4] hover:text-[#00d4d4]"
              style={{ ...s.btnGhost, textAlign: 'center' }}
            >
              Ver post completo →
            </a>
            <StatusActions item={selected} onChange={onChangeStatus} />
          </div>
        )}
      </div>
    </div>
  );
}
