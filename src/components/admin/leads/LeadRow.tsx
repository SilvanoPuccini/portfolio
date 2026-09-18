'use client';

import { c, tint } from '@/components/admin/tokens';
import { labelForState, NEXT_ACTION, phaseIndex, PIPELINE } from '@/lib/leads/pipeline';
import { rowSummary, type LeadRow as Row } from '@/lib/leads/row-summary';

/**
 * Una venta por fila.
 *
 * Tres cosas que la tabla anterior no hacía. La barra de fases dice dónde está
 * sin leer una palabra. La línea de abajo convierte el silencio en información
 * —«hace 9 días» es un dato, «en conversación» no lo es—. Y el botón cambia
 * según la fase, porque lo que sigue depende de dónde está: no es un «Abrir»
 * repetido cinco veces.
 */

const TONE: Record<string, string> = {
  nuevo: c.ready,
  llamada_agendada: c.ready,
  no_show: c.late,
  'en conversación': c.incomplete,
  presupuestado: '#818cf8',
  contrato_enviado: '#818cf8',
  contrato_firmado: '#818cf8',
  cerrado: c.published,
  facturado: c.published,
  entregado: c.published,
  descartado: c.hairline,
};

/** Lo que corresponde hacer, cuando no es simplemente abrir la ficha. */
function actionLabel(estado: string, risk: boolean): string {
  if (estado === 'no_show') return 'Reagendar';
  if (estado === 'presupuestado' && risk) return 'Seguimiento';
  return NEXT_ACTION[estado]?.label ?? 'Abrir';
}

export function LeadRow({ lead, now, onOpen }: {
  lead: Row; now: Date; onOpen: () => void;
}) {
  const { line, risk } = rowSummary(lead, now);
  const tone = risk ? c.late : TONE[lead.estado] ?? c.hairline;
  const at = phaseIndex(lead.estado);

  return (
    <div role="button" tabIndex={0} onClick={onOpen}
      onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onOpen(); } }}
      aria-label={`${lead.nombre} · ${labelForState(lead.estado)} · ${line}`}
      className="transition-colors hover:bg-[rgba(0,212,212,0.04)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
      style={{
        display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto',
        gap: '8px 14px', padding: '12px 16px', alignItems: 'center',
        borderBottom: `1px solid ${c.border}`, cursor: 'pointer',
      }}>

      <div style={{ minWidth: 0, display: 'grid', gap: 3 }}>
        <span style={{
          fontSize: 13.5, color: c.text, fontWeight: 600,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {lead.nombre}{lead.tipo_proyecto ? ` · ${lead.tipo_proyecto}` : ''}
        </span>
        <span style={{
          fontFamily: 'monospace', fontSize: 10.5,
          color: risk ? c.late : c.textDim,
        }}>{line}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <span style={{
          fontFamily: 'monospace', fontSize: 12, color: c.text,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {lead.monto_presupuestado != null ? `$${lead.monto_presupuestado.toLocaleString('es-AR')}` : '—'}
        </span>

        <span aria-hidden title={labelForState(lead.estado)} style={{ display: 'flex', gap: 2 }}>
          {PIPELINE.map((phase, index) => (
            <i key={phase} style={{
              width: 13, height: 5, borderRadius: 1, display: 'block',
              background: index <= at ? (risk && index === at ? c.late : tone) : c.border,
            }} />
          ))}
        </span>

        <span style={{
          fontFamily: 'monospace', fontSize: 9.5, letterSpacing: '0.09em',
          textTransform: 'uppercase', fontWeight: 600, whiteSpace: 'nowrap',
          padding: '2px 8px', borderRadius: 5,
          background: tint(tone, '1f'), color: tone,
        }}>{labelForState(lead.estado)}</span>

        <span style={{
          fontFamily: 'monospace', fontSize: 10, whiteSpace: 'nowrap',
          padding: '3px 10px', borderRadius: 6,
          border: `1px solid ${risk ? tint(c.late, '80') : c.border}`,
          color: risk ? c.late : c.textDim,
        }}>{actionLabel(lead.estado, risk)}</span>
      </div>
    </div>
  );
}
