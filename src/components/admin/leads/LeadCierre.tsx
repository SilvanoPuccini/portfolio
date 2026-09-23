'use client';

import { Check, CircleDashed, CircleDot, Eye, Lock, TriangleAlert } from 'lucide-react';

import { s } from '@/components/admin/AdminShell';
import { c } from '@/components/admin/tokens';
import { pasosDelCierre, type EstadoPaso, type LeadParaCierre } from '@/lib/leads/cierre';

/**
 * El cierre de la venta: los cuatro pasos, en orden, con su estado.
 *
 * Antes estas acciones vivían sueltas adentro de la calculadora de
 * presupuesto: cuatro botones de cuatro colores, y nada decía cuál era el que
 * tocaba. Había que acordarse del circuito.
 *
 * Acá cada paso es una fila. La que toca es la única con botón lleno; las
 * demás quedan al costado sin competir por la atención. El color solo indica
 * estado, nunca decora.
 */

const ICONO: Record<EstadoPaso, typeof Check> = {
  hecho: Check,
  toca: CircleDot,
  revisar: TriangleAlert,
  espera: CircleDashed,
  bloqueado: Lock,
};

const COLOR: Record<EstadoPaso, string> = {
  hecho: '#4ade80',
  toca: '#00d4d4',
  revisar: '#facc15',
  espera: c.textDim,
  bloqueado: c.textDim,
};

export function LeadCierre({
  lead,
  fmt,
  enviarPropuesta,
  propuestaEnviando,
  enviarContrato,
  contratoEnviando,
  descargarContrato,
  contratoDescargando,
  registrarCobro,
  facturar,
  urlDelCliente,
  aviso,
}: {
  lead: LeadParaCierre & {
    proposal_sent_at: string | null;
    contract_sent_at: string | null;
    contrato_firmado_at: string | null;
    factura_numero: string | null;
  };
  fmt: (iso: string) => string;
  enviarPropuesta: () => void;
  propuestaEnviando: boolean;
  enviarContrato: () => void;
  contratoEnviando: boolean;
  descargarContrato: () => void;
  contratoDescargando: boolean;
  registrarCobro?: () => void;
  facturar?: () => void;
  urlDelCliente?: string | null;
  /** Lo último que dijo el envío: se muestra donde ocurrió, no arriba de todo. */
  aviso?: { texto: string; error?: boolean } | null;
}) {
  const pasos = pasosDelCierre(lead);

  /** Cuándo pasó cada cosa, para que la fila no sea solo un tilde. */
  const cuando: Record<string, string | null> = {
    propuesta: lead.proposal_sent_at,
    contrato: lead.contrato_firmado_at ?? lead.contract_sent_at,
    factura: null,
  };

  const acciones: Record<string, { label: string; onClick?: () => void; cargando?: boolean }> = {
    propuesta: {
      label: lead.proposal_sent_at ? 'Reenviar propuesta' : 'Enviar propuesta',
      onClick: enviarPropuesta,
      cargando: propuestaEnviando,
    },
    contrato: {
      label: lead.contract_sent_at ? 'Reenviar contrato' : 'Enviar contrato',
      onClick: enviarContrato,
      cargando: contratoEnviando,
    },
    pago: { label: 'Registrar el cobro', onClick: registrarCobro },
    factura: { label: 'Cargar la factura', onClick: facturar },
  };

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {pasos.map((paso) => {
        const Icono = ICONO[paso.estado];
        const accion = acciones[paso.id];
        const esElQueToca = paso.estado === 'toca' || paso.estado === 'revisar';
        const fecha = cuando[paso.id];

        return (
          <div
            key={paso.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
              padding: '12px 14px', borderRadius: 8,
              background: esElQueToca ? 'rgba(0,212,212,0.05)' : 'transparent',
              border: `1px solid ${esElQueToca ? 'rgba(0,212,212,0.2)' : '#1e293b'}`,
              opacity: paso.estado === 'bloqueado' ? 0.55 : 1,
            }}
          >
            <Icono size={15} color={COLOR[paso.estado]} aria-hidden="true" />

            <div style={{ flex: 1, minWidth: 140 }}>
              <p style={{ margin: 0, fontSize: 13.5, color: c.text }}>{paso.titulo}</p>
              {(paso.detalle || (paso.estado === 'hecho' && fecha)) && (
                <p style={{ margin: '2px 0 0', fontSize: 11.5, color: c.textDim }}>
                  {paso.detalle ?? `El ${fmt(fecha as string)}`}
                </p>
              )}
              {paso.id === 'factura' && lead.factura_numero && (
                <p style={{ margin: '2px 0 0', fontSize: 11.5, color: c.textDim }}>
                  {lead.factura_numero}
                </p>
              )}
            </div>

            {accion?.onClick && paso.estado !== 'bloqueado' && (
              <button
                onClick={accion.onClick}
                disabled={accion.cargando}
                style={{
                  ...(esElQueToca ? s.btn : s.btnGhost),
                  opacity: accion.cargando ? 0.6 : 1,
                  fontSize: 12.5,
                  padding: '7px 14px',
                }}
              >
                {accion.cargando ? 'Enviando…' : accion.label}
              </button>
            )}
          </div>
        );
      })}

      {aviso && (
        <p style={aviso.error ? s.errorText : s.successText}>{aviso.texto}</p>
      )}

      {/* Lo de al costado: ver y descargar no son pasos del circuito. */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
        {urlDelCliente && (
          <a
            href={urlDelCliente}
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...s.btnGhost, textDecoration: 'none', fontSize: 12.5, padding: '7px 14px' }}
          >
            <Eye size={13} aria-hidden="true" style={{ marginRight: 6, verticalAlign: '-2px' }} />
            Ver como lo ve el cliente
          </a>
        )}
        <button
          onClick={descargarContrato}
          disabled={contratoDescargando}
          style={{ ...s.btnGhost, fontSize: 12.5, padding: '7px 14px', opacity: contratoDescargando ? 0.6 : 1 }}
        >
          {contratoDescargando ? 'Generando…' : 'Descargar el contrato'}
        </button>
      </div>
    </div>
  );
}
