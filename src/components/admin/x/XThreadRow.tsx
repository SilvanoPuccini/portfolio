'use client';

import { useState } from 'react';
import { CopyIconButton, ConfirmIconButton, IconButton, ChevronIcon, CrossIcon } from '@/components/admin/IconButton';
import { StatusPill } from '@/components/admin/StatusPill';
import { c, tint } from '@/components/admin/tokens';
import { CREDITS_DEPLETED_MESSAGE } from '@/lib/x/client';
import { weightedLength } from '@/lib/x/validate';
import type { XThreadListItem, XThread, XThreadStatus } from '@/lib/x/types';

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
function TweetBox({ index, value, onChange, onRemove }: {
  index: number; value: string; onChange: (text: string) => void; onRemove: () => void;
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
    <span style={{ marginTop: 4, display: 'inline-flex', gap: 4 }}>
      <CopyIconButton text={value} label={`Copiar tweet ${index + 1}`} />
      <ConfirmIconButton label={`Borrar tweet ${index + 1}`} tone={c.late}
        question="Borrar este tweet del hilo?" onConfirm={onRemove}><CrossIcon /></ConfirmIconButton>
    </span>
  </div>;
}

/**
 * Una fila por turno de publicación. Igual que en la agenda: todo lo que se le
 * puede hacer al hilo se hace acá, sin ir a otra pantalla.
 */
export function XThreadRow({ item, expanded, full, warning, onToggle, onGenerate, onSave, onSaveDate, onPublish, onChangeStatus, onDelete, onMarkRemoved, busy }: {
  item: XThreadListItem;
  expanded: boolean;
  full?: XThread;
  warning?: string | null;
  onToggle: () => void;
  onGenerate: () => void | Promise<unknown>;
  onSave: (tweets: string[], reply: string) => Promise<boolean>;
  onSaveDate: (scheduledAt: string) => Promise<boolean>;
  onPublish: () => void | Promise<unknown>;
  /** Transición de estado manual: "marcar publicado" sin tocar la API de X. */
  onChangeStatus: (status: XThreadStatus) => void | Promise<unknown>;
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
  // Preaprobar/publicar a mano exige aprobación previa: la huella la deja la
  // generación o el guardado. Solo la fila ya publicada escapa (published_at
  // ya existe y siguió de marca anti-republish cuando bajó de estado).
  const cannotAdvance = !item.approved_fingerprint && !item.published_at;

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

  return <article id={`x-thread-${item.id}`} tabIndex={-1} aria-labelledby={`x-thread-title-${item.id}`}
    style={{ borderTop: `1px solid ${c.border}`, boxShadow: `inset 3px 0 0 ${tone}`, scrollMarginTop: 70 }}>
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
        <button id={`x-thread-title-${item.id}`} type="button" onClick={onToggle} aria-expanded={expanded}
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

        {item.status === 'planificado' && actionButton('Marcar preaprobado', () => onChangeStatus('preaprobado'), c.ready, {
          disabled: cannotAdvance,
          title: cannotAdvance
            ? 'Escribilo o guardalo primero: sin huella de aprobación no se preaprueba'
            : 'Pasa a preaprobado sin publicar nada',
        })}

        {/*
          Instinto: dos botones "publicar" seguidos confunden. Uno publica de
          verdad contra la API de X y guarda la URL; el otro declara que ya
          salió a mano, afuera del panel. El segundo es el que evita que el
          cron publique dos veces lo mismo.
        */}
        {item.status === 'preaprobado' && (
          <>
            {actionButton('Publicar ahora', onPublish, c.published, {
              disabled: dirty,
              title: dirty ? 'Guardá los cambios antes de publicar' : 'Publica en X con la API y guarda la URL del hilo',
            })}
            {actionButton('Marcar publicado', () => onChangeStatus('publicado'), c.published, {
              disabled: dirty,
              title: dirty
                ? 'Guardá los cambios antes de marcar'
                : 'Lo publicaste a mano, fuera del panel: marcalo sin llamar a la API de X',
            })}
            {actionButton('← Volver a planificado', () => onChangeStatus('planificado'), c.planned)}
          </>
        )}

        {item.status === 'publicado' && actionButton('← Volver a preaprobado', () => onChangeStatus('preaprobado'), c.ready, {
          title: 'Vuelve a preaprobado conservando published_at: el cron no lo vuelve a publicar',
        })}

        {item.status === 'error' && (
          <>
            {actionButton('Recuperar como preaprobado', () => onChangeStatus('preaprobado'), c.ready, {
              disabled: cannotAdvance,
              title: cannotAdvance
                ? 'No se puede recuperar: falta una huella de aprobación o una publicación anterior'
                : 'Recuperación manual con la huella aprobada que conserva el hilo',
            })}
            {actionButton('Marcar publicado', () => onChangeStatus('publicado'), c.published, {
              disabled: cannotAdvance,
              title: cannotAdvance
                ? 'No se puede marcar: falta una huella de aprobación o una publicación anterior'
                : 'Lo publicaste a mano (ej: sin crédito): marcalo para que el cron no lo repita',
            })}
          </>
        )}

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

      {item.last_error && !noCredits && <div role="alert" style={{
        margin: '0 0 12px', padding: '10px 12px', borderRadius: 8, fontSize: 11, lineHeight: 1.5,
        border: `1px solid ${c.late}`, background: tint(c.late, '0f'), color: c.late,
      }}>
        {item.status === 'error' && <p style={{ margin: '0 0 4px', fontWeight: 700 }}>
          La IA rechazo este hilo{item.generation_attempts > 0 && ` (${item.generation_attempts} ${item.generation_attempts === 1 ? 'intento' : 'intentos'})`}.
        </p>}
        <p style={{ margin: 0, opacity: 0.92 }}>
          {item.status === 'error'
            ? 'Aprieta Reescribir para que trabaje sobre esta devolucion.'
            : item.last_error}
        </p>
        {item.status === 'error' && item.last_error && <p style={{ margin: '6px 0 0', opacity: 0.75, whiteSpace: 'pre-wrap' }}>
          {item.last_error.split(' | ').map((reason) => `· ${reason}`).join('\n')}
        </p>}
      </div>}

      {!full ? <p style={{ margin: 0, fontSize: 12, color: c.textDim }}>Cargando...</p>
        : tweets.length === 0 ? <p style={{ margin: 0, fontSize: 12, color: c.textDim }}>
          Todavia no tiene texto. Toca Escribir para que Gemini lo genere y lo valide.
        </p>
        : <div style={{ display: 'grid', gap: 10 }}>
          {tweets.map((text, index) => <TweetBox key={index} index={index} value={text}
            onChange={(next) => setDraft(tweets.map((t, i) => (i === index ? next : t)))}
            onRemove={() => setDraft(tweets.filter((_, i) => i !== index))} />)}

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
              Se guarda aunque X lo rechace: el motivo queda en la fila hasta arreglarlo.
            </span>
          </div>}
        </div>}
    </div>}
  </article>;
}
