'use client';

import { s } from '@/components/admin/AdminShell';
import { c } from '@/components/admin/tokens';
import type { Lead } from '@/lib/leads/types';

/**
 * Qué pasó con esta venta, en orden.
 *
 * Los hitos estaban repartidos entre la barra de avance, la calculadora y la
 * base: la propuesta decía su fecha en un lado, la respuesta del cliente en
 * otro, y el contrato firmado en ninguno. Para saber por qué una venta está
 * donde está había que reconstruirla de memoria.
 *
 * Solo muestra lo que pasó. Lo que hay que hacer ahora vive arriba, en la
 * barra de avance: son dos preguntas distintas y mezclarlas fue el problema.
 */
export function LeadSaleHistory({ lead, fmt }: { lead: Lead; fmt: (iso: string) => string }) {
  const events: { at: string | null | undefined; label: string; detail?: string | null }[] = [
    { at: lead.created_at, label: 'Entró por el formulario' },
    { at: lead.fecha_llamada, label: 'Llamada agendada' },
    { at: lead.proposal_sent_at, label: 'Propuesta enviada' },
    {
      at: lead.propuesta_respondida_at,
      label: lead.propuesta_respuesta === 'aceptada' ? 'Aceptó la propuesta' : 'Dijo que no a la propuesta',
      detail: lead.propuesta_rechazo_motivo,
    },
    { at: lead.ultimo_contacto_at, label: 'Seguimiento enviado' },
    { at: lead.contract_sent_at, label: 'Contrato enviado' },
    { at: lead.contrato_abierto_at, label: 'Abrió el contrato' },
    { at: lead.contrato_rechazado_at, label: 'Rechazó el contrato', detail: lead.contrato_rechazo_motivo },
    { at: lead.contrato_vencido_at, label: 'El contrato venció sin firma' },
    { at: lead.contrato_firmado_at, label: 'Firmó el contrato' },
    { at: lead.kickoff_at, label: 'Agendó el kickoff' },
    { at: lead.cobrado_at, label: 'Pago registrado' },
    { at: lead.factura_at, label: `Facturado${lead.factura_numero ? ` · ${lead.factura_numero}` : ''}` },
    { at: lead.entregado_at, label: 'Entregado' },
  ];

  const done = events
    .filter((event): event is { at: string; label: string; detail?: string | null } => Boolean(event.at))
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));

  if (done.length === 0) return <p style={s.hint}>Todavía no pasó nada con esta venta.</p>;

  return (
    <div style={{ display: 'grid', gap: 9 }}>
      {done.map((event) => (
        <div key={`${event.label}-${event.at}`} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
          <span style={{ fontFamily: 'monospace', fontSize: 11, color: c.textDim, flexShrink: 0, minWidth: 128 }}>
            {fmt(event.at)}
          </span>
          <span style={{ fontSize: 13.5, color: c.text, lineHeight: 1.5 }}>
            {event.label}
            {event.detail && <span style={{ color: c.textSoft }}> — {event.detail}</span>}
          </span>
        </div>
      ))}

      {lead.contrato_pdf_path && (
        <a
          href={`/api/admin/leads/${lead.id}/contract-pdf`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...s.btnGhost, marginTop: 6, display: 'inline-block', width: 'fit-content', textDecoration: 'none' }}
        >
          Ver contrato firmado ↗
        </a>
      )}
    </div>
  );
}
