'use client';

import { StatusBadge } from './StatusBadge';
import { StatusActions } from './StatusActions';
import { DeleteAgendaItemButton } from './DeleteAgendaItemButton';
import { fmt } from './format';
import { c, itemTone, tint, CHANNEL_LABEL } from '@/components/admin/tokens';
import type { AgendaItem } from '@/lib/agenda/types';
import type { PostPublicationStatus } from '@/lib/post-publications/types';

const card: React.CSSProperties = {
  background: c.surface, border: `1px solid ${c.border}`, borderRadius: 12, padding: 16,
};
const eyebrow: React.CSSProperties = {
  margin: '0 0 10px', fontFamily: 'monospace', fontSize: 10,
  letterSpacing: '0.18em', textTransform: 'uppercase', color: c.textDim,
};

/** Qué le falta a la pieza para poder preaprobarse, en el idioma del servidor. */
function blockReason(item: AgendaItem): string | null {
  if (!item.has_content) return 'Falta cargar el texto';
  if (!item.has_pdf) return 'Falta subir el PDF';
  return null;
}

function findNext(items: AgendaItem[]): AgendaItem | null {
  const now = Date.now();
  return items
    .filter((item) => item.status !== 'publicado' && new Date(item.scheduled_at).getTime() >= now)
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))[0] ?? null;
}

function NextUp({ item }: { item: AgendaItem | null }) {
  if (!item) return <p style={{ margin: 0, fontSize: 12, color: c.textDim }}>No hay ninguna pieza con fecha futura.</p>;

  const daysLeft = Math.ceil((new Date(item.scheduled_at).getTime() - Date.now()) / 86_400_000);
  const tone = itemTone(item);
  // Sin material y a tres días o menos: eso ya no llega si no se mueve hoy.
  const atRisk = !item.is_ready && daysLeft <= 3;

  return <div style={{
    padding: 11, borderRadius: 8,
    border: `1px solid ${atRisk ? c.late : c.borderSoft}`,
    background: atRisk ? tint(c.late, '0f') : 'transparent',
  }}>
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 7 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: c.text, lineHeight: 1.35 }}>{item.title}</span>
      <span style={{ flexShrink: 0, fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: tone }}>
        {daysLeft <= 0 ? 'HOY' : `${daysLeft}d`}
      </span>
    </div>
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
      <StatusBadge status={item.status} />
      <span style={{ fontSize: 11, color: c.textSoft }}>{CHANNEL_LABEL[item.channel]}</span>
    </div>
    {atRisk && <p style={{ margin: '8px 0 0', fontSize: 11, color: c.late, lineHeight: 1.5 }}>
      {blockReason(item)} y la fecha es en {daysLeft <= 0 ? 'el día' : `${daysLeft} día${daysLeft === 1 ? '' : 's'}`}.
    </p>}
  </div>;
}

/** Los dos requisitos, cada uno con su propio tilde: se cargan por separado. */
function Requirements({ item }: { item: AgendaItem }) {
  const rows = [
    { label: 'Texto', done: item.has_content, detail: item.has_content ? `${item.content_chars.toLocaleString('es-AR')} car.` : 'sin cargar' },
    ...(item.channel === 'linkedin'
      ? [{ label: 'PDF', done: item.has_pdf, detail: item.has_pdf ? 'guardado' : 'sin subir' }]
      : []),
  ];
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
    {rows.map((row) => <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11 }}>
      <span aria-hidden style={{
        width: 14, height: 14, flexShrink: 0, borderRadius: 3, display: 'grid', placeItems: 'center',
        fontSize: 9, fontWeight: 700,
        background: row.done ? tint(c.published, '26') : tint(c.incomplete, '26'),
        color: row.done ? c.published : c.incomplete,
      }}>{row.done ? '✓' : '!'}</span>
      <span style={{ color: c.text, fontWeight: 600 }}>{row.label}</span>
      <span style={{ color: row.done ? c.textDim : c.incomplete }}>{row.detail}</span>
    </div>)}
  </div>;
}

export function AgendaDetailPanel({ items, selectedId, onChangeStatus, onDeleted }: {
  items: AgendaItem[];
  selectedId: string | null;
  onChangeStatus: (item: AgendaItem, status: PostPublicationStatus) => void;
  onDeleted: () => void | Promise<void>;
}) {
  const selected = items.find((item) => item.id === selectedId) ?? null;

  return <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    <div style={card}>
      <p style={eyebrow}>Próximo en la agenda</p>
      <NextUp item={findNext(items)} />
    </div>

    <div style={card}>
      <p style={eyebrow}>Detalle</p>
      {!selected ? <div style={{ padding: '16px 0', textAlign: 'center' }}>
        <div aria-hidden style={{ fontSize: 20, color: c.border, marginBottom: 8 }}>◇</div>
        <p style={{ margin: 0, fontSize: 12, color: c.textDim, lineHeight: 1.5 }}>
          Elegí una pieza del calendario o de la semana para verla acá.
        </p>
      </div> : <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: c.text, lineHeight: 1.35 }}>{selected.title}</div>
          <div style={{ marginTop: 4, fontFamily: 'monospace', fontSize: 10, color: c.textDim, overflowWrap: 'anywhere' }}>
            {CHANNEL_LABEL[selected.channel]} · {selected.source_id}
          </div>
        </div>

        <StatusBadge status={selected.status} />
        <Requirements item={selected} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11, color: c.textSoft, borderTop: `1px solid ${c.border}`, paddingTop: 10 }}>
          <span>Programado: {fmt(selected.scheduled_at)}</span>
          {selected.pre_approved_at && <span>Preaprobado: {fmt(selected.pre_approved_at)}</span>}
          {selected.published_at && <span>Publicado: {fmt(selected.published_at)}</span>}
        </div>

        <a href={selected.detail_path}
          className="transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
          style={{
            display: 'block', textAlign: 'center', textDecoration: 'none',
            background: tint(c.ready, '1f'), color: c.ready,
            border: `1px solid ${tint(c.ready, '73')}`, borderRadius: 8,
            padding: '10px 16px', fontWeight: 600, fontSize: 13,
          }}>Ver contenido →</a>

        <StatusActions
          item={{
            title: selected.title,
            status: selected.status,
            has_content: selected.has_content,
            blockedReason: blockReason(selected),
          }}
          onChange={(status) => onChangeStatus(selected, status)}
        />

        {/* Solo el blog tiene endpoint de borrado; una pieza de LinkedIn se
            archiva desde su propio detalle. */}
        {selected.channel === 'blog' && <DeleteAgendaItemButton
          slug={selected.source_id} title={selected.title} onDeleted={onDeleted} />}
      </div>}
    </div>
  </div>;
}
