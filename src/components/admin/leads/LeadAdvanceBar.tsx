'use client';

import { useState } from 'react';
import { c, tint } from '@/components/admin/tokens';
import { labelForState, NEXT_ACTION, phaseIndex, PIPELINE } from '@/lib/leads/pipeline';
import { suggestDeposit, depositAt } from '@/lib/leads/deposit';
import { PROPOSAL_SILENCE_DAYS } from '@/lib/admin/alerts';

/**
 * El paso siguiente de una venta, y solo ese.
 *
 * La ficha del lead muestra todo a la vez y por eso no dice qué hacer ahora.
 * Acá el botón cambia según la fase: firmar, cobrar, facturar, entregar. Lo
 * que ya pasó no se ofrece de nuevo, y lo que todavía no corresponde tampoco.
 *
 * Mandar la propuesta y el contrato NO están: los dispara el correo real, no
 * un botón. Marcarlos a mano volvería a separar lo que pasó de lo que el panel
 * cree que pasó.
 */

interface Props {
  estado: string;
  /** El total presupuestado, para sugerir la seña. */
  monto: number | null;
  /**
   * Cuándo salió la propuesta. Decide si ofrecer el seguimiento: escribirlo al
   * día siguiente es apurar, y el botón no tiene por qué invitar a eso.
   */
  proposalSentAt?: string | null;
  /** Documenso lo dio por vencido: hay que reenviarlo, no esperar más. */
  contratoVencido?: boolean;
  /** Hay un PDF firmado guardado en Storage. */
  contratoArchivado?: boolean;
  /**
   * El cliente rechazó el contrato en Documenso. Vale null si no dejó motivo,
   * y undefined si no hubo rechazo.
   */
  rechazoMotivo?: string | null;
  onAdvanced: () => void;
  leadId: string;
}

export function LeadAdvanceBar({
  estado, monto, proposalSentAt, contratoVencido, contratoArchivado, rechazoMotivo, onAdvanced, leadId,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [asking, setAsking] = useState<'cobro' | 'factura' | 'perdido' | null>(null);
  const [factura, setFactura] = useState('');
  const [motivo, setMotivo] = useState('');

  const suggestion = suggestDeposit(monto);
  const [pct, setPct] = useState<number>(suggestion.pct);
  const [unico, setUnico] = useState(false);

  const next = NEXT_ACTION[estado];
  const done = phaseIndex(estado) >= phaseIndex('entregado');
  const lost = estado === 'descartado';

  const coldProposal = proposalSentAt
    ? (Date.now() - new Date(proposalSentAt).getTime()) / 86400000 >= PROPOSAL_SILENCE_DAYS
    : false;

  const [draft, setDraft] = useState<{ subject: string; body: string; provider?: string } | null>(null);

  /** Pide el borrador. La IA escribe acá; el envío es otro botón, a propósito. */
  async function loadDraft() {
    setBusy(true);
    setError('');
    const response = await fetch(`/api/admin/leads/${leadId}/followup`);
    const json = await response.json().catch(() => ({})) as typeof draft & { error?: string };
    setBusy(false);
    if (!response.ok) return setError(json?.error ?? 'No se pudo escribir el borrador');
    setDraft(json);
  }

  async function sendDraft() {
    if (!draft) return;
    setBusy(true);
    setError('');
    const response = await fetch(`/api/admin/leads/${leadId}/followup`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: draft.subject, body: draft.body }),
    });
    const json = await response.json().catch(() => ({})) as { error?: string };
    setBusy(false);
    if (!response.ok) return setError(json.error ?? 'No se pudo enviar');
    setDraft(null);
    onAdvanced();
  }

  async function rebook() {
    setBusy(true);
    setError('');
    const response = await fetch(`/api/admin/leads/${leadId}/rebook`, { method: 'POST' });
    const json = await response.json().catch(() => ({})) as { error?: string };
    setBusy(false);
    if (!response.ok) return setError(json.error ?? 'No se pudo enviar el link');
    setError('');
    onAdvanced();
  }

  async function send(body: Record<string, unknown>) {
    setBusy(true);
    setError('');
    const response = await fetch(`/api/admin/leads/${leadId}/advance`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await response.json().catch(() => ({})) as { error?: string };
    setBusy(false);
    if (!response.ok) return setError(json.error ?? 'No se pudo registrar');
    setAsking(null);
    onAdvanced();
  }

  const button = (label: string, onClick: () => void, tone: string = c.ready) => (
    <button type="button" onClick={onClick} disabled={busy}
      className="transition-[filter] hover:brightness-125 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
      style={{
        height: 28, padding: '0 14px', borderRadius: 7,
        border: `1px solid ${tint(tone, '73')}`, background: tint(tone, '14'),
        color: tone, fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
        cursor: busy ? 'wait' : 'pointer',
      }}>{busy ? 'Guardando...' : label}</button>
  );

  const field: React.CSSProperties = {
    background: c.field, border: `1px solid ${c.border}`, borderRadius: 7,
    padding: '6px 10px', color: c.text, fontSize: 12, fontFamily: 'inherit', outline: 'none',
  };

  return (
    <section aria-label="Paso siguiente de la venta" style={{
      background: c.surface, border: `1px solid ${c.border}`,
      borderLeft: `3px solid ${lost ? c.late : done ? c.published : c.ready}`,
      borderRadius: 10, padding: '14px 16px', marginBottom: 18,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{
          fontFamily: 'monospace', fontSize: 9.5, letterSpacing: '0.16em',
          textTransform: 'uppercase', color: c.textDim,
        }}>Ahora</span>
        <span style={{ fontSize: 13, color: c.text, fontWeight: 600 }}>{labelForState(estado)}</span>

        {/* La barra de fases: dónde está sin leer una palabra. */}
        <span aria-hidden style={{ display: 'flex', gap: 2 }}>
          {PIPELINE.map((phase) => (
            <i key={phase} style={{
              width: 14, height: 5, borderRadius: 1, display: 'block',
              background: phaseIndex(estado) >= phaseIndex(phase) ? c.published : c.border,
            }} />
          ))}
        </span>

        <span style={{ marginLeft: 'auto', display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {/* Un no-show no es un callejón: es plata parada esperando un link. */}
          {estado === 'no_show' && button('Mandar link para reagendar', () => void rebook())}

          {/* El seguimiento aparece solo cuando la propuesta ya se enfrió. */}
          {estado === 'presupuestado' && coldProposal &&
            button('Escribir seguimiento', () => void loadDraft(), c.incomplete)}

          {!lost && !done && next && button(next.label, () => {
            if (next.event === 'pago_recibido') return setAsking('cobro');
            if (next.event === 'facturado') return setAsking('factura');
            void send({ event: next.event });
          })}
          {!lost && !done && button('Se perdió', () => setAsking('perdido'), c.late)}
        </span>
      </div>

      {/* Un rechazo no se marca como venta perdida: suele ser una negociación.
          Lo que hace falta es el motivo a la vista antes de llamar. */}
      {estado === 'contrato_enviado' && rechazoMotivo !== undefined && (
        <p role="status" style={{ margin: '9px 0 0', fontSize: 12, color: c.late, lineHeight: 1.5 }}>
          Rechazó el contrato{rechazoMotivo ? <>: <q>{rechazoMotivo}</q></> : ' sin dejar motivo'}.
          {' '}Llamalo para negociar; si ajustás el contrato y lo reenviás, vuelve a contar desde cero.
        </p>
      )}

      {estado === 'contrato_enviado' && contratoVencido && (
        <p role="status" style={{ margin: '9px 0 0', fontSize: 12, color: c.late }}>
          El contrato venció sin firmar. Reenvialo desde Documenso: al salir, la venta vuelve a contar desde cero.
        </p>
      )}

      {contratoArchivado && (
        <p style={{ margin: '9px 0 0', fontSize: 12 }}>
          <a href={`/api/admin/leads/${leadId}/contract-pdf`} target="_blank" rel="noopener noreferrer"
            style={{ color: c.ready, textDecoration: 'none' }}>
            Ver contrato firmado ↗
          </a>
          <span style={{ color: c.textDim }}> · con su registro de auditoría guardado aparte</span>
        </p>
      )}

      {done && <p style={{ margin: '9px 0 0', fontSize: 12, color: c.textDim }}>
        Entregado. El recorrido terminó.
      </p>}
      {lost && <p style={{ margin: '9px 0 0', fontSize: 12, color: c.textDim }}>
        Venta perdida. Para reabrirla, cambiá el estado a mano.
      </p>}

      {asking === 'cobro' && (
        <div style={{ marginTop: 12, display: 'grid', gap: 9 }}>
          <p style={{ margin: 0, fontSize: 12, color: c.textDim }}>
            {monto
              ? <>Sobre ${monto.toLocaleString('es-AR')}. La sugerencia es {suggestion.pct}&nbsp;%
                {suggestion.fallbackPcts.length > 0 && <>, y hay margen para bajar a {suggestion.fallbackPcts.join(' % o ')}&nbsp;% si no da</>}.</>
              : 'Este lead todavía no tiene monto presupuestado.'}
          </p>
          <div style={{ display: 'flex', gap: 9, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: c.text }}>
              Seña
              <input type="number" min={0} max={100} value={pct} disabled={unico}
                onChange={(event) => setPct(Number(event.target.value))}
                style={{ ...field, width: 72, opacity: unico ? .5 : 1 }} />
              %
            </label>
            <span style={{ fontFamily: 'monospace', fontSize: 12, color: c.textDim }}>
              = ${(unico ? (monto ?? 0) : depositAt(monto ?? 0, pct)).toLocaleString('es-AR')}
            </span>
            {suggestion.allowsSinglePayment && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: c.text }}>
                <input type="checkbox" checked={unico} onChange={(event) => setUnico(event.target.checked)} />
                Pago único
              </label>
            )}
            {button('Registrar', () => void send({
              event: 'pago_recibido',
              pago_unico: unico,
              sena_pct: unico ? 100 : pct,
              sena_monto: unico ? (monto ?? 0) : depositAt(monto ?? 0, pct),
            }))}
          </div>
        </div>
      )}

      {asking === 'factura' && (
        <div style={{ marginTop: 12, display: 'flex', gap: 9, alignItems: 'center', flexWrap: 'wrap' }}>
          <input value={factura} onChange={(event) => setFactura(event.target.value)}
            aria-label="Número de factura"
            placeholder="Número de factura emitida"
            style={{ ...field, flex: '1 1 220px' }} />
          {button('Guardar', () => void send({ event: 'facturado', factura_numero: factura }))}
        </div>
      )}

      {asking === 'perdido' && (
        <div style={{ marginTop: 12, display: 'flex', gap: 9, alignItems: 'center', flexWrap: 'wrap' }}>
          <input value={motivo} onChange={(event) => setMotivo(event.target.value)}
            aria-label="Motivo por el que se perdió"
            placeholder="¿Por qué se perdió? Sirve para la próxima propuesta"
            style={{ ...field, flex: '1 1 260px' }} />
          {button('Marcar perdida', () => void send({ event: 'perdido', motivo }), c.late)}
        </div>
      )}

      {/* El borrador se muestra editable: sale lo que vos aprobás, no lo que
          escribió el modelo. Es la misma frontera del secretario. */}
      {draft && (
        <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: 'monospace', fontSize: 9.5, letterSpacing: '0.15em',
              textTransform: 'uppercase', color: c.incomplete, fontWeight: 700,
            }}>Borrador — revisalo antes de mandar</span>
            {draft.provider && (
              <span style={{ fontFamily: 'monospace', fontSize: 10, color: c.textDim }}>{draft.provider}</span>
            )}
          </div>

          <input value={draft.subject} aria-label="Asunto del seguimiento"
            onChange={(event) => setDraft({ ...draft, subject: event.target.value })}
            style={field} />

          <textarea value={draft.body} aria-label="Texto del seguimiento"
            onChange={(event) => setDraft({ ...draft, body: event.target.value })}
            style={{ ...field, minHeight: 150, lineHeight: 1.6, resize: 'vertical' }} />

          <div style={{ display: 'flex', gap: 7 }}>
            {button('Enviar seguimiento', () => void sendDraft())}
            {button('Descartar', () => setDraft(null), c.textDim)}
          </div>
        </div>
      )}

      {error && <p role="alert" style={{ margin: '9px 0 0', fontSize: 12, color: c.late }}>{error}</p>}
    </section>
  );
}
