'use client';

import { useEffect } from 'react';
import { ChannelTag } from '@/components/admin/ChannelTag';
import { CopyIconButton, IconButton, CrossIcon } from '@/components/admin/IconButton';
import { StatusBadge } from './StatusBadge';
import { c, itemTone, tint, CHANNEL_LABEL, dayKey } from '@/components/admin/tokens';
import type { AgendaItem } from '@/lib/agenda/types';

function missing(item: AgendaItem) {
  if (!item.has_content) return 'Falta el texto';
  if (!item.has_pdf) return 'Falta el PDF';
  return null;
}

/**
 * El día abierto: qué hay, en qué estado y qué le falta, sin salir del
 * calendario. Es la vista mínima que antes obligaba a bajar hasta el listado.
 */
export function DaySheet({ date, items, onClose, onOpenPiece, onCreate }: {
  date: Date;
  items: AgendaItem[];
  onClose: () => void;
  onOpenPiece: (id: string) => void;
  onCreate: (scheduledAt: string) => void;
}) {
  // Escape cierra: es una capa sobre el calendario, no una página.
  useEffect(() => {
    function onKey(event: KeyboardEvent) { if (event.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const key = dayKey(date);
  const isToday = key === dayKey(new Date());
  const label = date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });

  return <div role="dialog" aria-modal="true" aria-label={`Día ${label}`}
    onClick={onClose}
    style={{
      position: 'fixed', inset: 0, zIndex: 120, padding: 20,
      background: 'rgba(3,5,12,.76)', display: 'grid', placeItems: 'center',
    }}>
    <div onClick={(event) => event.stopPropagation()} style={{
      width: '100%', maxWidth: 460, maxHeight: '82vh', overflowY: 'auto',
      background: c.surface, border: `1px solid ${isToday ? c.ready : c.border}`,
      borderRadius: 14, padding: 18,
      boxShadow: '0 24px 60px rgba(0,0,0,.5)',
    }}>
      <header style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
        <div style={{ minWidth: 0 }}>
          {isToday && <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: c.ready }}>Hoy</p>}
          <h2 style={{ margin: '3px 0 0', fontSize: 17, fontWeight: 700, color: c.text, textTransform: 'capitalize', lineHeight: 1.3 }}>{label}</h2>
          <p style={{ margin: '3px 0 0', fontSize: 11, color: c.textDim }}>
            {items.length === 0 ? 'Sin piezas' : `${items.length} ${items.length === 1 ? 'pieza' : 'piezas'}`}
          </p>
        </div>
        <span style={{ marginLeft: 'auto' }}>
          <IconButton label="Cerrar" onClick={onClose}><CrossIcon /></IconButton>
        </span>
      </header>

      <div style={{ display: 'grid', gap: 9 }}>
        {items.map((item) => {
          const tone = itemTone(item);
          const gap = missing(item);
          return <div key={item.id} style={{
            padding: 12, borderRadius: 10,
            border: `1px solid ${c.borderSoft}`, borderLeft: `3px solid ${tone}`,
            background: tint(tone, '0d'),
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              <ChannelTag channel={item.channel} />
              <StatusBadge status={item.status} />
              {gap && <span style={{ fontSize: 10, fontFamily: 'monospace', color: c.incomplete }}>{gap}</span>}
            </div>
            <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: c.text, lineHeight: 1.4 }}>{item.title}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => onOpenPiece(item.id)}
                className="transition-[filter] hover:brightness-125 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
                style={{
                  height: 26, padding: '0 12px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
                  border: `1px solid ${tint(c.ready, '73')}`, background: tint(c.ready, '14'),
                  color: c.ready, fontSize: 11, fontWeight: 600,
                }}>Ver y editar el texto</button>
              <CopyIconButton text={item.title} label="Copiar el título" />
              <IconButton label="Abrir el detalle completo"
                onClick={() => { window.location.href = item.detail_path; }}>↗</IconButton>
              <span style={{ marginLeft: 'auto', fontSize: 10, fontFamily: 'monospace', color: c.textDim }}>
                {CHANNEL_LABEL[item.channel]}
              </span>
            </div>
          </div>;
        })}
      </div>

      <button type="button" onClick={() => onCreate(`${key}T10:00`)}
        className="transition-colors hover:border-[#00d4d4] hover:text-[#00d4d4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
        style={{
          width: '100%', marginTop: items.length ? 12 : 0, padding: '11px 14px',
          borderRadius: 9, border: `1px dashed ${c.border}`, background: 'transparent',
          color: c.textSoft, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
        }}>+ Nuevo post de blog este día</button>
    </div>
  </div>;
}
