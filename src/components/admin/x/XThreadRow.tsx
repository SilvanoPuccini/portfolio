'use client';

import { useState } from 'react';
import { CopyIconButton, ConfirmIconButton, IconButton, ChevronIcon, CrossIcon } from '@/components/admin/IconButton';
import { StatusPill } from '@/components/admin/StatusPill';
import { c, tint } from '@/components/admin/tokens';
import { CREDITS_DEPLETED_MESSAGE } from '@/lib/x/client';
import { weightedLength } from '@/lib/x/validate';
import type { XThreadListItem, XThread } from '@/lib/x/types';

const TONE = {
  planificado: c.planned,
  preaprobado: c.ready,
  publicado: c.published,
  error: c.late,
} as const;

const LABEL = {
  planificado: 'Sin escribir',
  preaprobado: 'Listo para salir',
  publicado: 'Publicado',
  error: 'Con problema',
} as const;

function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'short' });
}

const isoToLocalInput = (iso: string) => {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

/** Un tweet del hilo, editable, con su contador ponderado real. */
function TweetBox({ index, value, onChange }: {
  index: number; value: string; onChange: (text: string) => void;
}) {
  const { length, valid } = weightedLength(value);
  return <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
    <span aria-hidden style={{
      flexShrink: 0, width: 22, height: 22, marginTop: 4, borderRadius: '50%',
      display: 'grid', placeItems: 'center',
      background: tint(c.ready, '1a'), color: c.ready,
      fontFamily: 'monospace', fontSize: 10, fontWeight: 700,
    }}>{index + 1}</span>
    <div style={{ flex: 1, minWidth: 0 }}>
      <textarea aria-label={`Tweet ${index + 1}`} value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{
          width: '100%', boxSizing: 'border-box', minHeight: 74,
          background: c.page, border: `1px solid ${valid ? c.border : c.late}`,
          borderRadius: 8, padding: 11, color: c.text, fontSize: 13, lineHeight: 1.6,
          fontFamily: 'inherit', resize: 'vertical', outline: 'none',
        }} />
      <div style={{ marginTop: 3, textAlign: 'right', fontFamily: 'monospace', fontSize: 10, color: valid ? c.textDim : c.late }}>
        {length} / 280
      </div>
    </div>
    <span style={{ marginTop: 4 }}><CopyIconButton text={value} label={`Copiar tweet ${index + 1}`} /></span>
  </div>;
}

/**
 * Una fila por turno de publicación. Igual que en la agenda: todo lo que se le
 * puede hacer al hilo se hace acá, sin ir a otra pantalla.
 */
export function XThreadRow({ item, expanded, full, warning, onToggle, onGenerate, onSave, onSaveDate, onPublish, onDelete, onMarkRemoved, busy }: {
  item: XThreadListItem;
  expanded: boolean;
  full?: XThread;
  warning?: string | null;
  onToggle: () => void;
  onGenerate: () => void | Promise<unknown>;
  onSave: (tweets: string[], reply: string) => Promise<boolean>;
  onSaveDate: (scheduledAt: string) => Promise<boolean>;
  onPublish: () => void | Promise<unknown>;
  onDelete: () => void | Promise<unknown>;
  onMarkRemoved: () => void | Promise<unknown>;
  busy: boolean;
}) {
  const [draft, setDraft] = useState<string[] | null>(null);
  const [reply, setReply] = useState<string | null>(null);
  const [dateDraft, setDateDraft] = useState<string | null>(null);
  const tone = TONE[item.status];

  const tweets = draft ?? (full?.tweets ?? []).map((tweet) => tweet.text);
  const replyText = reply ?? full?.reply_with_link ?? '';
  const dirty = draft !== null || reply !== null;
  const allText = [...tweets, replyText].join('\n\n');
  const noCredits = item.last_error === CREDITS_DEPLETED_MESSAGE;

  const actionButton = (label: string, onClick: () => void, tone: string, extra?: { title?: string; disabled?: boolean }) => (
    <button type="button" onClick={onClick} disabled={busy || extra?.disabled}
      title={extra?.title}
      className="transition-[filter] hover:brightness-125 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
      style={{
        height: 26, padding: '0 12px', borderRadius: 6, cursor: (busy || extra?.disabled) ? 'not-allowed' : 'pointer',
        opacity: extra?.disabled ? .45 : 1,
        border: `1px solid ${tint(tone, '73')}`, background: tint(tone, '14'),
        color: tone, fontSize: 11, fontWeight: 600, fontFamily: 'inherit',
      }}>{busy ? 'Trabajando...' : label}</button>
  );

  return <article style={{ borderTop: `1px solid ${c.border}`, boxShadow: `inset 3px 0 0 ${tone}` }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '11px 14px' }}>
      {/* X se distingue por su propia forma: ni rectángulo (blog) ni pastilla
          redonda (LinkedIn). Un rombo, para reconocerlo sin leer. */}
      <span aria-hidden style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        width: 44, height: 20, flexShrink: 0, transform: 'skewX(-12deg)',
        border: `1px solid rgba(226,232,240,.22)`, borderRadius: 2,
        fontFamily: 'monospace', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: c.textSoft,
      }}>X</span>

      <div style={{ flex: '1 1 200px', minWidth: 0 }}>
        <button type="button" onClick={onToggle} aria-expanded={expanded}
          className="transition-colors hover:text-[#00d4d4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
          style={{
            display: 'block', width: '100%', textAlign: 'left', border: 0, background: 'transparent',
            padding: 0, cursor: 'pointer', color: c.text, fontSize: 13, fontWeight: 600,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'inherit',
          }}>
          {item.preview || item.angle_summary.split('|')[0] || 'Sin escribir todavía'}
        </button>
        <div style={{ fontSize: 10, fontFamily: 'monospace', color: c.textDim, marginTop: 2 }}>
          {fmtDay(item.scheduled_at)}
          {item.tweet_count > 0 && ` · ${item.tweet_count} tweets`}
          {item.published_url && ' · en X'}
        </div>
      </div>

      <StatusPill tone={tone} label={LABEL[item.status]} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
        {(item.status === 'planificado' || item.status === 'error') &&
          actionButton(busy ? 'Trabajando...' : item.status === 'error' ? 'Reescribir' : 'Escribir', onGenerate, c.ready)}

        {item.status === 'preaprobado' && actionButton('Publicar ahora', onPublish, c.published, {
          disabled: dirty,
          title: dirty ? 'Guardá los cambios antes de publicar' : undefined,
        })}

        {item.published_url && <IconButton label="Ver el hilo en X"
          onClick={() => window.open(item.published_url!, '_blank', 'noopener,noreferrer')}>&#8599;</IconButton>}

        <CopyIconButton text={allText} label="Copiar el hilo entero" />

        {item.status === 'publicado' && <ConfirmIconButton label="Marcar que lo borré en X"
          question="Lo borraste en X?" tone={c.incomplete} onConfirm={onMarkRemoved}>
          <span style={{ fontSize: 12, lineHeight: 1 }}>&#8709;</span>
        </ConfirmIconButton>}

        <ConfirmIconButton label="Eliminar el hilo"
          question={item.published_ids.length ? 'Borrar tambien en X?' : 'Eliminar?'}
          onConfirm={onDelete}><CrossIcon /></ConfirmIconButton>

        <IconButton label={expanded ? 'Cerrar' : 'Ver el hilo'} onClick={onToggle}>
          <ChevronIcon open={expanded} />
        </IconButton>
      </div>
    </div>

    {expanded && <div style={{ padding: '0 14px 14px' }}>
      <p style={{ margin: '0 0 12px', fontSize: 11, color: c.textDim, lineHeight: 1.5 }}>
        <strong style={{ color: c.textSoft }}>Angulo:</strong> {item.angle_summary}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <label style={{ fontSize: 11, color: c.textDim }}>
          Dia hora:
          <input type="datetime-local" value={isoToLocalInput(dateDraft ?? item.scheduled_at)}
            onChange={(event) => setDateDraft(event.target.value)}
            disabled={busy}
            aria-label="Dia y hora del hilo"
            style={{
              marginLeft: 6, padding: '5px 8px', borderRadius: 6, fontSize: 12, fontFamily: 'inherit',
              background: c.page, border: `1px solid ${c.border}`, color: c.text, outline: 'none',
            }} />
        </label>
        {dateDraft !== null && <button type="button" disabled={busy}
          onClick={async () => {
            const next = new Date(dateDraft).toISOString();
            if (await onSaveDate(next)) setDateDraft(null);
          }}
          className="transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
          style={{
            height: 26, padding: '0 12px', borderRadius: 6, border: 0,
            background: c.ready, color: c.page, fontSize: 11, fontWeight: 700,
            cursor: busy ? 'wait' : 'pointer', fontFamily: 'inherit',
          }}>Guardar fecha</button>}
      </div>

      {warning && <p role="status" style={{
        margin: '0 0 12px', padding: '9px 12px', borderRadius: 8, fontSize: 11, lineHeight: 1.5,
        border: `1px solid ${c.planned}`, background: tint(c.planned, '0f'), color: c.textSoft,
      }}>{warning}</p>}

      {noCredits && <p role="alert" style={{
        margin: '0 0 12px', padding: '9px 12px', borderRadius: 8, fontSize: 11, lineHeight: 1.5,
        border: `1px solid ${c.late}`, background: tint(c.late, '0f'), color: c.late,
      }}>
        <strong>X sin saldo.</strong> El hilo queda validado y copiado para publicar a mano:
        usá el boton de copiar, pegalo en X y programa la hora desde alla.
      </p>}

      {item.last_error && !noCredits && <p role="alert" style={{
        margin: '0 0 12px', padding: '9px 12px', borderRadius: 8, fontSize: 11, lineHeight: 1.5,
        border: `1px solid ${c.late}`, background: tint(c.late, '0f'), color: c.late,
      }}>{item.last_error}</p>}

      {!full ? <p style={{ margin: 0, fontSize: 12, color: c.textDim }}>Cargando...</p>
        : tweets.length === 0 ? <p style={{ margin: 0, fontSize: 12, color: c.textDim }}>
          Todavia no tiene texto. Toca Escribir para que Gemini lo genere y lo valide.
        </p>
        : <div style={{ display: 'grid', gap: 10 }}>
          {tweets.map((text, index) => <TweetBox key={index} index={index} value={text}
            onChange={(next) => setDraft(tweets.map((t, i) => (i === index ? next : t)))} />)}

          <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: 10 }}>
            <p style={{ margin: '0 0 6px', fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: c.textDim }}>
              Respuesta con el link
            </p>
            <textarea aria-label="Respuesta con el link" value={replyText}
              onChange={(event) => setReply(event.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box', minHeight: 62,
                background: c.page, border: `1px solid ${c.border}`, borderRadius: 8,
                padding: 11, color: c.text, fontSize: 13, lineHeight: 1.6,
                fontFamily: 'inherit', resize: 'vertical', outline: 'none',
              }} />
            <p style={{ margin: '5px 0 0', fontSize: 10, color: c.textDim }}>
              Va colgada del ultimo tweet. Es el unico lugar donde puede haber links.
            </p>
          </div>

          {dirty && <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button type="button" disabled={busy}
              onClick={async () => {
                if (await onSave(tweets, replyText)) { setDraft(null); setReply(null); }
              }}
              className="transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
              style={{
                height: 30, padding: '0 15px', borderRadius: 7, border: 0,
                background: c.ready, color: c.page, fontSize: 12, fontWeight: 700,
                cursor: busy ? 'wait' : 'pointer', fontFamily: 'inherit',
              }}>Guardar cambios</button>
            <span style={{ fontSize: 11, color: c.textDim }}>
              Editar invalida la aprobacion: se revalida al guardar.
            </span>
          </div>}
        </div>}
    </div>}
  </article>;
}