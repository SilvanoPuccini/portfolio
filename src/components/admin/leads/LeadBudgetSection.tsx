'use client';

import { s } from '@/components/admin/AdminShell';
import { c } from '@/components/admin/tokens';
import { CatalogPicker } from './CatalogPicker';
import { PertModuleRow } from './PertModuleRow';
import type { Presupuesto } from '@/lib/leads/presupuesto';
import type { Lead, PertRow, RateConfig } from '@/lib/leads/types';

/**
 * La estimación y lo que sale de ella.
 *
 * Es la sección más pesada de la ficha, y su lista de props lo refleja: acá se
 * calcula el precio, se guarda, y desde acá salen la propuesta y el contrato.
 * Que necesite tantas cosas no es un defecto del corte — es cuánto hace esta
 * parte, que antes quedaba escondido entre las otras setecientas líneas.
 */
export function LeadBudgetSection(props: {
  lead: Lead;
  rateConfig: RateConfig;
  baseModules: PertRow[];
  featureModules: PertRow[];
  /** El presupuesto ya armado: catálogo primero, estimación solo para el resto. */
  presupuesto: Presupuesto;
  paqueteSlug: string | null;
  extrasIds: string[];
  onPaquete: (slug: string | null) => void;
  onExtra: (id: string, elegido: boolean) => void;
  updatePertRow: (slug: string, field: 'o' | 'm' | 'p' | 'selected', value: number | boolean) => void;
  saveBudget: () => void;
  budgetSaved: boolean;
  /** Lo que se cobra por mes después de entregar. Va aparte del proyecto. */
  mantenimiento: string;
  onMantenimiento: (value: string) => void;
  fmt: (iso: string) => string;
}) {
  const {
    lead, rateConfig, baseModules, featureModules, presupuesto,
    paqueteSlug, extrasIds, onPaquete, onExtra,
    updatePertRow, saveBudget, budgetSaved, mantenimiento, onMantenimiento,
  } = props;

  return (
    <>
      <p style={s.hint}>
        Primero el catálogo. La estimación por horas queda para lo que no entra en ningún paquete.
      </p>

      {/* Service Context panel — task 8.5 */}
      {lead.service_data && (
        <div style={{
          background: 'rgba(0,212,212,0.04)',
          border: '1px solid rgba(0,212,212,0.2)',
          borderRadius: 8,
          padding: '14px 16px',
          marginTop: 16,
          marginBottom: 8,
        }}>
          <p style={{ ...s.label, color: '#00d4d4', marginBottom: 10 }}>Contexto del servicio</p>
          {lead.service && (
            <p style={{ fontSize: 13, color: '#00d4d4', fontFamily: 'monospace', margin: '0 0 8px' }}>
              {lead.service}
            </p>
          )}
          {Object.entries(lead.service_data).slice(0, 5).map(([key, val]) => (
            <div key={key} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: c.textDim, fontFamily: 'monospace', minWidth: 120 }}>
                {key}
              </span>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                {typeof val === 'object' ? JSON.stringify(val) : String(val ?? '—')}
              </span>
            </div>
          ))}
        </div>
      )}

      <CatalogPicker
        paqueteSlug={paqueteSlug}
        extrasIds={extrasIds}
        onPaquete={onPaquete}
        onExtra={onExtra}
      />

      <div style={{ marginTop: 22, borderTop: '1px solid #1e293b', paddingTop: 16 }}>
        <p style={{ ...s.label, marginBottom: 2, color: '#94a3b8' }}>Fuera de catálogo</p>
        <p style={s.hint}>
          PERT = (O + 4M + P) / 6 · Buffer {rateConfig.buffer_pct}% · ${rateConfig.tarifa_hora}/hr.
          Lo que el paquete o un extra ya cubren no se cobra de nuevo, aunque quede tildado.
        </p>
      </div>

      {/* Base modules */}
      {baseModules.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <p style={{ ...s.label, marginBottom: 10, color: '#94a3b8' }}>Base</p>
          {baseModules.map((row) => (
            <PertModuleRow key={row.slug} row={row} onChange={updatePertRow} />
          ))}
        </div>
      )}

      {/* Feature modules */}
      {featureModules.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <p style={{ ...s.label, marginBottom: 10, color: '#94a3b8' }}>Módulos</p>
          {featureModules.map((row) => (
            <PertModuleRow key={row.slug} row={row} onChange={updatePertRow} />
          ))}
        </div>
      )}

      {/* Summary */}
      <div style={{ marginTop: 24, borderTop: '1px solid #1e293b', paddingTop: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 360 }}>
          <div>
            <p style={{ ...s.label, marginBottom: 2 }}>Del catálogo</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>
              ${presupuesto.catalogoUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <p style={{ ...s.label, marginBottom: 2 }}>A medida ({presupuesto.horasMedida.toFixed(1)}h)</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>
              ${presupuesto.medidaUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="mantenimiento" style={{ ...s.label, marginBottom: 4 }}>
              Mantenimiento mensual (USD, opcional)
            </label>
            <input
              id="mantenimiento"
              type="number"
              min={0}
              style={{ ...s.input, maxWidth: 160 }}
              value={mantenimiento}
              onChange={(event) => onMantenimiento(event.target.value)}
            />
            <p style={s.hint}>
              Hosting, seguridad, backups y cambios chicos. Va aparte del proyecto y sale en la propuesta.
            </p>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <p style={{ ...s.label, marginBottom: 2 }}>Total estimado</p>
            <p style={{ fontSize: 26, fontWeight: 700, color: '#00d4d4', margin: 0 }}>
              ${presupuesto.totalUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
            {presupuesto.mensualUsd > 0 && (
              <p style={{ ...s.hint, marginTop: 4 }}>
                Más ${presupuesto.mensualUsd.toLocaleString('en-US')} por mes, que no entra en el total del proyecto.
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18 }}>
          <button style={s.btn} onClick={saveBudget}>Guardar presupuesto</button>
          {budgetSaved && <p style={s.successText}>Guardado</p>}
        </div>

        {lead.monto_presupuestado != null && (
          <p style={{ ...s.hint, marginTop: 8 }}>
            Último guardado: ${lead.monto_presupuestado.toLocaleString('en-US')} ({lead.horas_calculadas}h)
          </p>
        )}

      </div>
    </>
  );
}
