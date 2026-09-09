'use client';

import { useState } from 'react';
import { ChannelTag } from './ChannelTag';
import { ContentPanel } from './ContentPanel';
import { CopyIconButton, ConfirmIconButton, IconButton, ChevronIcon, CrossIcon } from './IconButton';
import { StatusBadge, STATUS_LABELS } from './agenda/StatusBadge';
import { c, itemTone, tint } from './tokens';
import type { AgendaChannel } from '@/lib/agenda/types';
import type { PostPublicationStatus } from '@/lib/post-publications/types';

/** Lo que una fila necesita saber, venga de la agenda o de la biblioteca. */
export interface Piece {
  id: string;
  channel: AgendaChannel;
  sourceId: string;
  title: string;
  scheduledAt: string;
  status: PostPublicationStatus;
  hasContent: boolean;
  contentChars: number;
  /** Solo LinkedIn necesita PDF; en el blog llega siempre en true. */
  hasPdf: boolean;
  isReady: boolean;
  detailPath: string;
}

const NEXT: Record<PostPublicationStatus, PostPublicationStatus | null> = {
  planificado: 'preaprobado',
  preaprobado: 'publicado',
  publicado: null,
};
const BACK: Record<PostPublicationStatus, PostPublicationStatus | null> = {
  planificado: null,
  preaprobado: 'planificado',
  publicado: 'preaprobado',
};

function blockReason(piece: Piece): string | null {
  if (!piece.hasContent) return 'Falta el texto';
  if (!piece.hasPdf) return 'Falta el PDF';
  return null;
}

function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: 'short' });
}

const stateChip = (tone: string, enabled: boolean): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', height: 26, padding: '0 11px',
  borderRadius: 6, border: `1px solid ${enabled ? tint(tone, '73') : c.border}`,
  background: enabled ? tint(tone, '14') : 'transparent',
  color: enabled ? tone : c.border,
  fontSize: 11, fontWeight: 600, fontFamily: 'inherit', whiteSpace: 'nowrap',
  cursor: enabled ? 'pointer' : 'not-allowed',
});

/**
 * Una fila hace todo lo que se le puede hacer a la pieza, en el lugar: cambiar
 * de estado, copiar, abrir y ver o cargar el texto sin salir del listado.
 *
 * Antes esto era un botón "Ver" que solo seleccionaba, y el detalle vivía en un
 * panel arriba de la página: para tocar una fila había que mirar a otra parte.
 */
export function PieceRow({ piece, text, expanded, onToggle, onChangeStatus, onSaveText, onAttachMarkdown, onDelete, extra }: {
  piece: Piece;
  /** Texto completo, si ya se cargó. undefined mientras se está trayendo. */
  text?: string;
  expanded: boolean;
  onToggle: () => void;
  onChangeStatus: (status: PostPublicationStatus) => void | Promise<void>;
  onSaveText: (text: string) => Promise<boolean>;
  onAttachMarkdown: (markdown: string, filename: string) => Promise<boolean>;
  onDelete?: () => void | Promise<void>;
  /** Bloque propio del canal, como el PDF de LinkedIn. */
  extra?: React.ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const tone = itemTone({ status: piece.status, is_ready: piece.isReady, scheduled_at: piece.scheduledAt });
  const next = NEXT[piece.status];
  const back = BACK[piece.status];
  const blocked = blockReason(piece);
  // Avanzar desde planificado necesita el material; retroceder nunca.
  const canAdvance = Boolean(next) && (piece.status !== 'planificado' || !blocked);

  async function change(status: PostPublicationStatus) {
    setBusy(true);
    await onChangeStatus(status);
    setBusy(false);
  }

  return <article style={{ borderTop: `1px solid ${c.border}`, boxShadow: `inset 3px 0 0 ${tone}` }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '11px 14px' }}>
      <ChannelTag channel={piece.channel} />

      <div style={{ flex: '1 1 200px', minWidth: 0 }}>
        <button type="button" onClick={onToggle}
          className="transition-colors hover:text-[#00d4d4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
          style={{
            display: 'block', width: '100%', textAlign: 'left', border: 0, background: 'transparent',
            padding: 0, cursor: 'pointer', color: c.text, fontSize: 13, fontWeight: 600,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'inherit',
          }}
          title={piece.title}
          aria-expanded={expanded}
        >{piece.title}</button>
        <div style={{ fontSize: 10, fontFamily: 'monospace', color: c.textDim, marginTop: 2 }}>
          {fmtDay(piece.scheduledAt)}
          {piece.hasContent && ` · ${piece.contentChars.toLocaleString('es-AR')} car.`}
          {piece.channel === 'linkedin' && ` · ${piece.hasPdf ? 'con PDF' : 'sin PDF'}`}
        </div>
      </div>

      <StatusBadge status={piece.status} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
        {next && <button type="button" disabled={busy || !canAdvance}
          title={canAdvance ? `Marcar ${STATUS_LABELS[next].toLowerCase()}` : blocked ?? undefined}
          onClick={() => change(next)}
          className={canAdvance ? 'transition-[filter] hover:brightness-125 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]' : ''}
          style={stateChip(next === 'publicado' ? c.published : c.ready, canAdvance && !busy)}
        >{next === 'publicado' ? 'Publicar' : 'Preaprobar'} →</button>}

        {!canAdvance && blocked && <span style={{ fontSize: 10, color: c.incomplete, whiteSpace: 'nowrap' }}>{blocked}</span>}

        {back && <IconButton label={`Volver a ${STATUS_LABELS[back].toLowerCase()}`} disabled={busy}
          onClick={() => change(back)}>←</IconButton>}

        <CopyIconButton text={text ?? piece.title} label={text === undefined ? 'Copiar título' : 'Copiar texto'} />

        <IconButton label="Abrir el detalle completo" onClick={() => { window.location.href = piece.detailPath; }}>↗</IconButton>

        {onDelete && <ConfirmIconButton label="Eliminar la pieza" question="¿Eliminar?"
          onConfirm={onDelete}><CrossIcon /></ConfirmIconButton>}

        <IconButton label={expanded ? 'Cerrar el texto' : 'Ver y editar el texto'} onClick={onToggle}>
          <ChevronIcon open={expanded} />
        </IconButton>
      </div>
    </div>

    {expanded && <div style={{ padding: '0 14px 14px', display: 'grid', gap: 12 }}>
      {text === undefined
        ? <p style={{ margin: 0, fontSize: 12, color: c.textDim }}>Cargando el texto…</p>
        : <ContentPanel title="Texto" value={text} onSave={onSaveText} onAttachMarkdown={onAttachMarkdown} />}
      {extra}
    </div>}
  </article>;
}
